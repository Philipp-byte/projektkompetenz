/* ============================================================================
   store.js – Datenhaltung
   ----------------------------------------------------------------------------
   Alle Anmeldungen liegen in EINEM Datensatz. Das hat einen wichtigen Vorteil:
   Änderungen laufen als Transaktion. Wenn zwei Schüler im selben Moment den
   letzten freien Platz antippen, bekommt genau einer den Platz – der andere
   eine saubere Meldung. Kein doppelt belegter Platz.

   Zwei Betriebsarten:
     • ONLINE  – Firebase/Firestore, alle Geräte sehen dasselbe, live.
     • DEMO    – ohne Datenbank; alles funktioniert, aber nur auf diesem Gerät.
   ========================================================================= */

window.Store = (function () {
  'use strict';

  const C = window.CONFIG;
  const DEMO_KEY = 'pk-demo-' + C.datensatz;

  let modus = 'demo';          // 'online' | 'demo'
  let db = null;
  let ref = null;
  let listener = null;
  let letzterStand = leererStand();
  let kanal = null;

  /* ---------------------------------------------------------------- Helfer */

  function leererStand() {
    return { anmeldungen: {}, log: [], extraPlaetze: {}, gesperrt: false, stand: null };
  }

  // Akzentzeichen (U+0300–U+036F) werden über einen zusammengebauten regulären
  // Ausdruck entfernt – so steht kein unsichtbares Sonderzeichen im Quelltext.
  const AKZENTE = new RegExp('[\\u0300-\\u036f]', 'g');

  function normalisieren(text) {
    return String(text || '')
      .toLowerCase().trim()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .normalize('NFD').replace(AKZENTE, '')
      .replace(/[^a-z0-9]+/g, '');
  }

  /** Eindeutiger Schlüssel je Person: Klasse + Nachname + Vorname. */
  function schluessel(vorname, nachname, klasse) {
    return normalisieren(klasse) + '~' + normalisieren(nachname) + '~' + normalisieren(vorname);
  }

  /** Saubere Schreibweise: "max   MUSTERMANN" -> "Max Mustermann" */
  function huebsch(text) {
    return String(text || '').trim().replace(/\s+/g, ' ')
      .split(/(\s|-)/)
      .map(t => (t === ' ' || t === '-') ? t : t.charAt(0).toLocaleUpperCase('de') + t.slice(1).toLocaleLowerCase('de'))
      .join('');
  }

  function geraeteId() {
    let id = null;
    try { id = localStorage.getItem('pk-geraet'); } catch (e) { /* Privatmodus */ }
    if (!id) {
      id = 'g' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
      try { localStorage.setItem('pk-geraet', id); } catch (e) { /* egal */ }
    }
    return id;
  }

  function projektById(id) {
    return C.projekte.find(p => p.id === id) || null;
  }

  /** Ist ein Projekt für diese Klasse offen? Ohne nurKlassen: für alle.
      Gilt nur für die Selbstanmeldung – die Lehrkraft darf jeden zuordnen. */
  function klasseDarf(projekt, klasse) {
    if (!projekt || !projekt.nurKlassen || !projekt.nurKlassen.length) return true;
    return projekt.nurKlassen.indexOf(klasse) > -1;
  }

  /** Belegung eines Projekts: benutzt, maximal (inkl. Aufstockung), frei. */
  function belegung(stand, projektId) {
    const p = projektById(projektId);
    if (!p) return { benutzt: 0, max: 0, frei: 0, aufgestockt: 0 };
    const extra = Number((stand.extraPlaetze || {})[projektId] || 0);
    const benutzt = Object.values(stand.anmeldungen || {}).filter(a => a.projektId === projektId).length;
    const max = p.plaetze + extra;
    return { benutzt, max, frei: Math.max(0, max - benutzt), aufgestockt: extra };
  }

  function teilnehmer(stand, projektId) {
    return Object.values(stand.anmeldungen || {})
      .filter(a => a.projektId === projektId)
      .sort((a, b) => (a.nachname + a.vorname).localeCompare(b.nachname + b.vorname, 'de'));
  }

  function alleAnmeldungen(stand) {
    return Object.values(stand.anmeldungen || {}).sort((a, b) =>
      (a.klasse + a.nachname + a.vorname).localeCompare(b.klasse + b.nachname + b.vorname, 'de'));
  }

  function logEintrag(stand, eintrag) {
    stand.log = stand.log || [];
    stand.log.unshift(Object.assign({ zeit: new Date().toISOString() }, eintrag));
    if (stand.log.length > 150) stand.log.length = 150;
  }

  /** Firestore verträgt kein undefined – vor dem Schreiben aufräumen. */
  function saeubern(objekt) {
    return JSON.parse(JSON.stringify(objekt, (k, v) => (v === undefined ? null : v)));
  }

  /* ------------------------------------------------------------ Verbindung */

  function istKonfiguriert() {
    return !!(C.firebase && C.firebase.projectId && C.firebase.apiKey);
  }

  const FIREBASE_VERSION = '10.12.5';

  function skriptLaden(url) {
    return new Promise((fertig, fehler) => {
      const s = document.createElement('script');
      s.src = url;
      s.onload = fertig;
      s.onerror = () => fehler(new Error('Konnte nicht geladen werden: ' + url));
      document.head.appendChild(s);
    });
  }

  /* Firebase wird nur nachgeladen, wenn es auch eingerichtet ist. Im
     Demo-Modus bleibt die Seite dadurch spürbar schneller.                 */
  async function firebaseLaden() {
    if (window.firebase && window.firebase.firestore) return true;
    const basis = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/';
    await skriptLaden(basis + 'firebase-app-compat.js');
    await skriptLaden(basis + 'firebase-firestore-compat.js');
    return !!(window.firebase && window.firebase.firestore);
  }

  /**
   * Startet die Datenhaltung.
   * @param {(stand:Object, modus:string)=>void} beiAenderung – wird bei jeder Änderung gerufen
   */
  async function init(beiAenderung) {
    listener = beiAenderung;

    if (istKonfiguriert()) {
      try {
        await firebaseLaden();
        firebase.initializeApp(C.firebase);
        db = firebase.firestore();
        ref = db.collection('projektkompetenz').doc(C.datensatz);
        modus = 'online';
        let hatteDaten = false;
        ref.onSnapshot(
          snap => {
            /* Firestore meldet beim Start zuerst einen Schnappschuss aus dem
               eigenen Zwischenspeicher. Der kann leer sein, obwohl auf dem
               Server längst Anmeldungen stehen. Solchen Schnappschuss
               verwerfen wir – sonst sieht die Seite kurz aus, als wären alle
               Anmeldungen verschwunden.                                     */
            const ausZwischenspeicher = snap.metadata && snap.metadata.fromCache;
            if (!snap.exists && ausZwischenspeicher && hatteDaten) return;
            if (snap.exists) hatteDaten = true;

            letzterStand = snap.exists ? Object.assign(leererStand(), snap.data()) : leererStand();
            listener(letzterStand, modus);
          },
          fehler => {
            console.error('[Store] Firestore-Fehler:', fehler);
            modus = 'fehler';
            listener(letzterStand, modus, fehler);
          }
        );
        return modus;
      } catch (e) {
        console.error('[Store] Firebase-Start fehlgeschlagen, weiter im Demo-Modus:', e);
      }
    }

    /* --- Demo-Modus --- */
    modus = 'demo';
    letzterStand = demoLesen();
    try {
      kanal = new BroadcastChannel(DEMO_KEY);
      kanal.onmessage = () => { letzterStand = demoLesen(); listener(letzterStand, modus); };
    } catch (e) { /* ältere Browser */ }
    window.addEventListener('storage', ev => {
      if (ev.key === DEMO_KEY) { letzterStand = demoLesen(); listener(letzterStand, modus); }
    });
    setTimeout(() => listener(letzterStand, modus), 0);
    return modus;
  }

  function demoLesen() {
    try {
      const roh = localStorage.getItem(DEMO_KEY);
      return roh ? Object.assign(leererStand(), JSON.parse(roh)) : leererStand();
    } catch (e) { return leererStand(); }
  }

  function demoSchreiben(stand) {
    try { localStorage.setItem(DEMO_KEY, JSON.stringify(stand)); } catch (e) { /* voll */ }
    if (kanal) { try { kanal.postMessage('x'); } catch (e) { /* egal */ } }
  }

  /**
   * Ändert den Stand als Transaktion.
   * @param {(stand:Object)=>any} aendern – darf werfen; dann wird nichts gespeichert
   * @returns {Promise<{ok:boolean, wert?:any, fehler?:string}>}
   */
  async function schreiben(aendern) {
    if (modus === 'online') {
      try {
        let letzteFassung = null;
        const wert = await db.runTransaction(async tx => {
          const snap = await tx.get(ref);
          const stand = snap.exists ? Object.assign(leererStand(), snap.data()) : leererStand();
          const r = aendern(stand);
          stand.stand = new Date().toISOString();
          tx.set(ref, saeubern(stand));
          letzteFassung = stand;   // bei einem Neuversuch gilt der letzte Durchlauf
          return r;
        });

        /* Die Transaktion ist durch, der Schnappschuss vom Server kommt aber
           erst kurz danach. Ohne diese Zeile würde die Oberfläche einen
           Augenblick lang so tun, als hätte es die Änderung nie gegeben –
           genau daran ist die Bestätigungsseite vorher gescheitert.        */
        if (letzteFassung) {
          letzterStand = letzteFassung;
          listener(letzterStand, modus);
        }
        return { ok: true, wert };
      } catch (e) {
        return { ok: false, fehler: e && e.message ? e.message : String(e) };
      }
    }
    /* Demo */
    try {
      const stand = demoLesen();
      const wert = aendern(stand);
      stand.stand = new Date().toISOString();
      demoSchreiben(stand);
      letzterStand = stand;
      listener(letzterStand, modus);
      return { ok: true, wert };
    } catch (e) {
      return { ok: false, fehler: e && e.message ? e.message : String(e) };
    }
  }

  /* -------------------------------------------------- Fachliche Funktionen */

  /**
   * Schüler meldet sich an oder wechselt das Projekt.
   * Prüft in derselben Transaktion, ob noch ein Platz frei ist.
   */
  async function anmelden({ vorname, nachname, klasse, projektId }) {
    const vn = huebsch(vorname), nn = huebsch(nachname);
    const key = schluessel(vn, nn, klasse);
    const geraet = geraeteId();

    return schreiben(stand => {
      if (stand.gesperrt) throw new Error('Die Anmeldung wurde von der Lehrkraft geschlossen.');

      const projekt = projektById(projektId);
      if (!projekt) throw new Error('Dieses Projekt gibt es nicht.');
      if (!klasseDarf(projekt, klasse)) throw new Error('KLASSE');

      const vorher = stand.anmeldungen[key] || null;
      if (vorher && vorher.projektId === projektId) return { key, unveraendert: true };

      const b = belegung(stand, projektId);
      if (b.frei <= 0) throw new Error('VOLL');

      const jetzt = new Date().toISOString();
      if (vorher) {
        const verlauf = (vorher.verlauf || []).slice();
        verlauf.push({ von: vorher.projektId, nach: projektId, zeit: jetzt, wer: 'schueler' });
        stand.anmeldungen[key] = Object.assign({}, vorher, {
          projektId, geaendert: jetzt, wechsel: (vorher.wechsel || 0) + 1,
          verlauf, vonLehrkraft: false, geraet
        });
        logEintrag(stand, {
          art: 'wechsel', name: nn + ', ' + vn, klasse,
          von: vorher.projektId, nach: projektId, wer: 'schueler'
        });
      } else {
        stand.anmeldungen[key] = {
          key, vorname: vn, nachname: nn, klasse, projektId,
          erstellt: jetzt, geaendert: jetzt, wechsel: 0,
          verlauf: [{ von: null, nach: projektId, zeit: jetzt, wer: 'schueler' }],
          vonLehrkraft: false, geraet
        };
        logEintrag(stand, {
          art: 'neu', name: nn + ', ' + vn, klasse, von: null, nach: projektId, wer: 'schueler'
        });
      }
      return { key, gewechselt: !!vorher };
    });
  }

  /** Lehrkraft verschiebt eine Person – darf das Limit überschreiten. */
  async function verschieben(key, projektId, { limitUeberschreiben = false } = {}) {
    return schreiben(stand => {
      const a = stand.anmeldungen[key];
      if (!a) throw new Error('Diese Anmeldung gibt es nicht mehr.');
      if (a.projektId === projektId) return { unveraendert: true };

      if (projektId && !limitUeberschreiben) {
        const b = belegung(stand, projektId);
        if (b.frei <= 0) throw new Error('VOLL');
      }
      const jetzt = new Date().toISOString();
      const verlauf = (a.verlauf || []).slice();
      verlauf.push({ von: a.projektId, nach: projektId, zeit: jetzt, wer: 'lehrkraft' });
      stand.anmeldungen[key] = Object.assign({}, a, {
        projektId, geaendert: jetzt, wechsel: (a.wechsel || 0) + 1, verlauf, vonLehrkraft: true
      });
      logEintrag(stand, {
        art: 'verschoben', name: a.nachname + ', ' + a.vorname, klasse: a.klasse,
        von: a.projektId, nach: projektId, wer: 'lehrkraft'
      });
      return { ok: true };
    });
  }

  /** Lehrkraft trägt eine Person von Hand ein (z. B. Nachzügler ohne Handy). */
  async function eintragen({ vorname, nachname, klasse, projektId, limitUeberschreiben = false }) {
    const vn = huebsch(vorname), nn = huebsch(nachname);
    const key = schluessel(vn, nn, klasse);
    return schreiben(stand => {
      if (stand.anmeldungen[key]) throw new Error('Diese Person ist bereits eingetragen.');
      if (projektId && !limitUeberschreiben) {
        const b = belegung(stand, projektId);
        if (b.frei <= 0) throw new Error('VOLL');
      }
      const jetzt = new Date().toISOString();
      stand.anmeldungen[key] = {
        key, vorname: vn, nachname: nn, klasse, projektId: projektId || null,
        erstellt: jetzt, geaendert: jetzt, wechsel: 0,
        verlauf: [{ von: null, nach: projektId || null, zeit: jetzt, wer: 'lehrkraft' }],
        vonLehrkraft: true, geraet: null
      };
      logEintrag(stand, {
        art: 'neu', name: nn + ', ' + vn, klasse, von: null, nach: projektId || null, wer: 'lehrkraft'
      });
      return { key };
    });
  }

  async function entfernen(key) {
    return schreiben(stand => {
      const a = stand.anmeldungen[key];
      if (!a) return { unveraendert: true };
      delete stand.anmeldungen[key];
      logEintrag(stand, {
        art: 'entfernt', name: a.nachname + ', ' + a.vorname, klasse: a.klasse,
        von: a.projektId, nach: null, wer: 'lehrkraft'
      });
      return { ok: true };
    });
  }

  /** Plätze eines Projekts aufstocken oder zurücknehmen (Lehrkraft). */
  async function plaetzeAendern(projektId, differenz) {
    return schreiben(stand => {
      const p = projektById(projektId);
      if (!p) throw new Error('Unbekanntes Projekt.');
      stand.extraPlaetze = stand.extraPlaetze || {};
      const neu = Number(stand.extraPlaetze[projektId] || 0) + Number(differenz);
      const benutzt = belegung(stand, projektId).benutzt;
      if (p.plaetze + neu < benutzt) throw new Error('So wenige Plätze gehen nicht – es sind schon ' + benutzt + ' Personen drin.');
      if (p.plaetze + neu < 1) throw new Error('Mindestens ein Platz muss übrig bleiben.');
      stand.extraPlaetze[projektId] = neu;
      logEintrag(stand, {
        art: 'plaetze', name: p.name, klasse: '', von: null, nach: projektId,
        wer: 'lehrkraft', info: (p.plaetze + neu) + ' Plätze'
      });
      return { neu };
    });
  }

  async function sperren(gesperrt) {
    return schreiben(stand => {
      stand.gesperrt = !!gesperrt;
      logEintrag(stand, { art: gesperrt ? 'gesperrt' : 'entsperrt', name: '', klasse: '', wer: 'lehrkraft' });
      return { gesperrt: stand.gesperrt };
    });
  }

  async function allesLoeschen() {
    return schreiben(stand => {
      stand.anmeldungen = {};
      stand.extraPlaetze = {};
      stand.log = [];
      logEintrag(stand, { art: 'zurueckgesetzt', name: '', klasse: '', wer: 'lehrkraft' });
      return { ok: true };
    });
  }

  /**
   * Echter Schreib-/Lesetest gegen die Datenbank.
   * Schreibt einen neuen Zeitstempel und liest ihn ausdrücklich vom Server
   * zurück (nicht aus dem Zwischenspeicher). Nur wenn das klappt, sehen
   * wirklich alle Geräte denselben Stand.
   */
  async function verbindungTesten() {
    if (modus !== 'online') {
      return { ok: false, modus, grund: 'demo' };
    }
    /* Ohne Zeitlimit würde der Test bei Netzproblemen ewig hängen –
       Firestore versucht es im Hintergrund unbegrenzt weiter.            */
    const zeitlimit = (versprechen, ms) => Promise.race([
      versprechen,
      new Promise((_, x) => setTimeout(() => x(new Error(
        'Keine Antwort innerhalb von ' + Math.round((ms || 12000) / 1000) + ' Sekunden.')), ms || 12000))
    ]);

    let r;
    try { r = await zeitlimit(schreiben(() => true)); }
    catch (e) { return { ok: false, modus, fehler: e.message }; }
    if (!r.ok) return { ok: false, modus, fehler: r.fehler };

    try {
      const snap = await zeitlimit(ref.get({ source: 'server' }));
      const d = snap.exists ? snap.data() : {};
      return {
        ok: !!snap.exists, modus,
        projekt: C.firebase.projectId,
        datensatz: C.datensatz,
        anmeldungen: Object.keys(d.anmeldungen || {}).length,
        stand: d.stand || null
      };
    } catch (e) {
      return { ok: false, modus, fehler: e && e.message ? e.message : String(e) };
    }
  }

  /* ------------------------------------------------------ Eigene Anmeldung */

  function eigenerSchluesselLesen() {
    try { return localStorage.getItem('pk-key-' + C.datensatz); } catch (e) { return null; }
  }
  function eigenerSchluesselMerken(key) {
    try { localStorage.setItem('pk-key-' + C.datensatz, key); } catch (e) { /* egal */ }
  }
  function eigenerSchluesselVergessen() {
    try { localStorage.removeItem('pk-key-' + C.datensatz); } catch (e) { /* egal */ }
  }

  return {
    init, schreiben,
    anmelden, verschieben, eintragen, entfernen, plaetzeAendern, sperren, allesLoeschen,
    verbindungTesten, istKonfiguriert,
    belegung, teilnehmer, alleAnmeldungen, projektById, klasseDarf,
    schluessel, huebsch, normalisieren,
    eigenerSchluesselLesen, eigenerSchluesselMerken, eigenerSchluesselVergessen,
    get modus() { return modus; },
    get stand() { return letzterStand; }
  };
})();

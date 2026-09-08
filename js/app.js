/* ============================================================================
   app.js – die Seite für die Schülerinnen und Schüler
   Drei Schritte: Name eintragen · Projekt wählen · Bestätigung.
   ========================================================================= */

(function () {
  'use strict';

  const C = window.CONFIG;
  const $ = id => document.getElementById(id);

  const zustand = {
    ansicht: 'name',        // name | projekte | fertig
    vorname: '', nachname: '', klasse: '',
    gewaehlt: null,
    key: null,
    filter: 'alle',
    letzteAnmeldung: null,
    bereit: false,
    sendet: false
  };

  /* ------------------------------------------------------------- Aufbau */

  function klassenAufbauen() {
    $('klassen').innerHTML = C.klassen.map(k =>
      '<button type="button" class="chip" data-klasse="' + UI.sicher(k) + '" aria-pressed="false">' +
      UI.sicher(k) + '</button>').join('');
    $('klassen').addEventListener('click', e => {
      const b = e.target.closest('.chip');
      if (!b) return;
      zustand.klasse = b.dataset.klasse;
      [...$('klassen').children].forEach(c => c.setAttribute('aria-pressed', String(c === b)));
      $('fehler-klasse').classList.remove('zeigen');
      pruefen();   // sonst bleibt der Weiter-Knopf gesperrt, wenn die Klasse zuletzt gewählt wird
    });
  }

  function filterAufbauen() {
    const knoepfe = [
      { id: 'alle', text: 'Alle Projekte' },
      { id: 'thornton', text: 'Frau Thornton' },
      { id: 'riegert', text: 'Herr Riegert' }
    ];
    $('filter').innerHTML = knoepfe.map(k =>
      '<button type="button" data-filter="' + k.id + '" aria-pressed="' +
      (k.id === zustand.filter) + '">' + k.text + '</button>').join('');
    $('filter').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      zustand.filter = b.dataset.filter;
      [...$('filter').children].forEach(c =>
        c.setAttribute('aria-pressed', String(c.dataset.filter === zustand.filter)));
      projekteZeichnen();
    });
  }

  function symboleSetzen() {
    $('zurueck').innerHTML = UI.symbol('zurueck', 18);
    $('hinweis-symbol').innerHTML = UI.symbol('info', 18);
    $('erfolg-ring').innerHTML = UI.symbol('check', 38);
    document.querySelectorAll('.hinweis > span:empty').forEach(s => {
      s.innerHTML = UI.symbol(s.parentElement.classList.contains('hinweis--rot') ? 'warn' : 'info', 18);
    });
    $('marke').textContent = 'Schuljahr ' + C.schuljahr;
  }

  /* ---------------------------------------------------------- Projekte */

  function passtZumFilter(p) {
    if (zustand.filter === 'alle') return true;
    return p.lehrkraft === zustand.filter || p.lehrkraft === 'beide';
  }

  function projekteZeichnen() {
    const stand = Store.stand;
    const meins = zustand.key ? (stand.anmeldungen[zustand.key] || null) : null;
    const meinProjekt = meins ? meins.projektId : null;

    $('gesperrt-hinweis').hidden = !stand.gesperrt;

    const html = C.projekte.filter(passtZumFilter).map(p => {
      const b = Store.belegung(stand, p.id);
      const istMeins = p.id === meinProjekt;
      const istGewaehlt = p.id === zustand.gewaehlt;
      const falscheKlasse = !Store.klasseDarf(p, zustand.klasse);
      const voll = b.frei <= 0 && !istMeins;
      const gesperrt = (voll || falscheKlasse) && !istMeins;

      const anteil = Math.min(100, Math.round((b.benutzt / Math.max(1, b.max)) * 100));
      const balkenKlasse = istMeins ? 'meins' : (b.frei <= 0 ? 'voll' : '');

      const marken = [];
      if (p.badge) marken.push('<span class="mini mini--hinweis">' + UI.sicher(p.badge) + '</span>');
      marken.push('<span class="mini mini--lehrkraft">' + UI.symbol('leute', 12) + ' ' +
                  UI.sicher(UI.lehrkraftName(p.lehrkraft)) + '</span>');
      if (falscheKlasse) marken.push('<span class="mini mini--voll">Nur ' +
                  UI.sicher(p.nurKlassen.join(' und ')) + '</span>');
      if (istMeins) marken.push('<span class="mini mini--gruen">' + UI.symbol('check', 12) + ' Dein Projekt</span>');
      else if (voll) marken.push('<span class="mini mini--voll">Belegt</span>');
      else if (!falscheKlasse && b.frei === 1) marken.push('<span class="mini mini--hinweis">Nur noch 1 Platz</span>');

      return '' +
      '<div class="projekt' + (gesperrt ? ' voll' : '') + (istMeins ? ' meins' : '') + '"' +
        ' role="button" tabindex="' + (gesperrt ? '-1' : '0') + '"' +
        ' aria-pressed="' + istGewaehlt + '"' +
        ' aria-disabled="' + gesperrt + '"' +
        ' data-projekt="' + p.id + '">' +

        '<div class="projekt-kopf">' +
          '<div class="projekt-symbol">' + UI.symbol(p.icon, 22) + '</div>' +
          '<div class="projekt-text">' +
            '<h3 class="projekt-name">' + UI.sicher(p.name) + '</h3>' +
          '</div>' +
        '</div>' +

        '<div class="projekt-marken">' + marken.join('') + '</div>' +

        '<div class="balken-zeile">' +
          '<span class="balken"><i class="' + balkenKlasse + '" style="width:' + anteil + '%"></i></span>' +
          '<span class="balken-zahl">' + b.benutzt + ' / ' + b.max + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    $('projekte').innerHTML = html || '<div class="leer">Für diesen Filter gibt es kein Projekt.</div>';
    knopfLeisteAktualisieren();
  }

  document.addEventListener('click', e => {
    const karte = e.target.closest('[data-projekt]');
    if (karte && zustand.ansicht === 'projekte') projektAntippen(karte.dataset.projekt);
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const karte = e.target.closest && e.target.closest('[data-projekt]');
    if (karte && zustand.ansicht === 'projekte') {
      e.preventDefault();
      projektAntippen(karte.dataset.projekt);
    }
  });

  function projektAntippen(id) {
    const stand = Store.stand;
    if (stand.gesperrt) { UI.meldung('Die Anmeldung ist geschlossen.', 'warn'); return; }

    const meins = zustand.key ? stand.anmeldungen[zustand.key] : null;
    const schonDrin = meins && meins.projektId === id;
    const p = Store.projektById(id);

    if (!schonDrin && !Store.klasseDarf(p, zustand.klasse)) {
      UI.meldung('Dieses Projekt ist nur für ' + p.nurKlassen.join(' und ') + '.', 'warn');
      return;
    }
    if (!schonDrin && Store.belegung(stand, id).frei <= 0) {
      UI.meldung('Dieses Projekt ist leider voll.', 'warn');
      return;
    }
    zustand.gewaehlt = (zustand.gewaehlt === id) ? null : id;
    projekteZeichnen();
  }

  /* ------------------------------------------------------------ Ansichten */

  function ansichtZeigen(name) {
    zustand.ansicht = name;
    $('ansicht-name').hidden = name !== 'name';
    $('ansicht-projekte').hidden = name !== 'projekte';
    $('ansicht-fertig').hidden = name !== 'fertig';
    $('zurueck').hidden = name === 'name';
    $('kopf-unter').textContent =
      name === 'name' ? 'Kolping Bildung' :
      name === 'projekte' ? 'Schritt 2 von 3' : 'Fertig';
    window.scrollTo(0, 0);
    if (name === 'projekte') projekteZeichnen();
    if (name === 'fertig') fertigZeichnen();
    knopfLeisteAktualisieren();
  }

  function knopfLeisteAktualisieren() {
    const haupt = $('haupt-knopf'), neben = $('neben-knopf');
    const stand = Store.stand;

    if (zustand.ansicht === 'name') {
      haupt.textContent = 'Weiter zu den Projekten';
      haupt.disabled = !zustand.bereit;
      neben.hidden = true;

    } else if (zustand.ansicht === 'projekte') {
      const meins = zustand.key ? stand.anmeldungen[zustand.key] : null;
      const wechsel = meins && zustand.gewaehlt && meins.projektId !== zustand.gewaehlt;
      haupt.textContent = zustand.sendet ? 'Einen Moment …'
        : wechsel ? 'Projekt wechseln'
        : 'Auswahl bestätigen';
      haupt.disabled = !zustand.gewaehlt || zustand.sendet || stand.gesperrt;
      neben.hidden = false;
      neben.textContent = 'Zurück';

    } else {
      haupt.textContent = 'Projekt wechseln';
      haupt.disabled = stand.gesperrt;
      neben.hidden = false;
      neben.textContent = 'Ich bin das nicht';
    }
  }

  /* ---------------------------------------------------------- Bestätigung */

  function fertigZeichnen() {
    let a = Store.stand.anmeldungen[zustand.key];
    let fehltInListe = false;

    if (a) {
      zustand.letzteAnmeldung = a;          // für den Fall einer Lücke merken
    } else if (zustand.letzteAnmeldung) {
      /* Die Anmeldung steht gerade nicht im Datenbestand. Statt den Schüler
         wortlos auf Schritt 1 zurückzuwerfen, zeigen wir weiter das zuletzt
         Bekannte und sagen offen, dass etwas nicht stimmt.                  */
      a = zustand.letzteAnmeldung;
      fehltInListe = true;
    } else {
      ansichtZeigen('name');
      return;
    }

    const p = Store.projektById(a.projektId);

    $('fertig-name').textContent = a.vorname;
    $('fertig-text').textContent = fehltInListe
      ? 'Achtung: Deine Anmeldung steht gerade nicht in der Liste. Vielleicht hat die Lehrkraft sie entfernt – trage dich unten sicherheitshalber neu ein.'
      : (a.wechsel > 0
        ? 'Deine Änderung ist gespeichert. Das gilt jetzt.'
        : 'Du bist eingetragen. Deine Wahl ist gespeichert.');

    $('fertig-daten').innerHTML =
      zeile('Name', a.vorname + ' ' + a.nachname) +
      zeile('Klasse', a.klasse) +
      zeile('Projekt', p ? p.name : '–') +
      zeile('Betreuung', p ? UI.lehrkraftName(p.lehrkraft) : '–') +
      zeile('Zuletzt geändert', UI.zeitpunkt(a.geaendert));

    const verlauf = (a.verlauf || []).slice().reverse();
    $('fertig-verlauf').innerHTML = verlauf.length
      ? verlauf.map(v =>
          '<div class="protokoll-zeile">' +
            '<span class="protokoll-punkt ' + (v.von ? '' : 'neu') + (v.wer === 'lehrkraft' ? ' lehrer' : '') + '"></span>' +
            '<div class="protokoll-text">' +
              (v.von
                ? 'Gewechselt von <b>' + UI.sicher(UI.projektName(v.von)) + '</b> zu <b>' + UI.sicher(UI.projektName(v.nach)) + '</b>'
                : 'Angemeldet für <b>' + UI.sicher(UI.projektName(v.nach)) + '</b>') +
              (v.wer === 'lehrkraft' ? ' <span class="mini">durch die Lehrkraft</span>' : '') +
              '<div class="protokoll-zeit">' + UI.zeitpunkt(v.zeit) + '</div>' +
            '</div>' +
          '</div>').join('')
      : '<div class="leer">Noch keine Änderung.</div>';
  }

  function zeile(links, rechts) {
    return '<div class="zeile"><dt>' + UI.sicher(links) + '</dt><dd>' + UI.sicher(rechts) + '</dd></div>';
  }

  /* ------------------------------------------------------------- Eingabe */

  function pruefen() {
    zustand.vorname = $('vorname').value.trim();
    zustand.nachname = $('nachname').value.trim();
    zustand.bereit = zustand.vorname.length >= 2 &&
                     zustand.nachname.length >= 2 &&
                     !!zustand.klasse;
    knopfLeisteAktualisieren();
  }

  function eingabeMelden() {
    let ok = true;
    const felder = [['vorname', 'Vornamen'], ['nachname', 'Nachnamen']];
    felder.forEach(([id]) => {
      const wert = $(id).value.trim();
      const schlecht = wert.length < 2;
      $('fehler-' + id).classList.toggle('zeigen', schlecht);
      $(id).setAttribute('aria-invalid', String(schlecht));
      if (schlecht) ok = false;
    });
    const keineKlasse = !zustand.klasse;
    $('fehler-klasse').classList.toggle('zeigen', keineKlasse);
    if (keineKlasse) ok = false;
    return ok;
  }

  /* -------------------------------------------------------------- Knöpfe */

  async function hauptKnopf() {
    if (zustand.ansicht === 'name') {
      if (!eingabeMelden()) {
        document.querySelector('[aria-invalid=true], .feld-fehler.zeigen')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      zustand.key = Store.schluessel(zustand.vorname, zustand.nachname, zustand.klasse);
      const vorhanden = Store.stand.anmeldungen[zustand.key];
      if (vorhanden) {
        Store.eigenerSchluesselMerken(zustand.key);
        zustand.gewaehlt = vorhanden.projektId;
        UI.meldung('Du bist schon für „' + UI.projektName(vorhanden.projektId) + '“ eingetragen.', 'gut');
      } else {
        zustand.gewaehlt = null;
      }
      ansichtZeigen('projekte');
      return;
    }

    if (zustand.ansicht === 'projekte') {
      if (!zustand.gewaehlt) return;
      zustand.sendet = true;
      knopfLeisteAktualisieren();

      const ergebnis = await Store.anmelden({
        vorname: zustand.vorname,
        nachname: zustand.nachname,
        klasse: zustand.klasse,
        projektId: zustand.gewaehlt
      });

      zustand.sendet = false;

      if (!ergebnis.ok) {
        if (ergebnis.fehler === 'KLASSE') {
          const p = Store.projektById(zustand.gewaehlt);
          UI.meldung('Dieses Projekt ist nur für ' + p.nurKlassen.join(' und ') + '.', 'fehler');
          zustand.gewaehlt = null;
          projekteZeichnen();
        } else if (ergebnis.fehler === 'VOLL') {
          UI.meldung('Zu spät – der letzte Platz ist gerade weg. Bitte wähle ein anderes Projekt.', 'fehler');
          zustand.gewaehlt = null;
          projekteZeichnen();
        } else {
          UI.meldung(ergebnis.fehler || 'Das hat nicht geklappt. Bitte noch einmal versuchen.', 'fehler');
          knopfLeisteAktualisieren();
        }
        return;
      }

      zustand.key = ergebnis.wert.key;
      Store.eigenerSchluesselMerken(zustand.key);
      UI.meldung(ergebnis.wert.gewechselt ? 'Projekt gewechselt.' : 'Angemeldet. Viel Erfolg!', 'gut');
      ansichtZeigen('fertig');
      return;
    }

    /* Ansicht "fertig" -> wechseln */
    const a = Store.stand.anmeldungen[zustand.key];
    zustand.gewaehlt = a ? a.projektId : null;
    ansichtZeigen('projekte');
  }

  async function nebenKnopf() {
    if (zustand.ansicht === 'projekte') {
      ansichtZeigen(Store.stand.anmeldungen[zustand.key] ? 'fertig' : 'name');
      return;
    }
    if (zustand.ansicht === 'fertig') {
      const ja = await UI.fragen({
        titel: 'Gerät zurücksetzen?',
        text: 'Deine Anmeldung <b>bleibt bestehen</b> – dieses Handy vergisst nur, ' +
              'wer du bist. Sinnvoll, wenn sich hier gleich jemand anderes einträgt.',
        ja: 'Zurücksetzen', nein: 'Doch nicht'
      });
      if (!ja) return;
      Store.eigenerSchluesselVergessen();
      zustand.key = null; zustand.gewaehlt = null;
      $('vorname').value = ''; $('nachname').value = '';
      zustand.klasse = ''; zustand.vorname = ''; zustand.nachname = '';
      [...$('klassen').children].forEach(c => c.setAttribute('aria-pressed', 'false'));
      pruefen();
      ansichtZeigen('name');
    }
  }

  /* -------------------------------------------------------------- Status */

  function statusZeigen(modus) {
    const el = $('status'), text = $('status-text');
    const banner = $('demo-banner');
    el.className = 'status';

    if (modus === 'online') {
      text.textContent = 'live verbunden';
      banner.hidden = true;
      return;
    }

    /* Ohne Datenbank landet die Anmeldung nirgends. Das darf niemand
       übersehen – deshalb steht es groß auf der Seite, nicht nur unten.   */
    if (modus === 'demo') {
      el.classList.add('demo');
      text.textContent = 'Demo-Modus (nur dieses Gerät)';
      banner.innerHTML = '<div class="hinweis hinweis--rot">' + UI.symbol('warn', 18) +
        '<div><b>Diese Seite ist noch nicht scharf geschaltet.</b> Was du hier ' +
        'einträgst, bleibt vorerst auf deinem eigenen Gerät und kommt noch nicht ' +
        'bei der Lehrkraft an. Zum Ausprobieren kannst du trotzdem alles benutzen.</div></div>';
      banner.hidden = false;
    } else {
      el.classList.add('aus');
      text.textContent = 'keine Verbindung';
      banner.innerHTML = '<div class="hinweis hinweis--rot">' + UI.symbol('warn', 18) +
        '<div><b>Keine Verbindung zur Datenbank.</b> Bitte kurz warten und die ' +
        'Seite neu laden. Wenn es weiter nicht geht, bei Frau Thornton oder ' +
        'Herrn Riegert melden.</div></div>';
      banner.hidden = false;
    }
  }

  /* ---------------------------------------------------------------- Start */

  function start() {
    symboleSetzen();
    klassenAufbauen();
    filterAufbauen();

    ['vorname', 'nachname'].forEach(id => {
      $(id).addEventListener('input', pruefen);
      $(id).addEventListener('blur', pruefen);
    });
    $('vorname').addEventListener('keydown', e => { if (e.key === 'Enter') $('nachname').focus(); });
    $('nachname').addEventListener('keydown', e => { if (e.key === 'Enter') $('nachname').blur(); });

    $('haupt-knopf').addEventListener('click', hauptKnopf);
    $('neben-knopf').addEventListener('click', nebenKnopf);
    $('zurueck').addEventListener('click', () => {
      if (zustand.ansicht === 'projekte') ansichtZeigen(Store.stand.anmeldungen[zustand.key] ? 'fertig' : 'name');
      else if (zustand.ansicht === 'fertig') ansichtZeigen('fertig');
    });

    Store.init((stand, modus) => {
      statusZeigen(modus);

      /* Beim ersten Laden: kenne ich mich schon? */
      if (!zustand.key) {
        const gemerkt = Store.eigenerSchluesselLesen();
        if (gemerkt && stand.anmeldungen[gemerkt]) {
          const a = stand.anmeldungen[gemerkt];
          zustand.key = gemerkt;
          zustand.vorname = a.vorname; zustand.nachname = a.nachname; zustand.klasse = a.klasse;
          $('vorname').value = a.vorname; $('nachname').value = a.nachname;
          [...$('klassen').children].forEach(c =>
            c.setAttribute('aria-pressed', String(c.dataset.klasse === a.klasse)));
          pruefen();
          ansichtZeigen('fertig');
          return;
        }
      }

      if (zustand.ansicht === 'projekte') projekteZeichnen();
      else if (zustand.ansicht === 'fertig') fertigZeichnen();
      knopfLeisteAktualisieren();
    });

    pruefen();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

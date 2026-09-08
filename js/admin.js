/* ============================================================================
   admin.js – Bereich für die Lehrkräfte
   Umsortieren, Plätze aufstocken, Anmeldung schließen, PDF ausgeben.
   ========================================================================= */

(function () {
  'use strict';

  const C = window.CONFIG;
  const $ = id => document.getElementById(id);
  const SITZUNG = 'pk-lehrkraft-offen';

  let gestartet = false;
  let klassenFilter = '';

  /* ============================== Anmeldung ============================= */

  function anmeldungPruefen() {
    const eingabe = $('passwort').value;
    if (!eingabe) { fehlerZeigen(); return; }
    if (!UI.passwortStimmt(eingabe)) { fehlerZeigen(); return; }
    try { sessionStorage.setItem(SITZUNG, '1'); } catch (e) { /* egal */ }
    pultOeffnen();
  }

  function fehlerZeigen() {
    $('fehler-passwort').classList.add('zeigen');
    $('passwort').setAttribute('aria-invalid', 'true');
    $('passwort').select();
    setTimeout(() => $('fehler-passwort').classList.remove('zeigen'), 4000);
  }

  function pultOeffnen() {
    $('tor').hidden = true;
    $('pult').hidden = false;
    $('leiste').hidden = false;
    $('kopf-unter').textContent = 'angemeldet';
    if (!gestartet) { gestartet = true; datenStarten(); }
  }

  /* ============================== Daten ================================= */

  function datenStarten() {
    Store.init((stand, modus) => {
      statusZeigen(modus);
      alesZeichnen(stand);
    });
  }

  function statusZeigen(modus) {
    const el = $('status'), text = $('status-text');
    el.className = 'status';
    if (modus === 'online') text.textContent = 'live verbunden';
    else if (modus === 'demo') { el.classList.add('demo'); text.textContent = 'Demo-Modus (nur dieses Gerät)'; }
    else { el.classList.add('aus'); text.textContent = 'keine Verbindung'; }
  }

  function alesZeichnen(stand) {
    zahlenZeichnen(stand);
    gruppenZeichnen(stand);
    schuelerZeichnen(stand);
    protokollZeichnen(stand);
    sperrZeichnen(stand);
    $('pult-unter').textContent =
      'Stand: ' + (stand.stand ? UI.zeitpunkt(stand.stand) : 'noch keine Anmeldung') +
      (stand.gesperrt ? ' · Anmeldung ist geschlossen' : '');
  }

  function zahlenZeichnen(stand) {
    const personen = Object.values(stand.anmeldungen || {});
    let plaetze = 0, belegt = 0;
    C.projekte.forEach(p => {
      const b = Store.belegung(stand, p.id);
      plaetze += b.max; belegt += b.benutzt;
    });
    $('z-angemeldet').textContent = personen.length;
    $('z-plaetze').textContent = plaetze;
    $('z-frei').textContent = Math.max(0, plaetze - belegt);
    $('z-ohne').textContent = personen.filter(a => !a.projektId).length;
  }

  /* ------------------------------------------------------ Blatt: Projekte */

  function projektAuswahl(aktuell) {
    return '<select data-ziel aria-label="Projekt ändern">' +
      '<option value=""' + (!aktuell ? ' selected' : '') + '>— ohne Projekt —</option>' +
      C.projekte.map(p =>
        '<option value="' + p.id + '"' + (p.id === aktuell ? ' selected' : '') + '>' +
        UI.sicher(p.name) + '</option>').join('') +
      '</select>';
  }

  function personZeile(a) {
    return '<div class="person" data-key="' + UI.sicher(a.key) + '">' +
      '<div class="person-name">' + UI.sicher(a.nachname + ', ' + a.vorname) +
        '<small>' + UI.sicher(a.klasse) +
        (a.wechsel ? ' · ' + a.wechsel + ' Wechsel' : '') +
        (a.vonLehrkraft ? ' · zugeteilt' : '') + '</small>' +
      '</div>' +
      projektAuswahl(a.projektId) +
      '<button class="person-weg" data-weg aria-label="Anmeldung löschen">' + UI.symbol('muell', 15) + '</button>' +
    '</div>';
  }

  function gruppenZeichnen(stand) {
    const html = C.projekte.map(p => {
      const b = Store.belegung(stand, p.id);
      const leute = Store.teilnehmer(stand, p.id);
      const anteil = Math.min(100, Math.round((b.benutzt / Math.max(1, b.max)) * 100));
      const farbe = b.frei <= 0 ? 'voll' : '';

      return '<div class="karte gruppe">' +
        '<div class="gruppe-kopf">' +
          '<h3>' + UI.sicher(p.name) + '</h3>' +
          '<span class="mini mini--lehrkraft">' + UI.sicher(UI.lehrkraftName(p.lehrkraft)) + '</span>' +
          (b.aufgestockt ? '<span class="mini mini--hinweis">+' + b.aufgestockt + ' aufgestockt</span>' : '') +
          '<span class="plaetze-regler">' +
            '<button data-plus="' + p.id + '" data-diff="-1" aria-label="Ein Platz weniger">−</button>' +
            '<span class="balken-zahl">' + b.benutzt + ' / ' + b.max + '</span>' +
            '<button data-plus="' + p.id + '" data-diff="1" aria-label="Ein Platz mehr">+</button>' +
          '</span>' +
        '</div>' +
        '<p style="margin:-4px 0 10px;font-size:13px;color:rgba(242,247,250,.55)">' +
          UI.sicher(p.klartext) + '</p>' +
        '<div class="balken" style="margin-bottom:12px"><i class="' + farbe +
          '" style="width:' + anteil + '%"></i></div>' +
        (leute.length ? leute.map(personZeile).join('')
                      : '<div class="leer">Noch niemand eingetragen.</div>') +
      '</div>';
    }).join('');

    const ohne = Store.alleAnmeldungen(stand).filter(a => !a.projektId);
    const ohneHtml = ohne.length
      ? '<div class="karte gruppe" style="border-color:rgba(229,72,77,.4)">' +
          '<div class="gruppe-kopf"><h3>Noch ohne Projekt</h3>' +
          '<span class="mini mini--voll">' + ohne.length + '</span></div>' +
          ohne.map(personZeile).join('') +
        '</div>'
      : '';

    $('gruppen').innerHTML = ohneHtml + html;
  }

  /* ------------------------------------------------------- Blatt: Schüler */

  function schuelerZeichnen(stand) {
    const alle = Store.alleAnmeldungen(stand);
    const gefiltert = klassenFilter ? alle.filter(a => a.klasse === klassenFilter) : alle;

    const wahl = $('klassen-filter');
    if (wahl.options.length <= 1) {
      C.klassen.forEach(k => {
        const o = document.createElement('option');
        o.value = k; o.textContent = k;
        wahl.appendChild(o);
      });
    }
    $('schueler-anzahl').textContent = gefiltert.length + ' von ' + alle.length + ' Personen';

    if (!gefiltert.length) {
      $('schueler-tabelle').innerHTML = '<div class="leer">Noch keine Anmeldungen.</div>';
      return;
    }

    $('schueler-tabelle').innerHTML =
      '<table class="liste"><thead><tr>' +
        '<th>Nachname</th><th>Vorname</th><th>Klasse</th><th>Projekt</th>' +
        '<th>Änd.</th><th>Zuletzt</th><th></th>' +
      '</tr></thead><tbody>' +
      gefiltert.map(a =>
        '<tr data-key="' + UI.sicher(a.key) + '">' +
          '<td><b>' + UI.sicher(a.nachname) + '</b></td>' +
          '<td>' + UI.sicher(a.vorname) + '</td>' +
          '<td>' + UI.sicher(a.klasse) + '</td>' +
          '<td>' + projektAuswahl(a.projektId) + '</td>' +
          '<td style="text-align:center">' + (a.wechsel || 0) + '</td>' +
          '<td style="white-space:nowrap;color:rgba(242,247,250,.5)">' + UI.vorhin(a.geaendert) + '</td>' +
          '<td><button class="person-weg" data-weg aria-label="Löschen">' + UI.symbol('muell', 15) + '</button></td>' +
        '</tr>').join('') +
      '</tbody></table>';
  }

  /* ------------------------------------------------------- Blatt: Verlauf */

  function protokollZeichnen(stand) {
    const log = stand.log || [];
    if (!log.length) { $('protokoll').innerHTML = '<div class="leer">Noch nichts passiert.</div>'; return; }

    $('protokoll').innerHTML = log.map(e => {
      const punkt = e.art === 'neu' ? 'neu'
                  : (e.art === 'entfernt' || e.art === 'zurueckgesetzt') ? 'weg'
                  : e.wer === 'lehrkraft' ? 'lehrer' : '';
      let text;
      switch (e.art) {
        case 'neu':
          text = '<b>' + UI.sicher(e.name) + '</b> (' + UI.sicher(e.klasse) + ') hat sich für <b>' +
                 UI.sicher(UI.projektName(e.nach)) + '</b> angemeldet'; break;
        case 'wechsel':
          text = '<b>' + UI.sicher(e.name) + '</b> (' + UI.sicher(e.klasse) + ') ist von <b>' +
                 UI.sicher(UI.projektName(e.von)) + '</b> zu <b>' +
                 UI.sicher(UI.projektName(e.nach)) + '</b> gewechselt'; break;
        case 'verschoben':
          text = 'Lehrkraft hat <b>' + UI.sicher(e.name) + '</b> (' + UI.sicher(e.klasse) + ') von <b>' +
                 UI.sicher(UI.projektName(e.von)) + '</b> nach <b>' +
                 UI.sicher(UI.projektName(e.nach)) + '</b> verschoben'; break;
        case 'entfernt':
          text = '<b>' + UI.sicher(e.name) + '</b> (' + UI.sicher(e.klasse) + ') wurde gelöscht'; break;
        case 'plaetze':
          text = 'Plätze bei <b>' + UI.sicher(e.name) + '</b> geändert: ' + UI.sicher(e.info || ''); break;
        case 'gesperrt':   text = 'Die Anmeldung wurde <b>geschlossen</b>'; break;
        case 'entsperrt':  text = 'Die Anmeldung wurde <b>wieder geöffnet</b>'; break;
        case 'zurueckgesetzt': text = '<b>Alle Anmeldungen</b> wurden gelöscht'; break;
        default: text = UI.sicher(e.art);
      }
      return '<div class="protokoll-zeile">' +
        '<span class="protokoll-punkt ' + punkt + '"></span>' +
        '<div class="protokoll-text">' + text +
          '<div class="protokoll-zeit">' + UI.zeitpunkt(e.zeit) + ' · ' + UI.vorhin(e.zeit) + '</div>' +
        '</div></div>';
    }).join('');
  }

  function sperrZeichnen(stand) {
    $('sperr-anzeige').innerHTML = stand.gesperrt
      ? '<div class="hinweis hinweis--rot">' + UI.symbol('warn', 18) +
        '<div><b>Die Anmeldung ist geschlossen.</b> Schüler können sich nicht mehr eintragen oder wechseln.</div></div>'
      : '<div class="hinweis hinweis--gruen">' + UI.symbol('check', 18) +
        '<div><b>Die Anmeldung ist offen.</b> Schüler können sich eintragen und wechseln.</div></div>';
    $('sperren').textContent = stand.gesperrt ? 'Anmeldung wieder öffnen' : 'Anmeldung schließen';
  }

  /* ============================ Bedienung =============================== */

  async function verschiebenVersuchen(key, ziel) {
    let ergebnis = await Store.verschieben(key, ziel || null);
    if (!ergebnis.ok && ergebnis.fehler === 'VOLL') {
      const p = Store.projektById(ziel);
      const b = Store.belegung(Store.stand, ziel);
      const ja = await UI.fragen({
        titel: 'Projekt ist voll',
        text: '<b>' + UI.sicher(p.name) + '</b> hat ' + b.max + ' Plätze und ist belegt.<br><br>' +
              'Du kannst die Person trotzdem hineinsetzen. Die Gruppe hat dann ' +
              (b.benutzt + 1) + ' Personen – so steht es auch in der PDF.',
        ja: 'Trotzdem zuordnen', nein: 'Abbrechen'
      });
      if (!ja) { alesZeichnen(Store.stand); return; }
      ergebnis = await Store.verschieben(key, ziel, { limitUeberschreiben: true });
    }
    if (!ergebnis.ok) UI.meldung(ergebnis.fehler || 'Hat nicht geklappt.', 'fehler');
    else UI.meldung('Verschoben.', 'gut');
  }

  async function loeschenVersuchen(key) {
    const a = Store.stand.anmeldungen[key];
    if (!a) return;
    const ja = await UI.fragen({
      titel: 'Anmeldung löschen?',
      text: '<b>' + UI.sicher(a.nachname + ', ' + a.vorname) + '</b> (' + UI.sicher(a.klasse) +
            ') wird vollständig aus der Liste entfernt. Die Person kann sich danach neu eintragen.',
      ja: 'Löschen', nein: 'Abbrechen', gefahr: true
    });
    if (!ja) return;
    const e = await Store.entfernen(key);
    UI.meldung(e.ok ? 'Gelöscht.' : (e.fehler || 'Hat nicht geklappt.'), e.ok ? 'gut' : 'fehler');
  }

  /** Kleiner Dialog, um eine Person von Hand einzutragen. */
  function personDialog() {
    return new Promise(loesen => {
      const schleier = document.createElement('div');
      schleier.className = 'schleier offen';
      schleier.innerHTML =
        '<div class="dialog" role="dialog" aria-modal="true">' +
          '<div class="dialog-griff"></div>' +
          '<h3>Person eintragen</h3>' +
          '<p>Für Nachzügler oder wenn jemand kein Handy dabei hat.</p>' +
          '<div class="feld"><label for="d-vorname">Vorname</label>' +
            '<input type="text" id="d-vorname" maxlength="40"></div>' +
          '<div class="feld"><label for="d-nachname">Nachname</label>' +
            '<input type="text" id="d-nachname" maxlength="40"></div>' +
          '<div class="feld"><label for="d-klasse">Klasse</label>' +
            '<select id="d-klasse">' + C.klassen.map(k =>
              '<option value="' + UI.sicher(k) + '">' + UI.sicher(k) + '</option>').join('') +
            '</select></div>' +
          '<div class="feld"><label for="d-projekt">Projekt</label>' +
            '<select id="d-projekt"><option value="">— noch ohne Projekt —</option>' +
              C.projekte.map(p => '<option value="' + p.id + '">' + UI.sicher(p.name) + '</option>').join('') +
            '</select></div>' +
          '<div class="dialog-knoepfe">' +
            '<button class="knopf" data-ok>Eintragen</button>' +
            '<button class="knopf knopf--leise" data-ab>Abbrechen</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(schleier);
      const zu = wert => { schleier.remove(); loesen(wert); };
      schleier.querySelector('[data-ab]').addEventListener('click', () => zu(null));
      schleier.addEventListener('click', e => { if (e.target === schleier) zu(null); });
      schleier.querySelector('[data-ok]').addEventListener('click', () => {
        const vorname = schleier.querySelector('#d-vorname').value.trim();
        const nachname = schleier.querySelector('#d-nachname').value.trim();
        if (vorname.length < 2 || nachname.length < 2) {
          UI.meldung('Bitte Vor- und Nachnamen eintragen.', 'warn');
          return;
        }
        zu({
          vorname, nachname,
          klasse: schleier.querySelector('#d-klasse').value,
          projektId: schleier.querySelector('#d-projekt').value
        });
      });
      setTimeout(() => schleier.querySelector('#d-vorname').focus(), 60);
    });
  }

  /* ============================== Verdrahtung =========================== */

  function verdrahten() {
    /* Anmeldung */
    $('anmelden').addEventListener('click', anmeldungPruefen);
    $('passwort').addEventListener('keydown', e => { if (e.key === 'Enter') anmeldungPruefen(); });
    $('zur-startseite').innerHTML = UI.symbol('zurueck', 18);
    document.querySelectorAll('#tor .hinweis > span:empty').forEach(s => s.innerHTML = UI.symbol('schild', 18));
    document.querySelectorAll('#pult .hinweis > span:empty').forEach(s => s.innerHTML = UI.symbol('info', 18));

    /* Reiter */
    document.querySelector('.reiter').addEventListener('click', e => {
      const b = e.target.closest('button[data-blatt]');
      if (!b) return;
      document.querySelectorAll('.reiter button').forEach(x =>
        x.setAttribute('aria-selected', String(x === b)));
      document.querySelectorAll('.blatt').forEach(x =>
        x.classList.toggle('aktiv', x.id === 'blatt-' + b.dataset.blatt));
    });

    /* Klick-Auswertung im ganzen Pult */
    $('pult').addEventListener('click', async e => {
      const plus = e.target.closest('[data-plus]');
      if (plus) {
        const r = await Store.plaetzeAendern(plus.dataset.plus, Number(plus.dataset.diff));
        if (!r.ok) UI.meldung(r.fehler, 'warn');
        return;
      }
      const weg = e.target.closest('[data-weg]');
      if (weg) {
        const traeger = weg.closest('[data-key]');
        if (traeger) loeschenVersuchen(traeger.dataset.key);
      }
    });

    $('pult').addEventListener('change', async e => {
      const ziel = e.target.closest('[data-ziel]');
      if (ziel) {
        const traeger = ziel.closest('[data-key]');
        if (traeger) await verschiebenVersuchen(traeger.dataset.key, ziel.value);
      }
    });

    $('klassen-filter').addEventListener('change', e => {
      klassenFilter = e.target.value;
      schuelerZeichnen(Store.stand);
    });

    $('person-neu').addEventListener('click', async () => {
      const daten = await personDialog();
      if (!daten) return;
      let r = await Store.eintragen(daten);
      if (!r.ok && r.fehler === 'VOLL') {
        const ja = await UI.fragen({
          titel: 'Projekt ist voll',
          text: 'Trotzdem in dieses Projekt eintragen? Die Gruppe wird dann größer als geplant.',
          ja: 'Trotzdem eintragen', nein: 'Abbrechen'
        });
        if (!ja) return;
        r = await Store.eintragen(Object.assign({}, daten, { limitUeberschreiben: true }));
      }
      UI.meldung(r.ok ? 'Eingetragen.' : (r.fehler || 'Hat nicht geklappt.'), r.ok ? 'gut' : 'fehler');
    });

    /* Anmeldung sperren */
    $('sperren').addEventListener('click', async () => {
      const jetzt = !!Store.stand.gesperrt;
      const ja = await UI.fragen({
        titel: jetzt ? 'Anmeldung wieder öffnen?' : 'Anmeldung schließen?',
        text: jetzt
          ? 'Die Klassen können sich dann wieder eintragen und wechseln.'
          : 'Danach kann sich niemand mehr eintragen oder wechseln. ' +
            'Du selbst kannst weiter umsortieren.',
        ja: jetzt ? 'Öffnen' : 'Schließen', nein: 'Abbrechen'
      });
      if (!ja) return;
      await Store.sperren(!jetzt);
    });

    /* Zurücksetzen */
    $('zuruecksetzen').addEventListener('click', async () => {
      const anzahl = Object.keys(Store.stand.anmeldungen || {}).length;
      const ja = await UI.fragen({
        titel: 'Wirklich alles löschen?',
        text: 'Es werden <b>' + anzahl + ' Anmeldungen</b> unwiderruflich gelöscht. ' +
              'Hast du die PDF-Listen vorher gesichert?',
        ja: 'Ja, alles löschen', nein: 'Abbrechen', gefahr: true
      });
      if (!ja) return;
      const nochmal = await UI.fragen({
        titel: 'Sicherheitsfrage',
        text: 'Letzte Nachfrage: Alle ' + anzahl + ' Anmeldungen werden gelöscht.',
        ja: 'Endgültig löschen', nein: 'Doch nicht', gefahr: true
      });
      if (!nochmal) return;
      const r = await Store.allesLoeschen();
      UI.meldung(r.ok ? 'Alles gelöscht.' : 'Hat nicht geklappt.', r.ok ? 'gut' : 'fehler');
    });

    /* PDF und CSV */
    const mitLadeanzeige = async (knopf, arbeit) => {
      const alt = knopf.textContent;
      knopf.disabled = true; knopf.textContent = 'wird erstellt …';
      try { await arbeit(); UI.meldung('PDF erstellt – schau in deine Downloads.', 'gut'); }
      catch (e) {
        console.error(e);
        UI.meldung('PDF fehlgeschlagen: ' + (e.message || e) + ' – besteht eine Internetverbindung?', 'fehler');
      }
      finally { knopf.disabled = false; knopf.textContent = alt; }
    };

    $('pdf-schueler').addEventListener('click', e =>
      mitLadeanzeige(e.currentTarget, () => PDF.schuelerliste(Store.stand)));
    $('pdf-projekte').addEventListener('click', e =>
      mitLadeanzeige(e.currentTarget, () => PDF.projektliste(Store.stand)));
    $('pdf-beide').addEventListener('click', e =>
      mitLadeanzeige(e.currentTarget, async () => {
        await PDF.schuelerliste(Store.stand);
        await new Promise(r => setTimeout(r, 700));   // zwei Downloads kurz trennen
        await PDF.projektliste(Store.stand);
      }));
    $('csv').addEventListener('click', () => {
      PDF.csv(Store.stand);
      UI.meldung('CSV erstellt.', 'gut');
    });

    $('abmelden').addEventListener('click', e => {
      e.preventDefault();
      try { sessionStorage.removeItem(SITZUNG); } catch (err) { /* egal */ }
      location.reload();
    });

    /* Schon in dieser Sitzung angemeldet? */
    let offen = false;
    try { offen = sessionStorage.getItem(SITZUNG) === '1'; } catch (e) { /* egal */ }
    if (offen) pultOeffnen(); else setTimeout(() => $('passwort').focus(), 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', verdrahten);
  else verdrahten();
})();

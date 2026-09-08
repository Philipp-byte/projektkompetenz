/* ============================================================================
   pdf.js – die beiden Listen für die Lehrkräfte
     Liste 1  Schüler → Projekt   (alphabetisch, nach Klassen sortiert)
     Liste 2  Projekt → Schüler   (pro Projekt ein Block mit allen Namen)
   Beide im Kolping-Design: Logo oben rechts, Dunkelblau, oranger Akzent.
   ========================================================================= */

window.PDF = (function () {
  'use strict';

  const C = window.CONFIG;

  /* Markenfarben als RGB-Werte für jsPDF */
  const NAVY   = [18, 65, 91];
  const ORANGE = [238, 114, 3];
  const GRUEN  = [140, 168, 138];
  const HELL   = [231, 237, 240];
  const GRAU   = [110, 128, 138];

  const RAND = 15;            // Seitenrand links/rechts in mm
  const OBEN = 34;            // wo der Inhalt beginnt (darüber steht der Kopf)
  const UNTEN = 20;           // Platz für die Fußzeile

  const LEHRKRAEFTE_ZEILE = 'Thornton & Riegert';

  /* ------------------------------------------------------- Bibliotheken */

  function skriptLaden(url) {
    return new Promise((fertig, fehler) => {
      const s = document.createElement('script');
      s.src = url;
      s.onload = fertig;
      s.onerror = () => fehler(new Error('Nicht erreichbar: ' + url));
      document.head.appendChild(s);
    });
  }

  let geladen = null;
  function bibliothekLaden() {
    if (geladen) return geladen;
    geladen = (async () => {
      if (!window.jspdf) {
        await skriptLaden('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      }
      if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF fehlt');
      const probe = new window.jspdf.jsPDF();
      if (typeof probe.autoTable !== 'function') {
        await skriptLaden('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
      }
      return true;
    })();
    return geladen;
  }

  /** Neues A4-Dokument. compress spart deutlich Dateigröße – wichtig, weil die
      Listen per Mail oder Messenger weitergegeben werden.                   */
  function neuesDokument() {
    return new window.jspdf.jsPDF({
      unit: 'mm', format: 'a4', orientation: 'portrait', compress: true
    });
  }

  /* --------------------------------------------------- Kopf und Fußzeile */

  /** Zeichnet Kopf und Fuß auf ALLE Seiten – erst ganz am Schluss aufgerufen,
      damit nichts doppelt oder gar nicht gezeichnet wird.                   */
  function rahmenZeichnen(doc, titel, untertitel) {
    const breite = doc.internal.pageSize.getWidth();
    const hoehe  = doc.internal.pageSize.getHeight();
    const seiten = doc.internal.getNumberOfPages();

    for (let i = 1; i <= seiten; i++) {
      doc.setPage(i);

      /* --- Logo oben rechts (Seitenverhältnis 3,282 : 1, Breite 35 mm) --- */
      if (window.KOLPING_LOGO && window.KOLPING_LOGO.dataUrl) {
        const lb = 35, lh = lb / 3.282;
        try { doc.addImage(window.KOLPING_LOGO.dataUrl, 'PNG', breite - RAND - lb, 11, lb, lh); }
        catch (e) { /* lieber ohne Logo als gar kein PDF */ }
      }

      /* --- Titel links --- */
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.setTextColor.apply(doc, NAVY);
      doc.text(titel, RAND, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, GRAU);
      doc.text(untertitel, RAND, 24);

      /* --- oranger Akzentstrich --- */
      doc.setFillColor.apply(doc, ORANGE);
      doc.rect(RAND, 27, breite - 2 * RAND, 0.9, 'F');

      /* --- Fußzeile: Kolping Bildung | Lehrkräfte | Seite --- */
      doc.setDrawColor(210, 218, 223);
      doc.setLineWidth(0.2);
      doc.line(RAND, hoehe - 15, breite - RAND, hoehe - 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor.apply(doc, NAVY);
      doc.text('Kolping Bildung', RAND, hoehe - 10.5);
      doc.text(LEHRKRAEFTE_ZEILE, breite / 2, hoehe - 10.5, { align: 'center' });
      doc.text('Seite ' + i + ' von ' + seiten, breite - RAND, hoehe - 10.5, { align: 'right' });
    }
  }

  /** Unterschriftsfeld sitzt immer unten auf der letzten Seite – nur wenn der
      Inhalt bis dorthin reicht, kommt eine weitere Seite dazu.              */
  function unterschriftsfeld(doc, yInhalt) {
    const breite = doc.internal.pageSize.getWidth();
    const hoehe  = doc.internal.pageSize.getHeight();
    const linie  = hoehe - 26;
    if (yInhalt > linie - 6) doc.addPage();

    doc.setDrawColor(170, 182, 190);
    doc.setLineWidth(0.3);
    doc.line(RAND, linie, RAND + 62, linie);
    doc.line(breite - RAND - 62, linie, breite - RAND, linie);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor.apply(doc, GRAU);
    doc.text('Datum, Stine Thornton', RAND, linie + 4.5);
    doc.text('Datum, Philipp Riegert', breite - RAND, linie + 4.5, { align: 'right' });
  }

  /* ---------------------------------------------------------- Datenhilfen */

  function alle(stand) {
    return Object.values(stand.anmeldungen || {});
  }

  /* Klassen erscheinen in der Reihenfolge der config.js, nicht alphabetisch –
     so steht die Liste so da, wie die Lehrkräfte sie erwarten.             */
  function klassenRang(klasse) {
    const i = C.klassen.indexOf(klasse);
    return i < 0 ? 99 : i;
  }

  function sortiertNachName(liste) {
    return liste.slice().sort((a, b) =>
      klassenRang(a.klasse) - klassenRang(b.klasse) ||
      (a.nachname || '').localeCompare(b.nachname || '', 'de') ||
      (a.vorname || '').localeCompare(b.vorname || '', 'de'));
  }

  function personen(n) {
    return n === 1 ? '1 Person' : n + ' Personen';
  }

  function projektInfo(id) {
    return C.projekte.find(p => p.id === id) || null;
  }

  function lehrkraftName(schluessel) {
    const l = C.lehrkraefte[schluessel];
    return l ? l.name : '–';
  }

  /* In der schmalen Spalte von Liste 1 ist nur der Nachname sinnvoll –
     es gibt ohnehin nur zwei Lehrkräfte.                                */
  function lehrkraftKurz(schluessel) {
    const l = C.lehrkraefte[schluessel];
    return l ? l.kurz : '–';
  }

  function stempel() {
    const d = new Date();
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
           ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
  }

  function dateiname(teil) {
    const d = new Date();
    const s = d.getFullYear() + '-' +
              String(d.getMonth() + 1).padStart(2, '0') + '-' +
              String(d.getDate()).padStart(2, '0');
    return 'Projektkompetenz_' + teil + '_' + s + '.pdf';
  }

  /* ============================ LISTE 1 ==================================
     Schüler → Projekt, alphabetisch. Eine Zeile pro Person.
     ===================================================================== */

  async function schuelerliste(stand, speichern = true) {
    await bibliothekLaden();
    const doc = neuesDokument();

    const liste = sortiertNachName(alle(stand));
    const zeilen = liste.map((a, i) => {
      const p = projektInfo(a.projektId);
      return [
        String(i + 1),
        a.nachname || '',
        a.vorname || '',
        a.klasse || '',
        p ? p.name : '— noch offen —',
        p ? lehrkraftKurz(p.lehrkraft) : '–',
        a.wechsel > 0 ? String(a.wechsel) : '–'
      ];
    });

    doc.autoTable({
      startY: OBEN,
      margin: { top: OBEN, bottom: UNTEN, left: RAND, right: RAND },
      head: [['#', 'Nachname', 'Vorname', 'Klasse', 'Projekt', 'Betreuung', 'Änd.']],
      body: zeilen.length ? zeilen : [['–', 'Noch keine Anmeldungen', '', '', '', '', '']],
      theme: 'grid',
      styles: {
        font: 'helvetica', fontSize: 8.8, cellPadding: 2.05,
        textColor: [30, 30, 30], lineColor: [214, 222, 227], lineWidth: 0.15
      },
      headStyles: {
        fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold',
        fontSize: 8.5, cellPadding: 3
      },
      alternateRowStyles: { fillColor: HELL },
      columnStyles: {
        0: { cellWidth:  9, halign: 'right', textColor: GRAU },
        1: { cellWidth: 29, fontStyle: 'bold' },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 61 },
        5: { cellWidth: 21 },
        6: { cellWidth: 15, halign: 'center', textColor: GRAU }
      },
      didParseCell: d => {
        /* Personen ohne Projekt fallen ins Auge */
        if (d.section === 'body' && d.column.index === 4 && String(d.cell.raw).indexOf('offen') > -1) {
          d.cell.styles.textColor = [200, 60, 20];
          d.cell.styles.fontStyle = 'bold';
        }
      }
    });

    let y = doc.lastAutoTable.finalY + 8;
    const ohne = liste.filter(a => !a.projektId).length;
    const gewechselt = liste.filter(a => (a.wechsel || 0) > 0).length;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, NAVY);
    const zusammen = liste.length + ' Schülerinnen und Schüler · ' +
                     (liste.length - ohne) + ' mit Projekt · ' +
                     ohne + ' ohne Projekt · ' +
                     gewechselt + ' mit mindestens einem Wechsel';
    if (y > doc.internal.pageSize.getHeight() - UNTEN - 10) { doc.addPage(); y = OBEN; }
    doc.text(zusammen, RAND, y);
    y += 4;
    doc.setFontSize(7.5);
    doc.setTextColor.apply(doc, GRAU);
    doc.text('Spalte „Änd.“ = Anzahl der Projektwechsel dieser Person.', RAND, y);

    unterschriftsfeld(doc, y + 6);
    rahmenZeichnen(doc, 'Projektkompetenz ' + C.schuljahr,
                   'Liste 1 · Schülerinnen und Schüler mit ihrem Projekt  |  Stand: ' + stempel());

    if (speichern) doc.save(dateiname('Schuelerliste'));
    return doc;
  }

  /* ============================ LISTE 2 ==================================
     Projekt → Schüler. Pro Projekt ein Block.
     ===================================================================== */

  async function projektliste(stand, speichern = true) {
    await bibliothekLaden();
    const doc = neuesDokument();

    const breite = doc.internal.pageSize.getWidth();
    const hoehe  = doc.internal.pageSize.getHeight();
    let y = OBEN;

    const blockZeichnen = (titel, zusatz, betreuung, belegung, mitglieder, farbe) => {
      const zeilenHoehe = 7.2;
      const kopfHoehe = zusatz ? 16 : 13;
      const noetig = kopfHoehe + (Math.max(mitglieder.length, 1) + 1) * zeilenHoehe + 10;
      if (y + noetig > hoehe - UNTEN) { doc.addPage(); y = OBEN; }

      /* Farbiger Balken + Projektkopf */
      doc.setFillColor.apply(doc, farbe);
      doc.rect(RAND, y, 2.4, kopfHoehe - 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor.apply(doc, NAVY);
      doc.text(doc.splitTextToSize(titel, breite - 2 * RAND - 52)[0], RAND + 6, y + 5.5);

      if (zusatz) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.6);
        doc.setTextColor.apply(doc, GRAU);
        doc.text(doc.splitTextToSize(zusatz, breite - 2 * RAND - 46)[0] || '', RAND + 6, y + 10.4);
      }

      /* Belegung rechts */
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, belegung.voll ? [200, 60, 20] : NAVY);
      doc.text(belegung.text, breite - RAND, y + 5.5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.6);
      doc.setTextColor.apply(doc, GRAU);
      doc.text(betreuung, breite - RAND, zusatz ? y + 10.4 : y + 10, { align: 'right' });

      y += kopfHoehe;

      doc.autoTable({
        startY: y,
        margin: { top: OBEN, bottom: UNTEN, left: RAND + 6, right: RAND },
        head: [['#', 'Nachname', 'Vorname', 'Klasse', 'Eingetragen am']],
        body: mitglieder.length
          ? mitglieder.map((a, i) => [
              String(i + 1), a.nachname || '', a.vorname || '', a.klasse || '',
              new Date(a.erstellt).toLocaleDateString('de-DE',
                { day: '2-digit', month: '2-digit', year: '2-digit' })
            ])
          : [['', 'Noch niemand eingetragen', '', '', '']],
        theme: 'grid',
        styles: {
          font: 'helvetica', fontSize: 9, cellPadding: 2.1,
          textColor: [30, 30, 30], lineColor: [214, 222, 227], lineWidth: 0.15
        },
        headStyles: {
          fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold',
          fontSize: 8, cellPadding: 2.4
        },
        alternateRowStyles: { fillColor: HELL },
        columnStyles: {
          0: { cellWidth: 8, halign: 'right', textColor: GRAU },
          1: { cellWidth: 42, fontStyle: 'bold' },
          2: { cellWidth: 38 },
          3: { cellWidth: 26 },
          4: { cellWidth: 30, textColor: GRAU }
        }
      });

      y = doc.lastAutoTable.finalY + 9;
    };

    C.projekte.forEach(p => {
      const b = Store.belegung(stand, p.id);
      const mitglieder = Store.teilnehmer(stand, p.id);
      blockZeichnen(
        p.name,
        p.nurKlassen && p.nurKlassen.length ? 'Anmeldung nur ' + p.nurKlassen.join(' und ') : '',
        'Betreuung: ' + lehrkraftName(p.lehrkraft),
        {
          text: b.benutzt + ' von ' + b.max + ' Plätzen' + (b.aufgestockt ? '  (aufgestockt)' : ''),
          voll: b.frei <= 0
        },
        mitglieder,
        b.frei <= 0 ? ORANGE : GRUEN
      );
    });

    /* Personen ohne Projekt zum Schluss */
    const ohne = sortiertNachName(alle(stand).filter(a => !a.projektId));
    if (ohne.length) {
      blockZeichnen('Noch ohne Projekt', 'Diese Personen sind eingetragen, haben aber kein Projekt gewählt.',
        'Bitte zuordnen', { text: personen(ohne.length), voll: true }, ohne, [200, 60, 20]);
    }

    unterschriftsfeld(doc, y);
    rahmenZeichnen(doc, 'Projektkompetenz ' + C.schuljahr,
                   'Liste 2 · Projekte mit ihren Teilnehmerinnen und Teilnehmern  |  Stand: ' + stempel());

    if (speichern) doc.save(dateiname('Projektliste'));
    return doc;
  }

  /* -------------------------------------------------------------- CSV */

  function csv(stand) {
    const zeilen = [['Nachname', 'Vorname', 'Klasse', 'Projekt', 'Betreuung', 'Wechsel', 'Zuletzt geaendert']];
    sortiertNachName(alle(stand)).forEach(a => {
      const p = projektInfo(a.projektId);
      zeilen.push([
        a.nachname, a.vorname, a.klasse,
        p ? p.name : 'ohne Projekt',
        p ? lehrkraftKurz(p.lehrkraft) : '',
        String(a.wechsel || 0),
        new Date(a.geaendert).toLocaleString('de-DE')
      ]);
    });
    const text = '﻿' + zeilen
      .map(z => z.map(f => '"' + String(f == null ? '' : f).replace(/"/g, '""') + '"').join(';'))
      .join('\r\n');

    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = dateiname('Liste').replace('.pdf', '.csv');
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  return { schuelerliste, projektliste, csv };
})();

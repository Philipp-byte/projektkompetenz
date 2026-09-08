# Projektkompetenz · Kolping Bildung

Anmeldeseite, mit der sich die Klassen **BKWI 15.1** und **BKW 16** per QR-Code
selbst in ihr Projekt eintragen. Für die Lehrkräfte gibt es einen geschützten
Bereich zum Umsortieren und zwei fertige PDF-Listen.

**Betreuung:** Stine Thornton · Philipp Riegert

---

## Die drei Seiten

| Seite | Wofür | Wer |
|---|---|---|
| `index.html` | Name und Klasse eintragen, Projekt wählen, jederzeit wechseln | Schülerinnen und Schüler |
| `lehrkraft.html` | Umsortieren, Plätze aufstocken, PDF und CSV, Anmeldung schließen | Lehrkräfte (Passwort) |
| `qr.html` | QR-Code zum Projizieren oder Ausdrucken | Lehrkräfte |

Dazu `passwort.html` — damit wird ein neues Lehrkraft-Passwort erzeugt.

## Passwort

Voreingestellt ist **`Projekt2027!`**

Ändern: `passwort.html` öffnen, Wunschpasswort eintippen, den angezeigten
Fingerabdruck kopieren und in `js/config.js` bei `adminHash:` einsetzen.
Das Passwort selbst steht nirgends im Quelltext.

> Der Schutz hält Schülerinnen und Schüler zuverlässig draußen, ist aber kein
> Tresor — die Seite läuft vollständig im Browser. Nicht weitergeben.

## Wie die Anmeldung funktioniert

1. QR-Code scannen → Vorname, Nachname, Klasse eintragen.
2. Projekt aussuchen. Volle Projekte sind gesperrt und lassen sich nicht antippen.
3. Bestätigen. Die Wahl gilt und ist auf allen Geräten sofort sichtbar.
4. **Wechseln ist erlaubt** — solange die Anmeldung offen ist und im Zielprojekt
   ein Platz frei ist. Jeder Wechsel wird mit Zeitpunkt protokolliert und
   erscheint im Verlauf der Schülerin bzw. des Schülers und im Lehrkraft-Bereich.

Erkannt wird eine Person über **Klasse + Nachname + Vorname**. Wer sich mit
denselben Angaben erneut einträgt, ändert seine bestehende Anmeldung — es
entsteht kein Doppeleintrag.

### Volle Projekte

Die Plätze werden in einer Transaktion geprüft. Wenn zwei Personen im selben
Moment auf den letzten freien Platz tippen, bekommt genau eine den Platz; die
andere bekommt eine klare Meldung und wählt neu. Ein Platz kann nicht doppelt
vergeben werden.

**Die Lehrkraft darf das Limit überschreiten.** Beim Verschieben in ein volles
Projekt kommt eine Rückfrage; nach Bestätigung sitzt die Person darin, und die
Gruppe erscheint mit ihrer tatsächlichen Größe (z. B. „3 von 2 Plätzen") in
beiden PDF-Listen.

## Die beiden PDF-Listen

Beide im Kolping-Design: Logo oben rechts, Dunkelblau `#12415B`, oranger
Akzentstrich, Fußzeile „Kolping Bildung | Thornton & Riegert | Seite x von y",
Datum und Unterschriftsfeld für beide Lehrkräfte.

**Liste 1 — Schüler → Projekt**
Alle Personen alphabetisch nach Klasse und Nachname, mit Vorname, Nachname,
Klasse, Projekt, Betreuung und der Anzahl ihrer Wechsel. Personen ohne Projekt
sind rot hervorgehoben.

**Liste 2 — Projekt → Schüler**
Ein Block je Projekt mit Kurzbeschreibung, Betreuung, Belegung und allen
Teilnehmenden (Nachname, Vorname, Klasse, Datum). Am Ende ein Block mit allen,
die noch kein Projekt haben.

Zusätzlich gibt es einen CSV-Export für Excel (Semikolon, UTF-8 mit BOM).

## Projekte anpassen

Alles steht in **`js/config.js`** — Projekte, Plätze, Klassen, Lehrkräfte,
Schuljahr. Eine Änderung dort wirkt auf Anmeldeseite, Lehrkraft-Bereich und
beide PDF gleichzeitig.

```js
{
  id: 'makerspace',        // NIE nachträglich ändern - daran hängen die Anmeldungen
  name: 'Makerspace',      // Überschrift auf der Karte
  klartext: '3D-Druck: …', // erklärender Zusatz
  plaetze: 4,              // Höchstzahl
  lehrkraft: 'riegert',    // thornton | riegert | beide
  icon: 'cube',
  details: ['…', '…']      // Stichpunkte unter "Mehr dazu"
}
```

Neuer Jahrgang: `datensatz:` in der `config.js` hochzählen — siehe `SETUP.md`.

## Datenbank

Ohne Einrichtung läuft alles im **Demo-Modus** (Daten nur auf dem eigenen Gerät,
gut zum Ausprobieren). Für den echten Einsatz: **`SETUP.md`** — Firebase
Firestore, kostenlos, etwa zehn Minuten.

Gespeichert werden ausschließlich Vorname, Nachname, Klasse, das gewählte Projekt
und die Zeitpunkte der Änderungen. Keine E-Mail-Adressen, keine Konten, keine
Cookies von Dritten.

## Technik

Reine statische Seite ohne Bauschritt — HTML, CSS, JavaScript. Nachgeladen werden
nur Firebase (Datenbank), jsPDF (PDF) und eine QR-Bibliothek.

```
index.html · lehrkraft.html · qr.html · passwort.html
css/style.css
js/  config.js   ← hier wird eingestellt
     store.js    Datenhaltung und Transaktionen
     ui.js       Symbole, Meldungen, Dialoge, SHA-256
     app.js      Schülerseite
     admin.js    Lehrkraft-Bereich
     pdf.js      die beiden PDF-Listen
assets/  Kolping-Logo (PNG, Vektor-PDF, als Data-URL für die PDF)
firestore.rules  Sicherheitsregeln für die Datenbank
```

Getestet für aktuelle Versionen von Chrome, Safari, Firefox und Edge — mobil wie
am Rechner.

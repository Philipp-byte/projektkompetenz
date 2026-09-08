# Datenbank einrichten (einmalig, ca. 10 Minuten)

**Ohne diesen Schritt speichert jedes Gerät nur für sich.** Was eine Klasse auf
ihren Handys einträgt, kommt dann nicht bei der Lehrkraft an. Erst mit der
gemeinsamen Datenbank sehen alle Geräte denselben Stand — sofort, ohne Neuladen.

> **Der bequeme Weg:** Die Seite **`einrichten.html`** führt durch alle Schritte,
> nimmt die Zugangsdaten entgegen, **testet die Verbindung wirklich** (schreiben
> und zurücklesen) und gibt den fertigen Block für die `config.js` aus.
> Im Lehrkraft-Bereich steht der Link direkt im roten Hinweis.

Verwendet wird **Firebase Firestore**: kostenlos, von Google, Serverstandort
Europa. Für 30 Anmeldungen liegt das weit unter jeder Grenze des Gratis-Kontingents.

---

## Schritt 1 — Firebase-Projekt anlegen

1. <https://console.firebase.google.com> öffnen, mit einem Google-Konto anmelden.
2. **Projekt erstellen** → Name `projektkompetenz` → weiter.
3. Google Analytics **ausschalten** → **Projekt erstellen**.

## Schritt 2 — Datenbank anlegen

1. Links im Menü: **Erstellen → Firestore Database**.
2. **Datenbank erstellen** anklicken.
3. Standort **europe-west10 (Berlin)** wählen — dann liegen die Daten in
   Deutschland. Dieser Standort lässt sich später **nicht mehr ändern**.
4. Startmodus: **Im Produktionsmodus starten**.

> Dieser Schritt wird gern übersehen. Ein Firebase-Projekt ohne angelegte
> Firestore-Datenbank antwortet gar nicht — der Verbindungstest läuft dann in
> sein Zeitlimit und meldet genau das.

## Schritt 3 — Sicherheitsregeln veröffentlichen

1. In Firestore oben auf den Reiter **Regeln**.
2. Den gesamten Inhalt durch die Datei **`firestore.rules`** ersetzen
   (auf `einrichten.html` steht der Text zum Kopieren bereit).
3. **Veröffentlichen** anklicken.

Die Regeln erlauben Schreibzugriff **nur** auf den einen Datensatz der Anmeldung
und begrenzen dessen Größe. Alles andere in der Datenbank bleibt gesperrt.

## Schritt 4 — Zugangsdaten in die Seite eintragen

1. Oben links **Zahnrad → Projekteinstellungen**.
2. Nach unten zu **Meine Apps** → auf **`</>`** (Web) klicken.
3. App-Name `Projektkompetenz` → **App registrieren** (Hosting nicht ankreuzen).
4. Der angezeigte Block sieht so aus:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy…",
     authDomain: "projektkompetenz-1234.firebaseapp.com",
     projectId: "projektkompetenz-1234",
     storageBucket: "projektkompetenz-1234.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abc123"
   };
   ```

5. Block auf `einrichten.html` einfügen → **Verbindung testen** → den
   ausgegebenen Abschnitt in **`js/config.js`** bei `firebase: { … }` einsetzen.
6. Datei speichern und hochladen (bei GitHub: Datei bearbeiten → *Commit changes*).

> Diese Schlüssel dürfen öffentlich stehen — genau dafür sind sie gemacht.
> Was erlaubt ist, regeln allein die Regeln aus Schritt 3.

## Schritt 5 — Nachweis, dass es wirklich funktioniert

1. Lehrkraft-Bereich öffnen → Reiter **PDF & Export** → **Verbindung prüfen**.
   Der Test schreibt in die Datenbank und liest vom Server zurück. Grün heißt:
   alle Geräte arbeiten auf denselben Daten.
2. Gegenprobe: auf dem Handy eintragen, am Rechner die Seite offen lassen —
   der Eintrag muss dort **ohne Neuladen** erscheinen.
3. Unten auf jeder Seite steht dann **„live verbunden"** statt „Demo-Modus".

Der rote Hinweis auf der Schülerseite und im Lehrkraft-Bereich verschwindet
erst, wenn die Verbindung wirklich steht.

---

## Neuer Jahrgang im nächsten Schuljahr

In `js/config.js` die Zeile

```js
datensatz: 'board-2026',
```

auf z. B. `'board-2027'` ändern. Die Seite startet dann leer; die alten Daten
bleiben in der Datenbank erhalten und lassen sich durch Zurückstellen des Namens
jederzeit wieder anzeigen.

## Wenn etwas klemmt

| Anzeige | Ursache | Lösung |
|---|---|---|
| „Demo-Modus" trotz Eintragung | `apiKey` oder `projectId` fehlt in der `config.js` | Schritt 4, danach Strg + F5 |
| Test meldet „hat nicht geantwortet" | keine Firestore-Datenbank angelegt | Schritt 2 |
| Test meldet „verweigert das Schreiben" | Regeln nicht veröffentlicht | Schritt 3 |
| Test meldet „Zugangsdaten stimmen nicht" | Block unvollständig kopiert | Schritt 4 |
| PDF-Knopf tut nichts | keine Internetverbindung | die PDF-Bibliothek wird online geladen |

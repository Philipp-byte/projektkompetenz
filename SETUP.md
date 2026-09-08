# Einrichtung der Datenbank (einmalig, ca. 10 Minuten)

Die Seite läuft sofort — aber zunächst im **Demo-Modus**: Jedes Handy sieht dann nur
seine eigenen Eintragungen. Für den echten Einsatz braucht es eine gemeinsame
Datenbank, damit alle Geräte dieselben Belegungszahlen sehen und ein voller Platz
auch wirklich voll ist.

Dafür wird **Firebase Firestore** verwendet: kostenlos, von Google, für 30 Anmeldungen
weit unter jeder Grenze des Gratis-Kontingents.

---

## Schritt 1 — Firebase-Projekt anlegen

1. <https://console.firebase.google.com> öffnen und mit einem Google-Konto anmelden.
2. **Projekt erstellen** anklicken.
3. Name: `projektkompetenz` — weiter.
4. Google Analytics: **ausschalten** (wird hier nicht gebraucht) — Projekt erstellen.

## Schritt 2 — Datenbank anlegen

1. Links im Menü: **Erstellen → Firestore Database**.
2. **Datenbank erstellen** anklicken.
3. Standort: **eur3 (europe-west)** oder **europe-west3 (Frankfurt)** wählen —
   die Daten bleiben damit in Europa.
4. Startmodus: **Im Produktionsmodus starten**. Die Regeln kommen in Schritt 4.

## Schritt 3 — Zugangsdaten in die Seite eintragen

1. Oben links auf das **Zahnrad → Projekteinstellungen**.
2. Nach unten scrollen zu **Meine Apps** → auf das Symbol **`</>`** (Web) klicken.
3. App-Name: `Projektkompetenz` — **App registrieren** (Hosting NICHT ankreuzen).
4. Es erscheint ein Block, der so aussieht:

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

5. Diese sechs Werte in die Datei **`js/config.js`** übertragen, in den Abschnitt
   `firebase: { … }`. Anführungszeichen und Kommas beibehalten.
6. Datei speichern und hochladen (bei GitHub: Datei bearbeiten → *Commit changes*).

> Diese Schlüssel dürfen öffentlich stehen — genau dafür sind sie gemacht.
> Was erlaubt ist, regeln allein die Regeln aus Schritt 4.

## Schritt 4 — Sicherheitsregeln setzen

1. In Firestore oben auf den Reiter **Regeln**.
2. Den kompletten Inhalt durch die Datei **`firestore.rules`** aus diesem Projekt
   ersetzen (Inhalt kopieren und einfügen).
3. **Veröffentlichen** anklicken.

Diese Regeln erlauben Schreibzugriff **nur** auf den einen Datensatz der Anmeldung
und begrenzen dessen Größe. Alles andere in der Datenbank ist gesperrt.

## Schritt 5 — Probe aufs Exempel

1. Die Seite auf dem Handy öffnen, eintragen.
2. Die Seite am Rechner öffnen — die Anmeldung muss dort sofort erscheinen.
3. Unten steht dann **„live verbunden"** statt „Demo-Modus".

Fertig.

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
| „Demo-Modus" trotz Eintragung | `apiKey` oder `projectId` fehlt | Schritt 3 prüfen, Seite neu laden (Strg + F5) |
| „keine Verbindung" | Regeln zu streng oder Datenbank fehlt | Schritt 2 und 4 wiederholen |
| Anmeldung wird nicht gespeichert | Regeln nicht veröffentlicht | Schritt 4, **Veröffentlichen** |
| PDF-Knopf tut nichts | keine Internetverbindung | PDF-Bibliothek wird online geladen |

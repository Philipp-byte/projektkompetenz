/* ============================================================================
   Projektkompetenz – zentrale Konfiguration
   Kolping Bildung
   ----------------------------------------------------------------------------
   Hier wird alles eingestellt: Projekte, Plätze, Klassen, Lehrkräfte,
   Lehrkraft-Passwort und die Verbindung zur Datenbank.
   Nach jeder Änderung: Datei speichern, hochladen (commit + push) – fertig.
   ========================================================================= */

window.CONFIG = {

  /* --- Kopf der Seite ---------------------------------------------------- */
  schuljahr: '2026 / 27',
  titel: 'Projektkompetenz',
  untertitel: 'Wähle dein Projekt',

  /* --- Klassen ------------------------------------------------------------
     Genau diese Klassen können ausgewählt werden.                          */
  klassen: ['BKWI 15.1', 'BKW 16'],

  /* --- Lehrkräfte --------------------------------------------------------- */
  lehrkraefte: {
    thornton: { name: 'Stine Thornton',     kurz: 'Thornton', initialen: 'ST' },
    riegert:  { name: 'Philipp Riegert',    kurz: 'Riegert',  initialen: 'PR' },
    beide:    { name: 'Thornton & Riegert', kurz: 'Beide',    initialen: 'TR' }
  },

  /* --- Lehrkraft-Zugang ---------------------------------------------------
     Gespeichert wird nur der SHA-256-Fingerabdruck, nicht das Passwort.
     Neues Passwort setzen: passwort.html öffnen, Passwort eintippen,
     ausgegebenen Fingerabdruck hier unten einsetzen.
     Aktuelles Passwort:  Projekt2027!                                       */
  adminHash: '140f5106bf1ecef2784832e1f59796214edfdb54c7c279a411dfd76eda34852b',

  /* --- Datenbank (Firebase / Firestore) -----------------------------------
     Solange projectId leer ist, läuft die Seite im DEMO-MODUS:
     alles funktioniert, die Daten bleiben aber nur auf dem eigenen Gerät.
     Einrichtung Schritt für Schritt: siehe SETUP.md                         */
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },

  /* Name des Datensatzes in der Datenbank. Für einen neuen Jahrgang einfach
     umbenennen (z. B. 'board-2027') – die alten Daten bleiben unberührt.    */
  datensatz: 'board-2026',

  /* --- Projekte -----------------------------------------------------------
     id        : darf später nicht mehr geändert werden (interner Schlüssel)
     name      : große Überschrift auf der Karte
     klartext  : erklärender Zusatz – damit klar ist, worum es geht
     plaetze   : maximale Teilnehmerzahl
     lehrkraft : thornton | riegert | beide
     details   : Stichpunkte in der Detailansicht
     badge     : optionaler Hinweis oben auf der Karte                       */
  projekte: [
    {
      id: 'mission-2030',
      name: 'Mission 2030',
      klartext: 'SDGs – ein Projekt aus den Nachhaltigkeitszielen entwickeln',
      plaetze: 3,
      lehrkraft: 'thornton',
      icon: 'globe',
      details: [
        'Aus den 17 Zielen der UN ein eigenes Projekt ableiten',
        'Ziel, Zielgruppe und Wirkung selbst festlegen',
        'Umsetzung an der Schule oder im Stadtteil'
      ]
    },
    {
      id: 'social-media',
      name: 'Signal',
      klartext: 'Social-Media-Studio: Kanal planen, Inhalte produzieren',
      plaetze: 2,
      lehrkraft: 'beide',
      icon: 'signal',
      badge: 'Für das 1. Jahr',
      details: [
        'Redaktionsplan und Zielgruppe festlegen',
        'Reels, Posts und Grafiken selbst produzieren',
        'Reichweite messen und auswerten'
      ]
    },
    {
      id: 'home-it',
      name: 'Homebase',
      klartext: 'Home-IT-Kit aufbauen + 3D-Projektor',
      plaetze: 2,
      lehrkraft: 'riegert',
      icon: 'chip',
      details: [
        'Eigenes Home-IT-Kit zusammenstellen und einrichten',
        '3D-Projektor aufbauen und in Betrieb nehmen',
        'Anleitung für andere schreiben'
      ]
    },
    {
      id: 'car-kit',
      name: 'Autopilot',
      klartext: 'Car-Kit + Roboterarm bauen und programmieren',
      plaetze: 2,
      lehrkraft: 'riegert',
      icon: 'car',
      details: [
        'Fahrzeug-Kit montieren und zum Fahren bringen',
        'Roboterarm ansteuern',
        'Eigene Fahr- und Greifroutinen programmieren'
      ]
    },
    {
      id: 'robotik',
      name: 'Robotik-Lab',
      klartext: 'Roboter bauen, steuern und eine Aufgabe lösen lassen',
      plaetze: 2,
      lehrkraft: 'riegert',
      icon: 'robot',
      details: [
        'Roboter aufbauen und in Betrieb nehmen',
        'Sensoren und Motoren ansteuern',
        'Am Ende eine selbst gestellte Aufgabe lösen'
      ]
    },
    {
      id: 'schul-ki',
      name: 'Schul-KI',
      klartext: 'Eine eigene KI für unsere Schule entwickeln',
      plaetze: 3,
      lehrkraft: 'riegert',
      icon: 'brain',
      details: [
        'Sinnvollen Anwendungsfall für die Schule finden',
        'KI mit eigenen Inhalten füttern und testen',
        'Grenzen, Datenschutz und Verantwortung klären'
      ]
    },
    {
      id: 'vr-360',
      name: 'Deep Dive',
      klartext: 'VR-Brille: Szenario in Blender bauen + 360-Grad-Video',
      plaetze: 2,
      lehrkraft: 'beide',
      icon: 'vr',
      details: [
        'Eigene 3D-Szene in Blender modellieren',
        'Szene für die VR-Brille aufbereiten',
        '360-Grad-Video drehen und schneiden'
      ]
    },
    {
      id: 'makerspace',
      name: 'Makerspace',
      klartext: '3D-Druck: Produkt entwickeln, Shop-Homepage und Werbung',
      plaetze: 4,
      lehrkraft: 'riegert',
      icon: 'cube',
      badge: 'Größtes Team',
      details: [
        'Produkt entwerfen und im 3D-Drucker drucken',
        'Homepage bauen: Produktdetails, Bestellformular, Werbung',
        'Teilbereich T-Shirts: Vorderseite ist vorgegeben, die Rückseite wird individuell bestellt – das Team entwickelt die Druckvorlage',
        'Teilbereich: Bilder mit Beleuchtung',
        'Teilbereich: Springbrunnen gemeinsam mit der BKWI'
      ]
    },
    {
      id: 'sali',
      name: 'Projekt Sali',
      klartext: 'Projekt Sali begleiten und weiterentwickeln',
      plaetze: 2,
      lehrkraft: 'thornton',
      icon: 'heart',
      details: [
        'Projekt Sali kennenlernen',
        'Eigenen Beitrag planen und umsetzen',
        'Ergebnis dokumentieren'
      ]
    },
    {
      id: 'game-forge',
      name: 'Game Forge',
      klartext: 'Analoges Spiel entwickeln: Würfel, DnD oder Karten',
      plaetze: 3,
      lehrkraft: 'thornton',
      icon: 'dice',
      details: [
        'Spielidee, Regeln und Material entwickeln',
        'Prototyp bauen und mit Testspielern erproben',
        'Regelheft und Verpackung gestalten'
      ]
    },
    {
      id: 'escape',
      name: 'Escape Protocol',
      klartext: 'Einen digitalen Escape Room programmieren',
      plaetze: 2,
      lehrkraft: 'riegert',
      icon: 'lock',
      details: [
        'Story und Rätselkette entwerfen',
        'Escape Room digital programmieren',
        'Mit einer Testgruppe durchspielen und nachschärfen'
      ]
    },
    {
      id: 'schule-2040',
      name: 'Schule 2040',
      klartext: '„Schule der Zukunft 2040“ – Vision und Konzept',
      plaetze: 3,
      lehrkraft: 'thornton',
      icon: 'rocket',
      details: [
        'Wie sieht Schule im Jahr 2040 aus?',
        'Konzept entwickeln und begründen',
        'Ergebnis anschaulich präsentieren'
      ]
    },
    {
      id: 'fake-news',
      name: 'Fake News Lab',
      klartext: 'Wahrheit oder Manipulation?',
      plaetze: 3,
      lehrkraft: 'thornton',
      icon: 'search',
      badge: 'Ausweichprojekt',
      details: [
        'Falschmeldungen erkennen und überprüfen',
        'Eigene Fälle sammeln und auswerten',
        'Material für die Mitschülerinnen und Mitschüler erstellen'
      ]
    }
  ]
};

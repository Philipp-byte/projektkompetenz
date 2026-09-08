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
     id         : darf später nicht mehr geändert werden (interner Schlüssel)
     name       : steht auf der Karte – sonst nichts, bewusst ohne Beschreibung
     plaetze    : maximale Teilnehmerzahl
     lehrkraft  : thornton | riegert | beide
     icon       : Symbol auf der Karte
     badge      : optionaler Hinweis oben auf der Karte
     nurKlassen : wenn gesetzt, dürfen sich nur diese Klassen eintragen
                  (die Lehrkraft darf trotzdem jeden zuordnen)              */
  projekte: [
    {
      id: 'mission-2030',
      name: 'SDGs',
      plaetze: 3,
      lehrkraft: 'thornton',
      icon: 'globe'
    },
    {
      id: 'social-media',
      name: 'Social-Media',
      plaetze: 2,
      lehrkraft: 'beide',
      icon: 'signal',
      nurKlassen: ['BKW 16']
    },
    {
      id: 'home-it',
      name: 'Home-IT Kit + 3D-Projektor',
      plaetze: 2,
      lehrkraft: 'riegert',
      icon: 'chip'
    },
    {
      id: 'car-kit',
      name: 'Car-Kit + Roboterarm',
      plaetze: 2,
      lehrkraft: 'riegert',
      icon: 'car'
    },
    {
      id: 'robotik',
      name: 'Roboter',
      plaetze: 2,
      lehrkraft: 'riegert',
      icon: 'robot'
    },
    {
      id: 'schul-ki',
      name: 'Schul-KI entwickeln',
      plaetze: 3,
      lehrkraft: 'riegert',
      icon: 'brain'
    },
    {
      id: 'vr-360',
      name: 'VR-Brille (Blender) + 360° Video',
      plaetze: 2,
      lehrkraft: 'beide',
      icon: 'vr'
    },
    {
      id: 'makerspace',
      name: '3D-Druck',
      plaetze: 4,
      lehrkraft: 'riegert',
      icon: 'cube'
    },
    {
      id: 'sali',
      name: 'Wie hat die Erziehung unsere Persönlichkeit beeinflusst?',
      plaetze: 2,
      lehrkraft: 'thornton',
      icon: 'heart'
    },
    {
      id: 'game-forge',
      name: 'Analoges Spiel entwickeln',
      plaetze: 3,
      lehrkraft: 'thornton',
      icon: 'dice'
    },
    {
      id: 'escape',
      name: 'Escaperoom digital programmieren',
      plaetze: 2,
      lehrkraft: 'riegert',
      icon: 'lock'
    },
    {
      id: 'schule-2040',
      name: 'Schule der Zukunft 2040',
      plaetze: 3,
      lehrkraft: 'thornton',
      icon: 'rocket'
    },
    {
      id: 'fake-news',
      name: 'Fake News Lab – Wahrheit oder Manipulation?',
      plaetze: 3,
      lehrkraft: 'thornton',
      icon: 'search',
      badge: 'Ausweichprojekt'
    }
  ]
};

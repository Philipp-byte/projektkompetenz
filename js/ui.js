/* ============================================================================
   ui.js – gemeinsame Bausteine für beide Seiten
   Symbole, Meldungen, Dialoge, Datumsformate, Passwortprüfung.
   ========================================================================= */

window.UI = (function () {
  'use strict';

  /* ----------------------------------------------------------- Symbole */

  const PFADE = {
    /* Projektsymbole */
    globe:  '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.4 3.8 5.6 3.8 9S14.5 18.6 12 21c-2.5-2.4-3.8-5.6-3.8-9S9.5 5.4 12 3z"/>',
    signal: '<circle cx="12" cy="12" r="2"/><path d="M8.6 15.4a4.8 4.8 0 0 1 0-6.8M15.4 8.6a4.8 4.8 0 0 1 0 6.8M5.8 18.2a8.8 8.8 0 0 1 0-12.4M18.2 5.8a8.8 8.8 0 0 1 0 12.4"/>',
    chip:   '<rect x="4.5" y="4.5" width="15" height="15" rx="2.5"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2.2v2.3M15 2.2v2.3M9 19.5v2.3M15 19.5v2.3M2.2 9h2.3M2.2 15h2.3M19.5 9h2.3M19.5 15h2.3"/>',
    car:    '<path d="M3.2 16.5v-3.9l2-5.1h13.6l2 5.1v3.9z"/><path d="M4.5 16.5v1.8a1 1 0 0 0 1 1h1.2a1 1 0 0 0 1-1v-1.8M15.3 16.5v1.8a1 1 0 0 0 1 1h1.2a1 1 0 0 0 1-1v-1.8"/><circle cx="7.6" cy="13.4" r="1"/><circle cx="16.4" cy="13.4" r="1"/>',
    robot:  '<rect x="4" y="8.2" width="16" height="11.5" rx="2.4"/><path d="M12 8.2V5.6"/><circle cx="12" cy="3.9" r="1.6"/><circle cx="9.2" cy="13" r="1.1"/><circle cx="14.8" cy="13" r="1.1"/><path d="M9.5 16.6h5M1.9 12.2v3.4M22.1 12.2v3.4"/>',
    brain:  '<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="18" r="2.2"/><circle cx="12" cy="12" r="2.6"/><path d="M7.6 7.6l2.6 2.6M16.4 7.6l-2.6 2.6M7.6 16.4l2.6-2.6M16.4 16.4l-2.6-2.6"/>',
    vr:     '<path d="M3 9.6A2.6 2.6 0 0 1 5.6 7h12.8A2.6 2.6 0 0 1 21 9.6v4.8a2.6 2.6 0 0 1-2.6 2.6h-3a1.7 1.7 0 0 1-1.4-.75l-.85-1.25a1.4 1.4 0 0 0-2.3 0l-.85 1.25a1.7 1.7 0 0 1-1.4.75h-3A2.6 2.6 0 0 1 3 14.4z"/><circle cx="8.2" cy="12" r="1.4"/><circle cx="15.8" cy="12" r="1.4"/>',
    cube:   '<path d="M12 2.6l8.5 4.9v9l-8.5 4.9-8.5-4.9v-9z"/><path d="M3.7 7.4L12 12.2l8.3-4.8M12 12.2v9.2"/>',
    heart:  '<path d="M12 20.4l-1.5-1.4C5.3 14.3 2 11.3 2 7.7 2 5 4.1 3 6.7 3c1.5 0 3 .7 3.9 1.9L12 6.4l1.4-1.5C14.3 3.7 15.8 3 17.3 3 19.9 3 22 5 22 7.7c0 3.6-3.3 6.6-8.5 11.3z"/>',
    dice:   '<rect x="3.5" y="3.5" width="17" height="17" rx="3.2"/><circle cx="8.6" cy="8.6" r="1.15"/><circle cx="15.4" cy="8.6" r="1.15"/><circle cx="12" cy="12" r="1.15"/><circle cx="8.6" cy="15.4" r="1.15"/><circle cx="15.4" cy="15.4" r="1.15"/>',
    lock:   '<rect x="4.2" y="10" width="15.6" height="10.8" rx="2.4"/><path d="M8 10V6.9a4 4 0 0 1 8 0V10"/><circle cx="12" cy="15.4" r="1.35"/>',
    rocket: '<path d="M12 2.4c3 2.1 4.9 5.7 4.9 9.6 0 1.4-.2 2.7-.7 3.9H7.8c-.5-1.2-.7-2.5-.7-3.9 0-3.9 1.9-7.5 4.9-9.6z"/><circle cx="12" cy="9.8" r="2"/><path d="M7.8 15.9L5.2 18.6l.9 2.9 2.6-1.4M16.2 15.9l2.6 2.7-.9 2.9-2.6-1.4M10.4 20.2h3.2"/>',
    search: '<circle cx="10.6" cy="10.6" r="6.6"/><path d="M15.4 15.4L21 21"/>',

    /* Bedienelemente */
    check:  '<path d="M4.5 12.5l5 5.2L19.5 6.5"/>',
    chevron:'<path d="M6 9.2l6 6 6-6"/>',
    info:   '<circle cx="12" cy="12" r="9"/><path d="M12 11.2v5.2M12 7.8h.01"/>',
    warn:   '<path d="M12 3.4L22.2 20.6H1.8z"/><path d="M12 10v4.2M12 17.4h.01"/>',
    x:      '<path d="M6 6l12 12M18 6L6 18"/>',
    muell:  '<path d="M4 7h16M9.2 7V5.2a1.2 1.2 0 0 1 1.2-1.2h3.2a1.2 1.2 0 0 1 1.2 1.2V7M6.3 7l.9 12.6a1.4 1.4 0 0 0 1.4 1.3h6.8a1.4 1.4 0 0 0 1.4-1.3L17.7 7"/>',
    zurueck:'<path d="M15 4.5L7.5 12l7.5 7.5"/>',
    laden:  '<path d="M12 3.2v12.4M7.2 11l4.8 4.8 4.8-4.8M4 20.4h16"/>',
    leute:  '<circle cx="9" cy="8" r="3.6"/><path d="M2.4 20.2a6.6 6.6 0 0 1 13.2 0"/><path d="M16.2 5.2a3.6 3.6 0 0 1 0 6.6M18 20.2a6.7 6.7 0 0 0-1.6-4.3"/>',
    frisch: '<path d="M3.4 12a8.6 8.6 0 0 1 14.8-6M20.6 12a8.6 8.6 0 0 1-14.8 6"/><path d="M18.6 2.2v4h-4M5.4 21.8v-4h4"/>',
    datei:  '<path d="M14 3.2H7.4a2.2 2.2 0 0 0-2.2 2.2v13.2a2.2 2.2 0 0 0 2.2 2.2h9.2a2.2 2.2 0 0 0 2.2-2.2V8.2z"/><path d="M14 3.2v5h4.8"/><path d="M8.6 13.4h6.8M8.6 16.8h4.6"/>',
    schild: '<path d="M12 2.8l7.6 3v5.4c0 4.6-3.1 8.4-7.6 10-4.5-1.6-7.6-5.4-7.6-10V5.8z"/><path d="M9 12.2l2.2 2.2 4-4.2"/>',
    plus:   '<path d="M12 5v14M5 12h14"/>',
    qr:     '<rect x="3.4" y="3.4" width="7" height="7" rx="1.4"/><rect x="13.6" y="3.4" width="7" height="7" rx="1.4"/><rect x="3.4" y="13.6" width="7" height="7" rx="1.4"/><path d="M13.6 13.6h3v3h-3zM20.6 13.6v3M13.6 20.6h3M20.6 20.6v.01"/>'
  };

  function symbol(name, groesse) {
    const d = PFADE[name] || PFADE.info;
    const s = groesse || 22;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" ' +
           'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" ' +
           'stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  }

  /* ------------------------------------------------------------- Meldungen */

  function meldung(text, art) {
    let raum = document.querySelector('.toast-raum');
    if (!raum) {
      raum = document.createElement('div');
      raum.className = 'toast-raum';
      raum.setAttribute('role', 'status');
      raum.setAttribute('aria-live', 'polite');
      document.body.appendChild(raum);
    }
    const sym = art === 'gut' ? 'check' : art === 'fehler' ? 'warn' : art === 'warn' ? 'warn' : 'info';
    const el = document.createElement('div');
    el.className = 'toast ' + (art || '');
    el.innerHTML = symbol(sym, 18) + '<span>' + sicher(text) + '</span>';
    raum.appendChild(el);
    setTimeout(() => {
      el.classList.add('weg');
      setTimeout(() => el.remove(), 320);
    }, art === 'fehler' ? 4800 : 3200);
  }

  /* --------------------------------------------------------------- Dialoge */

  /**
   * Rückfrage als Bottom-Sheet. Liefert true/false.
   */
  function fragen({ titel, text, ja = 'Ja, machen', nein = 'Abbrechen', gefahr = false }) {
    return new Promise(loesen => {
      const schleier = document.createElement('div');
      schleier.className = 'schleier offen';
      schleier.innerHTML =
        '<div class="dialog" role="dialog" aria-modal="true">' +
          '<div class="dialog-griff"></div>' +
          '<h3>' + sicher(titel) + '</h3>' +
          '<p>' + text + '</p>' +
          '<div class="dialog-knoepfe">' +
            '<button class="knopf ' + (gefahr ? 'knopf--gefahr' : '') + '" data-ja>' + sicher(ja) + '</button>' +
            '<button class="knopf knopf--leise" data-nein>' + sicher(nein) + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(schleier);
      const zu = wert => { schleier.remove(); document.removeEventListener('keydown', taste); loesen(wert); };
      const taste = e => { if (e.key === 'Escape') zu(false); };
      schleier.querySelector('[data-ja]').addEventListener('click', () => zu(true));
      schleier.querySelector('[data-nein]').addEventListener('click', () => zu(false));
      schleier.addEventListener('click', e => { if (e.target === schleier) zu(false); });
      document.addEventListener('keydown', taste);
      setTimeout(() => schleier.querySelector('[data-ja]').focus(), 60);
    });
  }

  /* ------------------------------------------------------------- Textwerte */

  function sicher(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function zeitpunkt(iso) {
    if (!iso) return '–';
    const d = new Date(iso);
    if (isNaN(d)) return '–';
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
           ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
  }

  function vorhin(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const s = Math.round((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'gerade eben';
    if (s < 3600) return 'vor ' + Math.floor(s / 60) + ' Min.';
    if (s < 86400) return 'vor ' + Math.floor(s / 3600) + ' Std.';
    return zeitpunkt(iso);
  }

  function heute() {
    return new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /* ----------------------------------------------------- Passwortprüfung */

  /* Eigene SHA-256-Berechnung. Der Browser bringt crypto.subtle mit, das gibt
     es aber nur über https – beim direkten Öffnen einer Datei nicht. Damit die
     Seite auch dann funktioniert, ist die Berechnung hier ausgeschrieben.   */
  function sha256(text) {
    const K = [
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];

    const bytes = [];
    for (const zeichen of unescape(encodeURIComponent(text))) bytes.push(zeichen.charCodeAt(0));
    const laenge = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push((laenge / Math.pow(2, i * 8)) & 0xff);

    const rr = (x, n) => (x >>> n) | (x << (32 - n));

    for (let b = 0; b < bytes.length; b += 64) {
      const w = new Array(64);
      for (let i = 0; i < 16; i++) {
        w[i] = (bytes[b + i * 4] << 24) | (bytes[b + i * 4 + 1] << 16) |
               (bytes[b + i * 4 + 2] << 8) | bytes[b + i * 4 + 3];
      }
      for (let i = 16; i < 64; i++) {
        const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, bb, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
        const maj = (a & bb) ^ (a & c) ^ (bb & c);
        const t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0;
        d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      H = [H[0] + a, H[1] + bb, H[2] + c, H[3] + d, H[4] + e, H[5] + f, H[6] + g, H[7] + h].map(x => x | 0);
    }
    return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }

  function passwortStimmt(eingabe) {
    return sha256(String(eingabe)) === String(window.CONFIG.adminHash).toLowerCase();
  }

  /* --------------------------------------------------------------- Sonstiges */

  function lehrkraftName(schluessel) {
    const l = window.CONFIG.lehrkraefte[schluessel];
    return l ? l.name : '–';
  }

  function projektName(id) {
    const p = window.CONFIG.projekte.find(x => x.id === id);
    return p ? p.name : (id ? id : 'ohne Projekt');
  }

  return {
    symbol, meldung, fragen, sicher, zeitpunkt, vorhin, heute,
    sha256, passwortStimmt, lehrkraftName, projektName
  };
})();

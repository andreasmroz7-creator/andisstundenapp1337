// Rechenregeln der Stunden-App (Stand 19.11.2026)
// Alle Werte in Industriestunden (100er-System).
(function (g) {
  // Viertelstunde: Rest unter 7,5 Min. abrunden, darüber aufrunden
  function rundeViertel(min) {
    var q = Math.floor(min / 15), rest = min - q * 15;
    if (rest >= 7.5) q++;
    return q * 15;
  }

  // "7.50" / "7:50" / "7" / "750" -> Minuten seit 0 Uhr
  function zeitZuMin(s) {
    s = String(s).trim().replace(',', '.').replace(':', '.');
    var m = s.match(/^(\d{1,2})(?:\.(\d{1,2}))?$/);
    if (!m) { m = s.match(/^(\d{1,2})(\d{2})$/); if (!m) return null; }
    var h = +m[1], mi = m[2] ? +(m[2].length === 1 ? m[2] + '0' : m[2]) : 0;
    if (h > 24 || mi > 59) return null;
    return h * 60 + mi;
  }

  function spanneMin(von, bis) {
    var a = zeitZuMin(von), b = zeitZuMin(bis);
    if (a == null || b == null) return 0;
    if (b < a) b += 24 * 60; // über Mitternacht
    return b - a;
  }

  // "7.50 bis 14.30 und 15 bis 19" -> [{von,bis}, ...]
  function leseZeiten(text) {
    var t = String(text).toLowerCase().replace(/uhr/g, ' ');
    var re = /(\d{1,2}(?:[.:,]\d{1,2})?)\s*(?:bis|-|–)\s*(\d{1,2}(?:[.:,]\d{1,2})?)/g, m, out = [];
    while ((m = re.exec(t))) out.push({ von: m[1].replace(',', '.').replace(':', '.'), bis: m[2].replace(',', '.').replace(':', '.') });
    return out;
  }

  // "erster Laden 5 Std., zweiter 4,5 Std." -> [5, 4.5]
  function leseStunden(text) {
    var t = String(text).toLowerCase(), re = /(\d+(?:[.,]\d+)?)\s*(?:std|stunden|h)\b/g, m, out = [];
    while ((m = re.exec(t))) out.push(parseFloat(m[1].replace(',', '.')));
    return out;
  }

  function tlLaden(art, fahrer) {
    if (art === 'GM') return fahrer ? 0.5 : 0.25;
    return fahrer ? 1 : 0.5; // NMD und NC (Netto City) = normaler Laden
  }

  // e = Eintrag, siehe app: {laeden:[{art, zeiten:[{von,bis}], std}], modus:'zeit'|'std',
  //   tl, fahrer, fahrMin, auswaerts, team:'leipzig'|'halle'|'reise', anreise, abreise, uebernachtung}
  function berechne(e) {
    var laeden = (e.laeden || []).filter(function (l) { return l && !l.ausfall; });
    var n = laeden.length;
    var arbeitMin = 0, arbeit = 0;
    if (e.modus === 'std') {
      laeden.forEach(function (l) { arbeit += +l.std || 0; });
      arbeitMin = Math.round(arbeit * 60);
      arbeit = rundeViertel(arbeitMin) / 60;
    } else {
      laeden.forEach(function (l) { (l.zeiten || []).forEach(function (z) { arbeitMin += spanneMin(z.von, z.bis); }); });
      arbeit = rundeViertel(arbeitMin) / 60;
    }
    var zwischen = n >= 2 ? 0.5 : 0;
    var tl = 0;
    if (e.tl) laeden.forEach(function (l) { tl += tlLaden(l.art, e.fahrer); });
    var zwUeber = n >= 2 ? Math.max(0, (+e.fahrZw || 0) - 30) : 0;
    var fz = (+e.fahrMin || 0) + zwUeber, grenze = n >= 2 ? 120 : 60;
    var ueber = e.auswaerts ? fz : Math.max(0, fz - grenze);
    // bezahlter Teil wird wie die Arbeitszeit auf die Viertelstunde gerundet
    var fahrt = rundeViertel(e.fahrer ? ueber : ueber / 2) / 60;
    var anreise = 0;
    if (e.team === 'halle' && n > 0) anreise = 1.5;
    // Reise: An-/Abreise pauschal 1,5 Std. (Dresden, Coburg …), für andere Standorte eigener Wert
    var reiseStd = (e.anreiseStd != null && e.anreiseStd !== '') ? +e.anreiseStd : 1.5;
    if (e.team === 'reise') { if (e.anreise) anreise += reiseStd; if (e.abreise) anreise += reiseStd; }
    var verpflegung = 0;
    if (e.team === 'reise') {
      if (e.anreise || e.abreise) verpflegung = (e.anreise ? 10 : 0) + (e.abreise ? 10 : 0);
      else if (e.uebernachtung) verpflegung = 20;
    }
    var gesamt = Math.round((arbeit + zwischen + tl + fahrt + anreise) * 100) / 100;
    // (20.11.) alte Tage ohne Uhrzeiten: Gesamtzeit aus der früheren Zeiterfassungs-App fest übernehmen (enthält schon Fahrt, TL usw.)
    if (e.festGesamt != null && e.festGesamt !== '') {
      var fg = Math.round(+e.festGesamt * 100) / 100, t = e.festTeile || { arbeit: fg };
      return { zwUeber: 0, fahrGesamt: 0, arbeitMin: Math.round((+t.arbeit || 0) * 60), arbeit: +t.arbeit || 0, zwischen: 0, tl: +t.tl || 0, fahrt: +t.fahrt || 0, anreise: +t.anreise || 0, gesamt: fg, verpflegung: verpflegung, fest: true };
    }
    return { zwUeber: zwUeber, fahrGesamt: fz, arbeitMin: arbeitMin, arbeit: arbeit, zwischen: zwischen, tl: tl, fahrt: fahrt,
      anreise: anreise, gesamt: gesamt, verpflegung: verpflegung };
  }

  g.Rechnen = { rundeViertel: rundeViertel, zeitZuMin: zeitZuMin, spanneMin: spanneMin,
    leseZeiten: leseZeiten, leseStunden: leseStunden, tlLaden: tlLaden, berechne: berechne };
})(typeof window !== 'undefined' ? window : globalThis);

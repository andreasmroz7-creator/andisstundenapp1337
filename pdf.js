// Kleiner PDF-Bauer ohne Fremd-Bibliothek (A4 quer, Helvetica, Umlaute + €)
(function (g) {
  function enc(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c === 0x20AC) out += String.fromCharCode(0x80);
      else if (c === 0x2013) out += String.fromCharCode(0x96);
      else if (c < 256) out += s[i];
      else out += '?';
    }
    return out.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
  function Doc() { this.pages = []; this.cur = null; this.W = 842; this.H = 595; }
  Doc.prototype.addPage = function () { this.cur = []; this.pages.push(this.cur); };
  // y von oben gemessen
  Doc.prototype.text = function (x, y, s, size, bold, align) {
    size = size || 10;
    var w = Doc.breite(s, size, bold);
    if (align === 'r') x -= w; else if (align === 'c') x -= w / 2;
    this.cur.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf ' + x.toFixed(1) + ' ' + (this.H - y).toFixed(1) + ' Td (' + enc(String(s)) + ') Tj ET');
  };
  Doc.prototype.line = function (x1, y1, x2, y2, w, grau) {
    this.cur.push((grau != null ? grau + ' G ' : '0 G ') + (w || 0.5) + ' w ' + x1 + ' ' + (this.H - y1) + ' m ' + x2 + ' ' + (this.H - y2) + ' l S');
  };
  Doc.prototype.rect = function (x, y, w, h, grau) {
    this.cur.push(grau + ' g ' + x + ' ' + (this.H - y - h) + ' ' + w + ' ' + h + ' re f 0 g');
  };
  // grobe Breitenschätzung Helvetica
  Doc.breite = function (s, size, bold) { return String(s).length * size * (bold ? 0.56 : 0.52); };
  Doc.prototype.bytes = function () {
    var objs = [], self = this;
    objs.push('<< /Type /Catalog /Pages 2 0 R >>');
    objs.push(null); // Pages, später
    objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    var kids = [];
    this.pages.forEach(function (p) {
      var inhalt = p.join('\n');
      objs.push('<< /Length ' + inhalt.length + ' >>\nstream\n' + inhalt + '\nendstream');
      var cId = objs.length;
      objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + self.W + ' ' + self.H + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + cId + ' 0 R >>');
      kids.push(objs.length + ' 0 R');
    });
    objs[1] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + kids.length + ' >>';
    var s = '%PDF-1.4\n', offs = [];
    objs.forEach(function (o, i) { offs.push(s.length); s += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
    var xref = s.length;
    s += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
    offs.forEach(function (o) { s += ('0000000000' + o).slice(-10) + ' 00000 n \n'; });
    s += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
    var b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 255;
    return b;
  };
  g.MiniPDF = Doc;
})(typeof window !== 'undefined' ? window : globalThis);

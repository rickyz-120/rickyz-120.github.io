// Tela do dashboard holográfico: desenha um gráfico (barras, linha ou rosca) num canvas 2D.
// O canvas vira textura na cena 3D ou imagem estática no modo sem WebGL.
import { clamp, tr } from './util.js';

const W = 1024, H = 576;
const MONO = '"JetBrains Mono",ui-monospace,monospace';
const BODY = 'Manrope,system-ui,sans-serif';
const DISP = 'Unbounded,system-ui,sans-serif';
const ease = (x) => 1 - Math.pow(1 - x, 3);

function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}
const fmt = (v, unit, lang) => (Math.round(v * 10) / 10).toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR') + (unit || '');

export function createScreen() {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d');
  const s = { spec: null, tag: '', lang: 'pt', colors: {}, prog: 1, paused: false, raf: 0, onUpdate: () => {} };

  function labelsOf(spec) { return tr(spec.labels, s.lang) || []; }

  function draw() {
    const C = s.colors, spec = s.spec, e = ease(s.prog);
    c.clearRect(0, 0, W, H);
    c.fillStyle = C.panel; c.fillRect(0, 0, W, H);
    c.fillStyle = C.scan;
    for (let y = 0; y < H; y += 8) c.fillRect(0, y, W, 2);
    c.strokeStyle = C['accent-2']; c.lineWidth = 3; c.strokeRect(5, 5, W - 10, H - 10);
    if (!spec) return;
    c.textBaseline = 'alphabetic';
    c.font = '500 22px ' + MONO; c.fillStyle = C.muted;
    c.textAlign = 'left'; c.fillText(tr(spec.label, s.lang) || '', 40, 58);
    c.textAlign = 'right'; c.fillText(tr(spec.source, s.lang) || s.tag, W - 74, 58);
    c.fillStyle = C['accent-2']; c.beginPath(); c.arc(W - 44, 51, 8, 0, Math.PI * 2); c.fill();

    const x0 = 96, x1 = W - 50, y0 = 120, y1 = 484;
    const vals = spec.values || [], labels = labelsOf(spec), unit = spec.unit || '';
    if (spec.kind === 'bars' || spec.kind === 'line') {
      let lo = 0, hi;
      if (spec.kind === 'bars') {
        const step = niceStep(Math.max(...vals) * 1.05 / 4); hi = step * 4;
      } else {
        const mn = Math.min(...vals), mx = Math.max(...vals);
        const step = niceStep((mx - mn) * 1.3 / 4 || 1);
        lo = Math.max(0, Math.floor((mn - (mx - mn) * .1) / step) * step); hi = lo + step * 4;
        if (hi < mx) hi = lo + step * Math.ceil((mx - lo) / step);
      }
      c.strokeStyle = C.line; c.lineWidth = 1.5; c.font = '400 16px ' + MONO; c.fillStyle = C.muted; c.textAlign = 'right';
      for (let i = 0; i < 5; i++) {
        const gy = y1 - i * (y1 - y0) / 4;
        c.beginPath(); c.moveTo(x0, gy); c.lineTo(x1, gy); c.stroke();
        c.fillText(fmt(lo + i * (hi - lo) / 4, unit, s.lang), x0 - 12, gy + 5);
      }
      const yOf = (v) => y1 - (v - lo) / (hi - lo) * (y1 - y0);
      if (spec.kind === 'bars') {
        const n = vals.length, bw = (x1 - x0) / n, bww = Math.min(bw * .6, 150);
        c.textAlign = 'center';
        for (let i = 0; i < n; i++) {
          const h = (y1 - yOf(vals[i])) * e, bx = x0 + i * bw + (bw - bww) / 2;
          const g = c.createLinearGradient(0, y1 - h, 0, y1);
          g.addColorStop(0, i === n - 1 ? C['accent-2'] : C['accent-3']); g.addColorStop(1, C.accent);
          c.fillStyle = g; c.fillRect(bx, y1 - h, bww, h);
          c.fillStyle = C.muted; c.font = (n > 6 ? '400 16px ' : '500 20px ') + MONO;
          c.fillText(labels[i] ?? '', bx + bww / 2, y1 + 28);
          if (n <= 6) { c.fillStyle = C.fg; c.font = '700 26px ' + DISP; c.fillText(fmt(vals[i] * e, unit, s.lang), bx + bww / 2, y1 - h - 14); }
        }
      } else {
        const n = vals.length, k = e * (n - 1), px = [], py = [];
        for (let i = 0; i < n; i++) { px.push(x0 + i * (x1 - x0) / (n - 1)); py.push(yOf(vals[i])); }
        const full = Math.floor(k), fr = k - full;
        let lx = px[0], ly = py[0];
        c.beginPath(); c.moveTo(px[0], py[0]);
        for (let i = 1; i <= full; i++) { c.lineTo(px[i], py[i]); lx = px[i]; ly = py[i]; }
        if (full < n - 1) { lx = px[full] + (px[full + 1] - px[full]) * fr; ly = py[full] + (py[full + 1] - py[full]) * fr; c.lineTo(lx, ly); }
        c.strokeStyle = C['accent-2']; c.lineWidth = 4; c.lineJoin = 'round'; c.stroke();
        c.lineTo(lx, y1); c.lineTo(px[0], y1); c.closePath();
        const ga = c.createLinearGradient(0, y0, 0, y1); ga.addColorStop(0, C['accent-2']); ga.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalAlpha = .28; c.fillStyle = ga; c.fill(); c.globalAlpha = 1;
        c.fillStyle = C['accent-2']; c.beginPath(); c.arc(lx, ly, 9, 0, Math.PI * 2); c.fill();
        c.strokeStyle = C.panel; c.lineWidth = 3; c.stroke();
        c.fillStyle = C.muted; c.font = '400 16px ' + MONO; c.textAlign = 'center';
        const ticks = n <= 5 ? [...Array(n).keys()] : [0, Math.round((n - 1) / 3), Math.round(2 * (n - 1) / 3), n - 1];
        ticks.forEach((j) => c.fillText(labels[j] ?? '', px[j], y1 + 26));
      }
    } else if (spec.kind === 'donut') {
      const cx = 290, cy = 310, ro = 168, ri = 104, cols = [C.accent, C['accent-2'], C['accent-3'], C.muted];
      const total = vals.reduce((a, b) => a + b, 0) || 1;
      let a = -Math.PI / 2;
      vals.forEach((v, i) => {
        const sw = v / total * Math.PI * 2 * e;
        if (sw > 0.03) {
          c.fillStyle = cols[i % cols.length]; c.beginPath();
          c.arc(cx, cy, ro, a + .015, a + sw - .015); c.arc(cx, cy, ri, a + sw - .015, a + .015, true); c.closePath(); c.fill();
        }
        a += sw;
      });
      c.textAlign = 'center'; c.fillStyle = C.fg; c.font = '700 54px ' + DISP;
      c.fillText(Math.round(vals[0] / total * 100 * e) + '%', cx, cy + 10);
      c.fillStyle = C.muted; c.font = '400 20px ' + MONO; c.fillText(tr(spec.center, s.lang) || '', cx, cy + 44);
      c.textAlign = 'left';
      const gap = Math.min(76, 300 / vals.length);
      vals.forEach((v, i) => {
        const ly = 230 + i * gap;
        c.fillStyle = cols[i % cols.length]; c.fillRect(560, ly - 22, 28, 28);
        c.fillStyle = C.fg; c.font = '500 26px ' + BODY; c.fillText(labels[i] ?? '', 606, ly);
        c.fillStyle = C.muted; c.font = '400 20px ' + MONO; c.fillText(fmt(v, unit, s.lang), 606, ly + 28);
      });
    }
  }

  function animate() {
    cancelAnimationFrame(s.raf);
    if (s.paused) { s.prog = 1; draw(); s.onUpdate(); return; }
    const start = performance.now();
    const step = (now) => {
      s.prog = clamp((now - start) / 900, 0, 1);
      draw(); s.onUpdate();
      if (s.prog < 1) s.raf = requestAnimationFrame(step);
    };
    s.prog = 0; s.raf = requestAnimationFrame(step);
  }

  return {
    canvas,
    set onUpdate(fn) { s.onUpdate = fn; },
    setColors(colors) { s.colors = colors; draw(); s.onUpdate(); },
    setLang(lang, tag) { s.lang = lang; s.tag = tag; draw(); s.onUpdate(); },
    setPaused(p) { s.paused = p; if (p) { cancelAnimationFrame(s.raf); s.prog = 1; draw(); s.onUpdate(); } },
    show(spec) { s.spec = spec; animate(); },
    redraw() { draw(); s.onUpdate(); },
    // Alternativa em texto para leitores de tela.
    describe() {
      const spec = s.spec; if (!spec) return '';
      const labels = labelsOf(spec);
      const parts = spec.values.map((v, i) => `${labels[i] ?? i + 1}: ${fmt(v, spec.unit, s.lang)}`);
      return `${(tr(spec.label, s.lang) || '').toLowerCase()} (${tr(spec.source, s.lang) || s.tag}). ${parts.join('; ')}.`;
    },
  };
}

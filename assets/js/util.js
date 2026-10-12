// Funções pequenas usadas por vários módulos.
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
export function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* armazenamento indisponível */ } }

export const params = new URLSearchParams(location.search);
export const draftMode = params.get('draft') === '1';
export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

// Texto traduzível: {pt, en} ou string. Sem "en" usa "pt".
export function tr(v, lang) {
  if (v == null) return null;
  if (typeof v !== 'object' || Array.isArray(v)) return v;
  return v[lang] ?? v.pt ?? null;
}

// Item visível? Rascunhos só aparecem com ?draft=1.
export const isPublished = (item) => draftMode || !item.draft;

export async function fetchJson(path) {
  const r = await fetch(path, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}

// Lê cores dos tokens CSS (usadas pela cena e pelo canvas).
export function readTokens(keys) {
  const s = getComputedStyle(document.documentElement);
  const out = {};
  keys.forEach((k) => { out[k] = s.getPropertyValue('--' + k).trim(); });
  return out;
}

// Rótulo de data "2026-09" → "set 2026" / "Sep 2026".
export function fmtMonth(ym, lang) {
  if (!ym) return null;
  const [y, m] = ym.split('-').map(Number);
  if (!m) return String(y);
  return new Date(y, m - 1, 1).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
}
export function fmtDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
}

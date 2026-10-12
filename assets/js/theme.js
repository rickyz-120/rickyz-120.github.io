// Tema escuro (padrão, mesmo com sistema claro) ou claro. A escolha fica salva.
// O atributo data-theme é aplicado cedo por um script inline no <head> para evitar piscada.
import { lsGet, lsSet } from './util.js';

let theme = lsGet('rz-theme') === 'light' ? 'light' : 'dark';
const subs = new Set();

export const getTheme = () => theme;
export function onTheme(fn) { subs.add(fn); }

function apply() {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  const sun = document.getElementById('icoSun');
  const moon = document.getElementById('icoMoon');
  if (sun) sun.hidden = theme === 'light';
  if (moon) moon.hidden = theme !== 'light';
  const btn = document.getElementById('themeBtn');
  if (btn) btn.setAttribute('aria-pressed', String(theme === 'light'));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'light' ? '#eaf2ff' : '#040a18';
}

export function initTheme() {
  apply();
  const btn = document.getElementById('themeBtn');
  if (btn) btn.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    lsSet('rz-theme', theme);
    apply();
    subs.forEach((fn) => fn(theme));
  });
}

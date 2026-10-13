// Capturas de tela em 375, 768 e 1440 px, temas escuro e claro, PT e EN.
// Também acusa rolagem horizontal e erros de console.
// Uso: sirva o site (python -m http.server 8080) e rode: node tests/screenshots.mjs [url-base]
// Saída: tests/output/<largura>-<tema>-<idioma>-<seção>.png
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { launch } from './browser.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:8080/';
const OUT = new URL('./output/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const WIDTHS = (process.env.WIDTHS || '375,768,1440').split(',').map(Number);
const THEMES = (process.env.THEMES || 'dark,light').split(',');
const LANGS = (process.env.LANGS || 'pt,en').split(',');
const SECTIONS = ['inicio', 'sobre', 'projetos', 'habilidades', 'trajetoria', 'contato'];

const browser = await launch();
const issues = [];
for (const w of WIDTHS) for (const theme of THEMES) for (const lang of LANGS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 700 ? 812 : 900 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  await ctx.addInitScript(([th, lg]) => {
    localStorage.setItem('rz-theme', th); localStorage.setItem('rz-lang', lg); localStorage.setItem('rz-paused', '1');
  }, [theme, lang]);
  const page = await ctx.newPage();
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) issues.push(`${w}/${theme}/${lang} console ${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => issues.push(`${w}/${theme}/${lang} pageerror: ${e.message}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  for (const id of SECTIONS) {
    const el = page.locator('#' + id);
    if (!(await el.count()) || !(await el.isVisible())) continue;
    await page.evaluate((s) => document.getElementById(s).scrollIntoView({ block: 'start' }), id);
    await page.waitForTimeout(450);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) issues.push(`${w}/${theme}/${lang}/${id}: rolagem horizontal de ${overflow}px`);
    await page.screenshot({ path: fileURLToPath(new URL(`${w}-${theme}-${lang}-${id}.png`, OUT)) });
  }
  await ctx.close();
}
await browser.close();
console.log(issues.length ? issues.join('\n') : 'Capturas geradas sem problemas detectados.');
console.log('Pasta: tests/output/');

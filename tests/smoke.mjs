// Teste rápido: abre as páginas, lista erros/avisos do console e falhas de rede.
// Uso: sirva o site (python -m http.server 8080) e rode: node tests/smoke.mjs [url-base]
import { launch } from './browser.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:8080/';
const PAGES = ['', '?draft=1', '?lang=en', 'blog.html?draft=1', 'post.html?slug=exemplo&draft=1', 'blog.html', 'nao-existe.html'];

const browser = await launch();
let problems = 0;
for (const path of PAGES) {
  const page = await browser.newPage();
  const msgs = [];
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !(path.startsWith('nao-existe') && m.text().includes('404'))) msgs.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => msgs.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => msgs.push('requestfailed: ' + r.url()));
  page.on('response', (r) => { if (r.status() >= 400 && !path.startsWith('nao-existe')) msgs.push(`HTTP ${r.status()}: ${r.url()}`); });
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const mode = await page.evaluate(() => document.documentElement.classList.contains('no-webgl') ? 'fallback' : 'webgl?');
  console.log(`\n[${path || '/'}] título="${await page.title()}" cena=${mode}`);
  msgs.forEach((m) => console.log('  ' + m));
  problems += msgs.length;
  await page.close();
}
await browser.close();
console.log(problems ? `\n${problems} problema(s).` : '\nSem erros nem avisos.');
process.exit(problems ? 1 : 0);

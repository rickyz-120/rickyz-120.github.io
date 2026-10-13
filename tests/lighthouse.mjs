// Lighthouse (celular, modo simulado) usando o Chromium/Edge aberto pelo Playwright.
// Uso: sirva o site (python -m http.server 8080) e rode: node tests/lighthouse.mjs [url] [desktop]
import { writeFileSync, mkdirSync } from 'node:fs';
import lighthouse from 'lighthouse';
import { launch } from './browser.mjs';

const URL_ = process.argv[2] || 'http://127.0.0.1:8080/';
const desktop = process.argv[3] === 'desktop';
const PORT = 9333;
const browser = await launch({ args: [`--remote-debugging-port=${PORT}`] });
const r = await lighthouse(URL_, { port: PORT, output: 'json', logLevel: 'error' },
  desktop ? (await import('lighthouse/core/config/desktop-config.js')).default : undefined);
await browser.close();
mkdirSync(new URL('./output/', import.meta.url), { recursive: true });
writeFileSync(new URL(`./output/lh-${desktop ? 'desktop' : 'mobile'}.json`, import.meta.url), r.report);
const lhr = r.lhr;
for (const k in lhr.categories) console.log(`${lhr.categories[k].title}: ${Math.round(lhr.categories[k].score * 100)}`);
for (const a of Object.values(lhr.audits)) {
  if (a.score !== null && a.score < 0.9 && !['informative', 'notApplicable', 'manual'].includes(a.scoreDisplayMode)) console.log(`  - ${a.id} (${a.score}) ${a.displayValue || ''}`);
}

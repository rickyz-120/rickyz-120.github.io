// Gera assets/img/og-image.png (1200×630) a partir de scripts/og-template.html
// e os favicons em PNG (32 px e 180 px) a partir de assets/img/favicon.svg.
// Uso: sirva o site (python -m http.server 8080) e rode: node scripts/build-og.mjs [url-base]
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../tests/browser.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.argv[2] || 'http://127.0.0.1:8080/';
const browser = await launch();

const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(BASE + 'scripts/og-template.html', { waitUntil: 'networkidle' });
await page.waitForSelector('body[data-ready="1"]');
await page.screenshot({ path: join(root, 'assets/img/og-image.png') });
console.log('ok assets/img/og-image.png');

const svg = readFileSync(join(root, 'assets/img/favicon.svg'), 'utf8');
for (const [size, name] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png']]) {
  const p = await browser.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
  await p.screenshot({ path: join(root, 'assets/img', name), omitBackground: true });
  console.log('ok assets/img/' + name);
}
await browser.close();

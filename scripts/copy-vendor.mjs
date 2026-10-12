// Copia bibliotecas e fontes de node_modules para assets/ (versões fixas, sem CDN em produção).
// Uso: npm install && node scripts/copy-vendor.mjs
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = (p) => join(root, 'node_modules', p);
const out = (p) => join(root, 'assets', p);

const copies = [
  ['three/build/three.min.js', 'vendor/three.min.js'],
  ['marked/marked.min.js', 'vendor/marked.min.js'],
  ['dompurify/dist/purify.min.js', 'vendor/purify.min.js'],
  ['plotly.js-basic-dist-min/plotly-basic.min.js', 'vendor/plotly-basic.min.js'],
  ['@fontsource/unbounded/files/unbounded-latin-500-normal.woff2', 'fonts/unbounded-500.woff2'],
  ['@fontsource/unbounded/files/unbounded-latin-700-normal.woff2', 'fonts/unbounded-700.woff2'],
  ['@fontsource/manrope/files/manrope-latin-400-normal.woff2', 'fonts/manrope-400.woff2'],
  ['@fontsource/manrope/files/manrope-latin-500-normal.woff2', 'fonts/manrope-500.woff2'],
  ['@fontsource/manrope/files/manrope-latin-700-normal.woff2', 'fonts/manrope-700.woff2'],
  ['@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', 'fonts/jetbrains-mono-400.woff2'],
  ['@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2', 'fonts/jetbrains-mono-500.woff2'],
];

for (const [from, to] of copies) {
  mkdirSync(dirname(out(to)), { recursive: true });
  copyFileSync(nm(from), out(to));
  console.log('ok', to);
}

const v = (p) => JSON.parse(readFileSync(nm(p + '/package.json'), 'utf8')).version;
console.log('\nVersões: three', v('three'), '| marked', v('marked'), '| dompurify', v('dompurify'), '| plotly.js-basic', v('plotly.js-basic-dist-min'));

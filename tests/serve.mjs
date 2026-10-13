// Servidor estático local com gzip (parecido com o GitHub Pages), para testes e Lighthouse.
// Uso: node tests/serve.mjs [porta]   (padrão 8080)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2] || 8080);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.pdf': 'application/pdf' };

createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = normalize(join(root, p));
  let status = 200, body, type;
  try {
    if (!file.startsWith(root) || file.includes('node_modules')) throw new Error();
    if (!(await stat(file)).isFile()) throw new Error();
    body = await readFile(file); type = TYPES[extname(file)] || 'application/octet-stream';
  } catch {
    status = 404; body = await readFile(join(root, '404.html')); type = TYPES['.html'];
  }
  const headers = { 'Content-Type': type, 'Cache-Control': 'max-age=600' };
  if (/gzip/.test(req.headers['accept-encoding'] || '') && /text|javascript|json|svg|xml|markdown/.test(type)) {
    body = gzipSync(body); headers['Content-Encoding'] = 'gzip';
  }
  res.writeHead(status, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/`));

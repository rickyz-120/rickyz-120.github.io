// Gera sitemap.xml (páginas + posts publicados) e atualiza o JSON-LD "Person" do index.html
// a partir de data/site.json (nome, cargo e links em sameAs).
// Uso: node scripts/build-sitemap.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const site = JSON.parse(read('data/site.json'));
const posts = JSON.parse(read('data/posts.json')).filter((p) => !p.draft);
const base = site.url.replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: `${base}/`, lastmod: today, priority: '1.0' },
  { loc: `${base}/?lang=en`, lastmod: today, priority: '0.8' },
];
if (posts.length) {
  urls.push({ loc: `${base}/blog.html`, lastmod: posts.map((p) => p.date).sort().pop(), priority: '0.6' });
  posts.forEach((p) => urls.push({ loc: `${base}/post.html?slug=${encodeURIComponent(p.slug)}`, lastmod: p.date, priority: '0.5' }));
}
const xmlEsc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${xmlEsc(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(root, 'sitemap.xml'), xml);
console.log(`ok sitemap.xml (${urls.length} URLs)`);

// JSON-LD
const L = site.links || {};
const person = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.fullName,
  alternateName: site.name,
  url: base,
  jobTitle: site.role.pt,
  sameAs: [L.github, L.linkedin, L.kaggle].filter(Boolean),
};
if (L.email) person.email = 'mailto:' + L.email;
const html = read('index.html');
const re = /(<!-- jsonld:start[^>]*-->\r?\n)[\s\S]*?(<!-- jsonld:end -->)/;
if (!re.test(html)) { console.error('Marcadores jsonld:start/jsonld:end não encontrados no index.html'); process.exit(1); }
writeFileSync(join(root, 'index.html'), html.replace(re, `$1<script type="application/ld+json">\n${JSON.stringify(person, null, 2)}\n</script>\n$2`));
console.log('ok JSON-LD do index.html');

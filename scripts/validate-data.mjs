// Valida os arquivos de data/ contra os esquemas de data/schema/ e faz checagens extras.
// Uso: node scripts/validate-data.mjs   (sai com código 1 se houver erro)
// Sem dependências: implementa o subconjunto de JSON Schema usado aqui
// (type, enum, pattern, minLength, minimum, minItems, properties, required, additionalProperties, items, anyOf, $ref).
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const errors = [], warnings = [];

const schemas = {};
const loadSchema = (name) => (schemas[name] ||= read('data/schema/' + name));

function resolve(ref, base) {
  const [file, ptr] = ref.split('#');
  const doc = file ? loadSchema(file) : base;
  const node = ptr.split('/').filter(Boolean).reduce((o, k) => o[k], doc);
  return { node, base: doc };
}

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
const typeOk = (v, t) => { const a = typeOf(v); return a === t || (t === 'number' && a === 'integer'); };

function check(v, s, base, path, out) {
  if (s.$ref) { const r = resolve(s.$ref, base); return check(v, r.node, r.base, path, out); }
  if (s.anyOf) {
    const ok = s.anyOf.some((sub) => { const tmp = []; check(v, sub, base, path, tmp); return !tmp.length; });
    if (!ok) out.push(`${path}: valor não corresponde a nenhum formato aceito`);
    return;
  }
  if (s.enum && !s.enum.includes(v)) { out.push(`${path}: deve ser um destes valores: ${s.enum.map((x) => JSON.stringify(x)).join(', ')} (recebido ${JSON.stringify(v)})`); return; }
  if (s.type) {
    const types = [].concat(s.type);
    if (!types.some((t) => typeOk(v, t))) { out.push(`${path}: tipo esperado ${types.join(' ou ')}, recebido ${typeOf(v)}`); return; }
  }
  if (typeof v === 'string') {
    if (s.minLength && v.length < s.minLength) out.push(`${path}: texto vazio`);
    if (s.pattern && !new RegExp(s.pattern).test(v)) out.push(`${path}: formato inválido ("${v}")`);
  }
  if (typeof v === 'number' && s.minimum !== undefined && v < s.minimum) out.push(`${path}: deve ser no mínimo ${s.minimum}`);
  if (Array.isArray(v)) {
    if (s.minItems && v.length < s.minItems) out.push(`${path}: precisa de pelo menos ${s.minItems} item(ns)`);
    if (s.items) v.forEach((x, i) => check(x, s.items, base, `${path}[${i}]`, out));
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    (s.required || []).forEach((k) => { if (!(k in v)) out.push(`${path}: campo obrigatório "${k}" ausente`); });
    const props = s.properties || {};
    Object.keys(v).forEach((k) => {
      if (props[k]) check(v[k], props[k], base, `${path}.${k}`, out);
      else if (s.additionalProperties === false) out.push(`${path}: campo desconhecido "${k}" (erro de digitação?)`);
    });
  }
}

// Avisa textos traduzíveis com "pt" preenchido e "en" ausente.
function i18nWarnings(v, path) {
  if (Array.isArray(v)) return v.forEach((x, i) => i18nWarnings(x, `${path}[${i}]`));
  if (!v || typeof v !== 'object') return;
  if ('pt' in v) {
    const has = (x) => x !== null && x !== undefined && !(Array.isArray(x) && !x.length);
    if (has(v.pt) && !has(v.en)) warnings.push(`${path}: sem tradução em inglês (o site vai usar o texto em português)`);
    return;
  }
  Object.entries(v).forEach(([k, x]) => i18nWarnings(x, `${path}.${k}`));
}

const FILES = [
  ['site.json', 'site.schema.json'], ['projects.json', 'projects.schema.json'], ['skills.json', 'skills.schema.json'],
  ['experience.json', 'timeline.schema.json'], ['education.json', 'timeline.schema.json'],
  ['certifications.json', 'certifications.schema.json'], ['testimonials.json', 'testimonials.schema.json'],
  ['posts.json', 'posts.schema.json'], ['screen-demo.json', 'screen-demo.schema.json'],
];
const data = {};
for (const [file, schema] of FILES) {
  let v;
  try { v = read('data/' + file); } catch (e) { errors.push(`data/${file}: JSON inválido. ${e.message}`); continue; }
  data[file] = v;
  const out = [];
  check(v, loadSchema(schema), loadSchema(schema), file.replace('.json', ''), out);
  out.forEach((m) => errors.push(`data/${file} → ${m}`));
  i18nWarnings(v, file.replace('.json', ''));
}

/* ---------- checagens extras ---------- */
const fileExists = (p) => existsSync(join(root, p));
const local = (u) => u && !/^(https?:|mailto:)/.test(u);

for (const f of ['projects.json', 'skills.json', 'experience.json', 'education.json', 'certifications.json', 'testimonials.json']) {
  const ids = (data[f] || []).map((x) => x.id), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) errors.push(`data/${f}: id repetido: ${[...new Set(dup)].join(', ')}`);
}
const slugs = (data['posts.json'] || []).map((p) => p.slug);
if (new Set(slugs).size !== slugs.length) errors.push('data/posts.json: slug repetido');

const site = data['site.json'];
if (site) {
  if (site.photo && !fileExists(site.photo)) errors.push(`data/site.json → photo: arquivo ${site.photo} não existe`);
  if (site.cv?.available && !fileExists(site.cv.file)) errors.push(`data/site.json → cv: "available" é true, mas ${site.cv.file} não existe`);
  if (site.analytics?.provider && !site.analytics.siteId) errors.push('data/site.json → analytics: provider preenchido sem siteId');
  if (site.showDraftBadges) warnings.push('site.json: showDraftBadges = true (selos "exemplo" visíveis). Desligue quando revisar os textos.');
}
(data['projects.json'] || []).forEach((p, i) => {
  if (p.image && !fileExists(p.image)) errors.push(`projects[${i}].image: ${p.image} não existe`);
  if (local(p.demo?.url) && !fileExists(p.demo.url)) errors.push(`projects[${i}].demo.url: ${p.demo.url} não existe`);
  if (p.demo && p.demo.type !== 'none' && !p.demo.url) errors.push(`projects[${i}].demo: tipo "${p.demo.type}" precisa de url`);
  const sc = p.screen;
  if (sc) {
    const labels = Array.isArray(sc.labels) ? { pt: sc.labels } : sc.labels;
    Object.entries(labels).forEach(([lg, arr]) => { if (arr.length !== sc.values.length) errors.push(`projects[${i}].screen.labels.${lg}: ${arr.length} rótulos para ${sc.values.length} valores`); });
  }
});
(data['testimonials.json'] || []).forEach((q, i) => { if (local(q.photo) && !fileExists(q.photo)) errors.push(`testimonials[${i}].photo: ${q.photo} não existe`); });
(data['posts.json'] || []).forEach((p, i) => {
  Object.entries(p.file || {}).forEach(([lg, f]) => { if (f && !fileExists(f)) errors.push(`posts[${i}].file.${lg}: ${f} não existe`); });
});

const drafts = Object.entries(data).flatMap(([f, v]) => (Array.isArray(v) ? v.filter((x) => x.draft).map(() => f) : []));
if (drafts.length) warnings.push(`${drafts.length} item(ns) ainda marcados como rascunho (draft): ${[...new Set(drafts)].join(', ')}`);

/* ---------- saída ---------- */
if (warnings.length) { console.log(`Avisos (${warnings.length}):`); warnings.forEach((w) => console.log('  ! ' + w)); }
if (errors.length) {
  console.error(`\nErros (${errors.length}):`);
  errors.forEach((e) => console.error('  ✗ ' + e));
  console.error('\nCorrija os erros acima e rode de novo.');
  process.exit(1);
}
console.log(`\n✓ Dados válidos (${FILES.length} arquivos).`);

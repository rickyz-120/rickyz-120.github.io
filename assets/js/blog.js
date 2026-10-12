// Blog: cards na página inicial, lista em blog.html (com filtro por tag) e leitura em post.html.
// Markdown renderizado com marked e sanitizado com DOMPurify (carregados só em post.html).
import { $, esc, tr, fetchJson, isPublished, fmtDate, draftMode, params } from './util.js';
import { t, getLang, onLang, applyStatic, bindLangButton } from './i18n.js';
import { initTheme } from './theme.js';
import { initAnalytics } from './analytics.js';

export function parseFrontmatter(src) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  m[1].split(/\r?\n/).forEach((line) => {
    const i = line.indexOf(':');
    if (i < 0) return;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    meta[k] = v;
  });
  return { meta, body: src.slice(m[0].length) };
}

export const readingMinutes = (text) => Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 200));
const withDraft = (href) => (draftMode ? href + (href.includes('?') ? '&' : '?') + 'draft=1' : href);
export const postHref = (slug) => withDraft('post.html?slug=' + encodeURIComponent(slug));
const sortPosts = (posts) => posts.filter(isPublished).sort((a, b) => b.date.localeCompare(a.date));

function postCard(p, lang, badges, minutes) {
  return `<article class="card post-card">` +
    `<p class="post-meta"><time datetime="${esc(p.date)}">${esc(fmtDate(p.date, lang))}</time>${minutes ? ' · ' + esc(t('read_min', { n: minutes })) : ''}</p>` +
    `<h3><a href="${esc(postHref(p.slug))}">${esc(tr(p.title, lang))}</a>${p.draft && badges ? `<span class="badge">${esc(t('example'))}</span>` : ''}</h3>` +
    `<p>${esc(tr(p.summary, lang) || '')}</p>` +
    (p.tags?.length ? `<ul class="chips">${p.tags.map((x) => `<li class="chip">${esc(x)}</li>`).join('')}</ul>` : '') +
    `</article>`;
}

// Seção "Blog" da página inicial: 3 posts mais recentes.
export function createBlogSection({ posts, site }) {
  const list = sortPosts(posts).slice(0, 3);
  $('#blogAll').href = withDraft('blog.html');
  return {
    count: list.length,
    render() { const lang = getLang(); $('#blogGrid').innerHTML = list.map((p) => postCard(p, lang, site.showDraftBadges)).join(''); },
  };
}

/* ---------- páginas do blog ---------- */
function chrome(site) {
  initTheme();
  bindLangButton();
  applyStatic();
  initAnalytics(site.analytics);
  document.querySelectorAll('a[data-keep-draft]').forEach((a) => { a.href = withDraft(a.getAttribute('href')); });
}

function setMeta(title, desc) {
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
}

export async function initBlogList() {
  const [site, posts] = await Promise.all([fetchJson('data/site.json'), fetchJson('data/posts.json')]);
  chrome(site);
  const list = sortPosts(posts);
  const minutes = {};
  // tempo de leitura: lê o Markdown de cada post (são poucos)
  await Promise.all(list.map(async (p) => {
    try {
      const f = p.file[getLang()] || p.file.pt;
      const r = await fetch(f); if (r.ok) minutes[p.slug] = readingMinutes(parseFrontmatter(await r.text()).body);
    } catch (e) { /* sem tempo de leitura */ }
  }));
  const tags = [...new Set(list.flatMap((p) => p.tags || []))].sort();
  let tag = params.get('tag') || 'all';

  function render() {
    const lang = getLang();
    setMeta(`Blog · ${site.name}`, t('blog_lead'));
    const box = $('#tagFilters');
    box.innerHTML = '';
    if (tags.length > 1) ['all', ...tags].forEach((x) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = x === 'all' ? t('all_tags') : '#' + x;
      b.setAttribute('aria-pressed', String(tag === x));
      b.addEventListener('click', () => { tag = x; render(); });
      box.appendChild(b);
    });
    const shown = list.filter((p) => tag === 'all' || (p.tags || []).includes(tag));
    $('#postList').innerHTML = shown.length
      ? shown.map((p) => postCard(p, lang, site.showDraftBadges, minutes[p.slug])).join('')
      : `<p class="error-box">${esc(t('no_posts'))}</p>`;
  }
  onLang(render);
  render();
}

export async function initPost() {
  const [site, posts] = await Promise.all([fetchJson('data/site.json'), fetchJson('data/posts.json')]);
  chrome(site);
  const slug = params.get('slug');
  const post = posts.find((p) => p.slug === slug && isPublished(p));
  const box = $('#article');
  if (!post) {
    box.innerHTML = `<p class="error-box">${esc(t('post_missing'))}</p>`;
    setMeta(`${t('post_missing')} · ${site.name}`, t('post_missing'));
    onLang(() => { box.innerHTML = `<p class="error-box">${esc(t('post_missing'))}</p>`; });
    return;
  }
  const cache = {};
  async function load(lang) {
    const file = post.file[lang] || post.file.pt;
    cache[file] ||= fetch(file).then((r) => { if (!r.ok) throw new Error(file); return r.text(); });
    return { text: await cache[file], fallback: !post.file[lang] };
  }
  async function render() {
    const lang = getLang();
    try {
      const { text, fallback } = await load(lang);
      const { body } = parseFrontmatter(text);
      const html = window.DOMPurify.sanitize(window.marked.parse(body));
      const title = tr(post.title, lang), summary = tr(post.summary, lang) || '';
      setMeta(`${title} · ${site.name}`, summary);
      box.innerHTML = `<h1>${esc(title)}</h1>` +
        `<p class="post-meta"><time datetime="${esc(post.date)}">${esc(fmtDate(post.date, lang))}</time> · ${esc(t('read_min', { n: readingMinutes(body) }))}` +
        `${post.draft && site.showDraftBadges ? `<span class="badge">${esc(t('example'))}</span>` : ''}</p>` +
        (fallback ? `<p class="note">${esc(t('post_lang_fallback'))}</p>` : '') +
        `<div class="prose" ${fallback ? 'lang="pt-BR"' : ''}>${html}</div>`;
      box.querySelectorAll('.prose img').forEach((img) => { img.loading = 'lazy'; if (!img.hasAttribute('alt')) img.alt = ''; });
      box.querySelectorAll('.prose a[href^="http"]').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
    } catch (e) {
      box.innerHTML = `<p class="error-box">${esc(t('post_missing'))}</p>`;
    }
  }
  onLang(render);
  await render();
}

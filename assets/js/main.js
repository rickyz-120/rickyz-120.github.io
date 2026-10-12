// Página inicial: carrega os JSON, monta as seções e liga a cena 3D, o menu, tema, idioma e pausa.
import { $, $$, esc, tr, clamp, lsGet, lsSet, fetchJson, isPublished, draftMode, prefersReducedMotion } from './util.js';
import { t, getLang, onLang, applyStatic, bindLangButton } from './i18n.js';
import { initTheme, onTheme } from './theme.js';
import { createScreen } from './screen.js';
import { createScene } from './scene.js';
import { createProjects } from './projects.js';
import { createTimeline } from './timeline.js';
import { createBlogSection } from './blog.js';
import { createReveal } from './reveal.js';
import { initAnalytics } from './analytics.js';

const root = document.documentElement;
const FILES = ['site', 'skills', 'projects', 'experience', 'education', 'certifications', 'testimonials', 'posts', 'screen-demo'];
const ICONS = {
  github: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.3 2.8 1a9.6 9.6 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .4 1 .4 1.9.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.8v1.6h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-4.9c0-1.17-.02-2.68-1.63-2.68-1.64 0-1.89 1.28-1.89 2.6V21h-4V9.75Z"/></svg>',
  kaggle: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M6 2h3v12.2l6.1-6.2H19l-6.4 6.4L19.4 22h-3.9l-4.9-6.2L9 17.4V22H6V2Z"/></svg>',
  email: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>',
};

/* ---------- pausa ---------- */
const savedPause = lsGet('rz-paused');
let paused = savedPause === null ? prefersReducedMotion() : savedPause === '1';

async function boot() {
  initTheme();
  bindLangButton();
  applyStatic();
  $('#year').textContent = String(new Date().getFullYear());

  let D;
  try {
    const all = await Promise.all(FILES.map((f) => fetchJson(`data/${f}.json`)));
    D = Object.fromEntries(FILES.map((f, i) => [f, all[i]]));
  } catch (e) {
    console.warn(e);
    const p = document.createElement('p');
    p.className = 'wrap error-box'; p.setAttribute('role', 'alert'); p.textContent = t('load_error');
    $('#inicio').after(p);
    return;
  }
  const site = D.site;
  const reveal = createReveal(() => paused);

  /* ---------- cena 3D e tela ---------- */
  const screen = createScreen();
  const scene = createScene({ canvas: $('#scene'), screen });
  screen.setLang(getLang(), tr(D['screen-demo'].tag, getLang()));
  const demoCharts = D['screen-demo'].charts;
  function showProject(p, idx) {
    const spec = p?.screen || demoCharts[Math.max(0, idx) % demoCharts.length];
    screen.show(spec);
    $('#screenAlt').setAttribute('aria-label', t('screen_alt', { desc: screen.describe() }));
  }

  /* ---------- seções ---------- */
  const projects = createProjects({ data: D.projects, site, onSelect: showProject });
  const timeline = createTimeline({ experience: D.experience, education: D.education, site, reveal });
  const blog = createBlogSection({ posts: D.posts, site });
  const certs = D.certifications.filter(isPublished);
  const quotes = D.testimonials.filter(isPublished);

  const badge = (item) => (item?.draft && site.showDraftBadges ? `<span class="badge">${esc(t('example'))}</span>` : '');

  function renderHero(lang) {
    $('#eyebrow').textContent = `${site.fullName} · ${tr(site.role, lang)}`;
    $('#heroName').textContent = site.name;
    $('#heroName').dataset.text = site.name;
    $('#tagline').innerHTML = esc(tr(site.tagline, lang)) + badge(site.tagline);
    const cvOn = site.cv?.available;
    ['#cvHero', '#cvTop'].forEach((sel) => {
      const old = $(sel); if (!old) return;
      const cls = sel === '#cvTop' ? 'pill cv' : 'btn ghost';
      const el = document.createElement(cvOn ? 'a' : 'span');
      el.id = old.id;
      if (cvOn) {
        el.className = cls; el.href = site.cv.file; el.setAttribute('download', ''); el.textContent = t('cv');
      } else {
        el.className = cls + ' is-disabled'; el.setAttribute('aria-disabled', 'true'); el.title = t('cv_soon');
        el.innerHTML = `<span>${esc(t('cv'))}</span>&nbsp;<small>${esc(t('soon'))}</small>`;
      }
      old.replaceWith(el);
    });
  }

  function renderAbout(lang) {
    const paras = tr(site.about?.paragraphs, lang) || [];
    $('#aboutText').innerHTML = paras.map((p, i) => `<p>${esc(p)}${i === 0 ? badge(site.about) : ''}</p>`).join('');
    const img = $('#aboutPhoto');
    if (site.photo) { img.src = site.photo; img.alt = t('photo_alt'); img.hidden = false; }
  }

  function renderSkills(lang) {
    $('#skillGroups').innerHTML = D.skills.map((g) =>
      `<div class="card"><h3>${esc(tr(g.label, lang))}</h3><ul class="chips">` +
      g.items.map((x) => `<li class="chip">${esc(x)}</li>`).join('') +
      (g.draft && site.showDraftBadges ? `<li class="chip dashed">${esc(t('skills_more'))}</li>` : '') +
      `</ul></div>`).join('');
  }

  function renderCerts() {
    $('#certGrid').innerHTML = certs.map((c) =>
      `<article class="card cert"><h3>${esc(c.title)}${badge(c)}</h3><p>${esc(c.issuer)}${c.year ? ' · ' + esc(c.year) : ''}</p>` +
      (c.url ? `<a class="btn ghost small" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(t('credential'))} <span aria-hidden="true">↗</span><span class="sr-only"> ${esc(t('new_tab'))}</span></a>` : '') +
      `</article>`).join('');
  }

  function renderQuotes(lang) {
    $('#testGrid').innerHTML = quotes.map((q) => {
      const who = q.url ? `<a href="${esc(q.url)}" target="_blank" rel="noopener">${esc(q.name)}</a>` : esc(q.name);
      return `<figure class="card quote"><blockquote>${esc(tr(q.quote, lang))}</blockquote><figcaption>` +
        (q.photo ? `<img src="${esc(q.photo)}" alt="" width="44" height="44" loading="lazy">` : '') +
        `<div><strong>${who}</strong>${badge(q)}<span>${esc([q.role, q.org].filter(Boolean).join(' · '))}</span></div></figcaption></figure>`;
    }).join('');
  }

  function renderContact() {
    const L = site.links || {};
    const btn = (k, label) => L[k] ? `<a class="btn ghost" href="${esc(k === 'email' ? 'mailto:' + L[k] : L[k])}"${k === 'email' ? '' : ' target="_blank" rel="noopener"'}>${ICONS[k]} ${esc(label)}</a>` : '';
    $('#contactLinks').innerHTML = btn('github', 'GitHub') + btn('linkedin', 'LinkedIn') + btn('kaggle', 'Kaggle') + btn('email', 'E-mail');
    const row = $('#mailRow');
    row.hidden = !L.email;
    if (L.email) {
      row.innerHTML = `<span class="mail-text" id="mailText">${esc(L.email)}</span><button type="button" class="btn ghost small" id="copyBtn">${esc(t('copy'))}</button><span class="sr-only" id="copyStatus" aria-live="polite"></span>`;
      $('#copyBtn').addEventListener('click', async () => {
        let ok = false;
        try { await navigator.clipboard.writeText(L.email); ok = true; } catch (e) { /* sem clipboard */ }
        $('#copyBtn').textContent = ok ? t('copied') : t('copy');
        $('#copyStatus').textContent = ok ? t('copied') : t('copy_fail');
        setTimeout(() => { const b = $('#copyBtn'); if (b) b.textContent = t('copy'); }, 2000);
      });
    }
    const note = $('#draftNote');
    const msgs = [];
    if (draftMode) msgs.push(t('draft_mode'));
    if (site.showDraftBadges) msgs.push(t('draft_note'));
    note.hidden = !msgs.length; note.textContent = msgs.join(' ');
  }

  // Seções sem itens publicados ficam escondidas (e somem do menu). ?draft=1 mostra tudo.
  const sectionCounts = { projetos: projects.count, trajetoria: timeline.count, certificacoes: certs.length, depoimentos: quotes.length, blog: blog.count };
  Object.entries(sectionCounts).forEach(([id, n]) => {
    const el = document.getElementById(id);
    el.hidden = n === 0;
    const link = $(`#navLinks a[data-go="${id}"]`);
    if (link) link.hidden = n === 0;
  });
  if (!projects.count) $$('[data-go="projetos"]').forEach((a) => { if (!a.closest('#navLinks')) a.hidden = true; });

  function renderAll() {
    const lang = getLang();
    document.title = tr(site.seo.title, lang);
    $('meta[name="description"]').setAttribute('content', tr(site.seo.description, lang));
    renderHero(lang); renderAbout(lang); renderSkills(lang); renderCerts(); renderQuotes(lang); renderContact();
    projects.render(); timeline.render(); blog.render();
    buildSheet();
  }

  /* ---------- menu: links, folha no celular, scroll spy ---------- */
  const sheet = $('#sheet'), menuBtn = $('#menuBtn');
  function buildSheet() {
    const links = $$('#navLinks a').filter((a) => !a.hidden);
    $('#sheetList').innerHTML = links.map((a) => `<li><a href="${a.getAttribute('href')}" data-go="${a.dataset.go}">${esc(a.textContent)}</a></li>`).join('');
  }
  function setSheet(open) {
    sheet.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', t(open ? 'menu_close' : 'menu_open'));
    if (open) sheet.querySelector('a')?.focus();
  }
  menuBtn.addEventListener('click', () => setSheet(sheet.hidden));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) { setSheet(false); menuBtn.focus(); } });
  document.addEventListener('click', (e) => { if (!sheet.hidden && !sheet.contains(e.target) && !menuBtn.contains(e.target)) setSheet(false); });

  function go(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: paused || prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + id);
    // move o foco para a seção (acessibilidade), sem rolar de novo
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[data-go]');
    if (!a) return;
    e.preventDefault();
    setSheet(false);
    go(a.dataset.go);
  });

  /* ---------- rolagem: pose da cena, esmaecer, scroll spy, linha do tempo ---------- */
  const spyIds = ['inicio', 'sobre', 'projetos', 'habilidades', 'trajetoria', 'certificacoes', 'depoimentos', 'blog', 'contato'];
  let ticking = false;
  function onScroll() {
    ticking = false;
    const ih = window.innerHeight;
    const rp = $('#projetos').getBoundingClientRect(), rs = $('#habilidades').getBoundingClientRect(), ra = $('#sobre').getBoundingClientRect();
    const sp = projects.count ? clamp((ih * .9 - rp.top) / (ih * .9), 0, 1) : 0;
    const fp = clamp((ih * .9 - rs.top) / (ih * .5), 0, 1);
    const ap = clamp(1.4 - Math.abs(ra.top + ra.height / 2 - ih / 2) / (ih * .4), 0, 1);
    scene.setScroll(sp, 1 - .85 * Math.max(fp, ap));
    let cur = 'inicio';
    spyIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.hidden && el.getBoundingClientRect().top <= ih * .4) cur = id;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = 'contato';
    $$('#navLinks a, #sheetList a').forEach((a) => {
      const on = a.dataset.go === cur;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    timeline.onScroll(paused);
  }
  const requestScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll);

  /* ---------- pausa, tema, idioma ---------- */
  function setPauseUi() {
    const b = $('#pauseBtn');
    b.setAttribute('aria-pressed', String(paused));
    b.setAttribute('aria-label', paused ? t('play') : t('pause'));
    $('#icoPause').hidden = paused; $('#icoPlay').hidden = !paused;
    root.classList.toggle('paused', paused);
  }
  $('#pauseBtn').addEventListener('click', () => {
    paused = !paused; lsSet('rz-paused', paused ? '1' : '0');
    setPauseUi(); scene.setPaused(paused);
    if (paused) reveal.revealAll();
    onScroll();
  });
  onTheme(() => scene.applyColors());
  onLang((lang) => {
    screen.setLang(lang, tr(D['screen-demo'].tag, lang));
    renderAll(); setPauseUi(); onScroll();
  });

  renderAll();
  setPauseUi();
  scene.setPaused(paused);
  onScroll();
  reveal.observe($$('.section .card:not(.about-card), .section h2'));
  if (document.fonts?.ready) document.fonts.ready.then(() => screen.redraw());
  initAnalytics(site.analytics);

  // Rolagem até a âncora depois de montar as seções (links compartilhados com #projetos etc.)
  const hash = location.hash.slice(1);
  if (hash && hash !== 'formacao' && document.getElementById(hash)) requestAnimationFrame(() => document.getElementById(hash).scrollIntoView());

  /* ---------- Three.js: carregado depois da primeira pintura para não travar o início ---------- */
  const loadThree = () => {
    const s = document.createElement('script');
    s.src = 'assets/vendor/three.min.js';
    s.onload = () => scene.start();
    s.onerror = () => scene.fallback();
    document.head.appendChild(s);
  };
  if (document.readyState === 'complete') loadThree();
  else window.addEventListener('load', loadThree, { once: true });
}

boot();

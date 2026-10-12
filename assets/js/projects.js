// Painel de projetos: lista com filtro por tecnologia, busca, item expansível e navegação por teclado.
import { $, $$, esc, tr, fmtMonth } from './util.js';
import { t, getLang } from './i18n.js';

let plotlyPromise = null;
function loadPlotly() {
  plotlyPromise ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'assets/vendor/plotly-basic.min.js';
    s.onload = () => res(window.Plotly); s.onerror = () => { plotlyPromise = null; rej(new Error('plotly')); };
    document.head.appendChild(s);
  });
  return plotlyPromise;
}

export function createProjects({ data, site, onSelect }) {
  const listEl = $('#projList'), searchEl = $('#search'), filtersEl = $('#filters'), countEl = $('#projCount');
  const projects = data.filter((p) => p.status === 'published');
  const badges = site.showDraftBadges;
  let filter = 'all', selected = projects[0]?.id ?? null;

  // Tecnologias dos projetos visíveis, das mais frequentes para as menos.
  const freq = new Map();
  projects.forEach((p) => p.tech.forEach((x) => freq.set(x, (freq.get(x) || 0) + 1)));
  const techs = [...freq.keys()].sort((a, b) => freq.get(b) - freq.get(a) || a.localeCompare(b));

  function buildFilters() {
    filtersEl.innerHTML = '';
    ['all', ...techs].forEach((f) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip';
      b.textContent = f === 'all' ? t('filter_all') : f;
      b.setAttribute('aria-pressed', String(filter === f));
      b.addEventListener('click', () => { filter = f; buildFilters(); render(); });
      filtersEl.appendChild(b);
    });
  }

  const field = (v) => v ? esc(v) : `<span class="soon">${esc(t('soon_text'))}</span>`;
  const ext = (href, label, cls = 'btn ghost small') =>
    `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)} <span aria-hidden="true">↗</span><span class="sr-only"> ${esc(t('new_tab'))}</span></a>`;

  function demoBlock(p) {
    const d = p.demo || {};
    if (!d.url || d.type === 'none') return { btn: '', block: '' };
    if (d.type === 'link') return { btn: ext(d.url, t('demo')), block: '' };
    if (d.type === 'iframe') return {
      btn: ext(d.url, t('demo')),
      block: `<details class="embed"><summary>${esc(t('demo_embed'))}</summary><iframe data-src="${esc(d.url)}" title="${esc(tr(p.title, getLang()))}: demo" loading="lazy" allowfullscreen referrerpolicy="no-referrer"></iframe></details>`,
    };
    if (d.type === 'image') return {
      btn: '',
      block: `<details class="embed"><summary>${esc(t('demo_image'))}</summary><img src="${esc(d.url)}" alt="${esc(tr(d.alt, getLang()) || tr(p.title, getLang()))}" loading="lazy"></details>`,
    };
    return { btn: '', block: '' };
  }

  function itemHtml(p) {
    const lang = getLang(), on = p.id === selected, bodyId = 'pb-' + p.id;
    const demo = demoBlock(p);
    const plot = p.plot ? `<details class="embed plot-wrap"><summary>${esc(t('plot'))}</summary><div class="plot" data-plot="${esc(p.id)}"></div></details>` : '';
    const date = fmtMonth(p.date, lang);
    return `<button type="button" class="item-head" aria-expanded="${on}" aria-controls="${bodyId}">` +
      `<span class="item-title">${esc(tr(p.title, lang))}${p.draft && badges ? `<span class="badge">${esc(t('example'))}</span>` : ''}</span>` +
      `<span class="item-tags">${esc((tr(p.tags, lang) || []).join(' • '))}</span></button>` +
      `<div class="item-body" id="${bodyId}"${on ? '' : ' hidden'}>` +
      (date ? `<p class="item-meta">${esc(date)}</p>` : '') +
      `<dl><div><dt>${esc(t('problem'))}</dt><dd>${field(tr(p.problem, lang))}</dd></div>` +
      `<div><dt>${esc(t('solution'))}</dt><dd>${field(tr(p.solution, lang))}</dd></div>` +
      `<div><dt>${esc(t('result'))}</dt><dd>${field(tr(p.result, lang))}</dd></div></dl>` +
      `<ul class="chips" aria-label="${esc(t('tech'))}">${p.tech.map((x) => `<li class="chip">${esc(x)}</li>`).join('')}</ul>` +
      `<div class="item-actions">${ext(p.repo, t('repo'), 'btn primary small')}${demo.btn}</div>${demo.block}${plot}</div>`;
  }

  function visible() {
    const q = searchEl.value.trim().toLowerCase(), lang = getLang();
    return projects.filter((p) => {
      const hay = [tr(p.title, lang), ...(tr(p.tags, lang) || []), ...p.tech, tr(p.problem, lang), tr(p.solution, lang)].join(' ').toLowerCase();
      return (filter === 'all' || p.tech.includes(filter)) && (!q || hay.includes(q));
    });
  }

  function select(id, focus) {
    selected = id;
    $$('.item', listEl).forEach((it) => {
      const on = it.dataset.id === id;
      it.classList.toggle('sel', on);
      it.querySelector('.item-head').setAttribute('aria-expanded', String(on));
      it.querySelector('.item-body').hidden = !on;
      if (on && focus) it.querySelector('.item-head').focus();
    });
    const idx = projects.findIndex((p) => p.id === id);
    onSelect(projects[idx], idx);
  }

  function render() {
    const items = visible();
    listEl.innerHTML = '';
    countEl.textContent = items.length === 1 ? t('count_one') : t('count_many', { n: items.length });
    if (!items.length) {
      listEl.innerHTML = `<p class="empty">${esc(t('empty'))}</p>`;
      return;
    }
    if (!items.some((p) => p.id === selected)) selected = items[0].id;
    items.forEach((p) => {
      const it = document.createElement('article');
      it.className = 'item' + (p.id === selected ? ' sel' : '');
      it.dataset.id = p.id;
      it.innerHTML = itemHtml(p);
      it.querySelector('.item-head').addEventListener('click', () => select(p.id));
      listEl.appendChild(it);
    });
    select(selected);
  }

  // Teclado: setas sobem e descem; Home/End vão para as pontas. Enter/Espaço expandem (botão nativo).
  listEl.addEventListener('keydown', (e) => {
    if (!e.target.classList.contains('item-head')) return;
    const heads = $$('.item-head', listEl), i = heads.indexOf(e.target);
    let j = null;
    if (e.key === 'ArrowDown') j = Math.min(heads.length - 1, i + 1);
    else if (e.key === 'ArrowUp') j = Math.max(0, i - 1);
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = heads.length - 1;
    if (j === null) return;
    e.preventDefault();
    heads[j].focus();
  });

  // Carrega iframe e gráfico interativo só quando o bloco é aberto.
  listEl.addEventListener('toggle', (e) => {
    const d = e.target;
    if (!d.open) return;
    const fr = d.querySelector('iframe[data-src]');
    if (fr) { fr.src = fr.dataset.src; fr.removeAttribute('data-src'); }
    const pl = d.querySelector('.plot[data-plot]');
    if (pl && !pl.dataset.done) {
      pl.dataset.done = '1';
      const p = projects.find((x) => x.id === pl.dataset.plot);
      pl.textContent = t('plot_loading');
      loadPlotly().then((Plotly) => {
        pl.textContent = '';
        const cs = getComputedStyle(document.documentElement);
        const fg = cs.getPropertyValue('--fg').trim(), line = cs.getPropertyValue('--line').trim();
        const layout = Object.assign({ paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: fg }, margin: { t: 30, r: 10, b: 40, l: 50 },
          xaxis: { gridcolor: line }, yaxis: { gridcolor: line } }, p.plot.layout || {});
        Plotly.newPlot(pl, p.plot.data, layout, { responsive: true, displaylogo: false });
      }).catch(() => { pl.textContent = t('plot_error'); });
    }
  }, true);

  searchEl.addEventListener('input', render);

  return {
    count: projects.length,
    render() { buildFilters(); render(); },
    current() { const idx = projects.findIndex((p) => p.id === selected); return [projects[idx], idx]; },
  };
}

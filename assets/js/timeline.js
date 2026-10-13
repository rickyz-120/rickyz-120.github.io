// Linha do tempo única: experiência profissional + formação, com filtro e linha que se desenha ao rolar.
// Estado final sempre visível: se o JS falhar ou houver movimento reduzido, a linha já aparece completa.
import { $, esc, tr, fmtMonth, clamp, prefersReducedMotion } from './util.js';
import { t, getLang } from './i18n.js';

const ICON_WORK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>';
const ICON_EDU = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2 9 10-5 10 5-10 5Z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/></svg>';

export function createTimeline({ experience, education, site, reveal }) {
  const listEl = $('#timeline'), filtersEl = $('#tlFilters');
  const items = [
    ...experience.map((x) => ({ ...x, kind: 'work' })),
    ...education.map((x) => ({ ...x, kind: 'edu' })),
  ];
  // Ordem cronológica: do início mais antigo ao mais recente (sem data de início vai para o fim).
  const key = (x) => (x.start ?? '9999-99') + (x.end ?? '9999-99');
  items.sort((a, b) => key(a).localeCompare(key(b)));
  let filter = location.hash === '#formacao' ? 'edu' : 'all';

  function buildFilters() {
    filtersEl.innerHTML = '';
    [['all', 'tl_all'], ['work', 'tl_work'], ['edu', 'tl_edu']].forEach(([f, k]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = t(k);
      b.setAttribute('aria-pressed', String(filter === f));
      b.addEventListener('click', () => { filter = f; buildFilters(); render(); });
      filtersEl.appendChild(b);
    });
  }

  function when(x, lang) {
    const s = fmtMonth(x.start, lang), e = x.end ? fmtMonth(x.end, lang) : t('current');
    return s ? `${s} – ${e}` : e;
  }

  function render() {
    const lang = getLang();
    const shown = items.filter((x) => filter === 'all' || x.kind === filter);
    listEl.innerHTML = shown.length ? '' : `<li class="empty">${esc(t('tl_empty'))}</li>`;
    shown.forEach((x) => {
      const li = document.createElement('li');
      li.className = 'tl-item ' + x.kind;
      const summary = tr(x.summary, lang), bullets = tr(x.bullets, lang) || [];
      li.innerHTML = `<span class="tl-dot">${x.kind === 'edu' ? ICON_EDU : ICON_WORK}</span>` +
        `<article class="card tl-card"><p class="tl-kind">${esc(t(x.kind === 'edu' ? 'kind_edu' : 'kind_work'))}</p>` +
        `<h3>${esc(tr(x.role, lang))}${x.draft && site.showDraftBadges ? `<span class="badge">${esc(t('example'))}</span>` : ''}</h3>` +
        `<p class="tl-org">${esc(x.org)}${x.place ? ' · ' + esc(tr(x.place, lang)) : ''}</p>` +
        `<p class="tl-when">${esc(when(x, lang))}</p>` +
        (summary ? `<p class="tl-sum">${esc(summary)}</p>` : '') +
        (bullets.length ? `<ul>${bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : '') +
        `</article>`;
      listEl.appendChild(li);
    });
    reveal?.observe(listEl.querySelectorAll('.tl-item'));
  }

  // Desenho da linha conforme a rolagem.
  function onScroll(paused) {
    if (paused || prefersReducedMotion()) { listEl.style.setProperty('--draw', '1'); return; }
    const r = listEl.getBoundingClientRect(), vh = window.innerHeight;
    const p = clamp((vh * .85 - r.top) / Math.max(r.height, 1), 0, 1);
    listEl.style.setProperty('--draw', p.toFixed(3));
  }

  if (location.hash === '#formacao') requestAnimationFrame(() => document.getElementById('trajetoria')?.scrollIntoView());

  return {
    count: items.length,
    render() { buildFilters(); render(); },
    onScroll,
    showEducation() { filter = 'edu'; buildFilters(); render(); },
  };
}

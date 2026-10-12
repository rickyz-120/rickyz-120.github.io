// Textos de interface (PT/EN) e estado do idioma.
// Conteúdo (projetos, posts etc.) vem dos JSON em data/ com campos {pt, en}.
import { lsGet, lsSet, params } from './util.js';

export const UI = {
  pt: {
    skip: 'Pular para o conteúdo',
    nav_label: 'Principal', nav_home: 'Início', nav_about: 'Sobre', nav_projects: 'Projetos', nav_skills: 'Habilidades',
    nav_timeline: 'Trajetória', nav_certs: 'Certificações', nav_testimonials: 'Depoimentos', nav_blog: 'Blog', nav_contact: 'Contato',
    menu: 'Menu', menu_open: 'Abrir menu', menu_close: 'Fechar menu',
    cv: 'Baixar CV', soon: 'em breve', cv_soon: 'CV em breve',
    theme: 'Tema claro', lang: 'Mudar para inglês', mail: 'Contato e e-mail',
    pause: 'Pausar animações', play: 'Retomar animações',
    cta_projects: 'Ver projetos',
    about_kicker: 'Sobre mim', about_title: 'Prazer, Henrique Reis', nick: 'Todo mundo me chama de Rickz',
    photo_alt: 'Foto de Henrique Reis',
    projects_title: 'Projetos selecionados', search: 'Buscar projeto', filter: 'Filtrar por tecnologia', filter_all: 'Todos',
    problem: 'Problema', solution: 'Solução', result: 'Resultado', tech: 'Tecnologias',
    repo: 'Ver repositório', demo: 'Ver demo', demo_embed: 'Abrir demo aqui', demo_image: 'Ver imagem do projeto',
    plot: 'Ver gráfico interativo', plot_loading: 'Carregando gráfico…', plot_error: 'Não foi possível carregar o gráfico.',
    empty: 'Nenhum projeto encontrado.', count_one: '1 projeto', count_many: '{n} projetos',
    example: 'exemplo', soon_text: 'em breve', new_tab: '(abre em nova aba)',
    screen_alt: 'Painel do dashboard: {desc}',
    skills_title: 'Habilidades', skills_more: 'mais em breve',
    timeline_title: 'Trajetória e formação', tl_all: 'Tudo', tl_work: 'Trajetória', tl_edu: 'Formação', tl_filter: 'Filtrar linha do tempo',
    kind_work: 'Experiência', kind_edu: 'Formação', current: 'atual', tl_empty: 'Nada por aqui ainda.',
    certs_title: 'Certificações', credential: 'Ver credencial',
    testimonials_title: 'Depoimentos',
    blog_title: 'Blog e notas de estudo', blog_all: 'Ver todos os posts', read_min: '{n} min de leitura',
    contact_title: 'Contato e links', contact_text: 'Bora conversar sobre dados? Me chama por aqui.',
    copy: 'Copiar e-mail', copied: 'Copiado!', copy_fail: 'Não deu para copiar. Selecione o texto.',
    draft_note: 'Itens com o selo “exemplo” são provisórios. Os dados de esportes do painel 3D são fictícios.',
    draft_mode: 'Modo revisão (?draft=1): itens de rascunho visíveis.',
    footer_rights: 'Todos os direitos reservados.', footer_made: 'feito com HTML, CSS e JS',
    load_error: 'Não foi possível carregar os dados do site. Tente recarregar a página.',
    // blog
    blog_lead: 'Notas curtas sobre dados, estudos e projetos.', tags: 'Filtrar por tag', all_tags: 'Todas',
    no_posts: 'Nenhum post publicado ainda.', back_blog: '← Voltar ao blog', back_home: '← Voltar ao início',
    post_missing: 'Post não encontrado.', post_lang_fallback: 'Este post ainda não tem versão em inglês.',
  },
  en: {
    skip: 'Skip to content',
    nav_label: 'Main', nav_home: 'Home', nav_about: 'About', nav_projects: 'Projects', nav_skills: 'Skills',
    nav_timeline: 'Journey', nav_certs: 'Certifications', nav_testimonials: 'Testimonials', nav_blog: 'Blog', nav_contact: 'Contact',
    menu: 'Menu', menu_open: 'Open menu', menu_close: 'Close menu',
    cv: 'Download CV', soon: 'soon', cv_soon: 'CV coming soon',
    theme: 'Light theme', lang: 'Switch to Portuguese', mail: 'Contact and email',
    pause: 'Pause animations', play: 'Resume animations',
    cta_projects: 'View projects',
    about_kicker: 'About me', about_title: 'Hi, I am Henrique Reis', nick: 'Everyone calls me Rickz',
    photo_alt: 'Photo of Henrique Reis',
    projects_title: 'Selected projects', search: 'Search projects', filter: 'Filter by technology', filter_all: 'All',
    problem: 'Problem', solution: 'Solution', result: 'Result', tech: 'Technologies',
    repo: 'View repository', demo: 'View demo', demo_embed: 'Open demo here', demo_image: 'View project image',
    plot: 'View interactive chart', plot_loading: 'Loading chart…', plot_error: 'Could not load the chart.',
    empty: 'No projects found.', count_one: '1 project', count_many: '{n} projects',
    example: 'sample', soon_text: 'coming soon', new_tab: '(opens in a new tab)',
    screen_alt: 'Dashboard panel: {desc}',
    skills_title: 'Skills', skills_more: 'more soon',
    timeline_title: 'Journey and education', tl_all: 'All', tl_work: 'Journey', tl_edu: 'Education', tl_filter: 'Filter timeline',
    kind_work: 'Experience', kind_edu: 'Education', current: 'present', tl_empty: 'Nothing here yet.',
    certs_title: 'Certifications', credential: 'View credential',
    testimonials_title: 'Testimonials',
    blog_title: 'Blog and study notes', blog_all: 'See all posts', read_min: '{n} min read',
    contact_title: 'Contact and links', contact_text: 'Want to talk data? Reach me here.',
    copy: 'Copy email', copied: 'Copied!', copy_fail: 'Could not copy. Select the text instead.',
    draft_note: 'Items with the “sample” badge are placeholders. Sports data in the 3D panel is fictional.',
    draft_mode: 'Review mode (?draft=1): draft items are visible.',
    footer_rights: 'All rights reserved.', footer_made: 'made with HTML, CSS and JS',
    load_error: 'Could not load the site data. Try reloading the page.',
    blog_lead: 'Short notes on data, studies and projects.', tags: 'Filter by tag', all_tags: 'All',
    no_posts: 'No posts published yet.', back_blog: '← Back to blog', back_home: '← Back to home',
    post_missing: 'Post not found.', post_lang_fallback: 'This post is not available in English yet.',
  },
};

function initialLang() {
  const q = params.get('lang');
  if (q === 'en' || q === 'pt') return q;
  const saved = lsGet('rz-lang');
  if (saved === 'en' || saved === 'pt') return saved;
  return (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'pt';
}

let lang = initialLang();
const subs = new Set();

export const getLang = () => lang;
export function t(key, vars) {
  let s = UI[lang][key] ?? UI.pt[key] ?? key;
  if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
  return s;
}
export function onLang(fn) { subs.add(fn); }

export function setLang(next) {
  lang = next;
  lsSet('rz-lang', lang);
  // mantém ?lang= coerente quando o link compartilhado tem o parâmetro
  const u = new URL(location.href);
  if (u.searchParams.has('lang')) { u.searchParams.set('lang', lang); history.replaceState(null, '', u); }
  applyStatic();
  subs.forEach((fn) => fn(lang));
}

// Aplica textos estáticos marcados no HTML.
export function applyStatic() {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.setAttribute('placeholder', t(el.dataset.i18nPh)); });
  const lb = document.getElementById('langBtn');
  if (lb) { lb.textContent = lang === 'pt' ? 'EN' : 'PT'; lb.setAttribute('aria-label', t('lang')); }
}

export function bindLangButton() {
  const lb = document.getElementById('langBtn');
  if (lb) lb.addEventListener('click', () => setLang(lang === 'pt' ? 'en' : 'pt'));
}

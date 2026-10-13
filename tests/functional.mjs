// Testes de comportamento: filtro e busca, tema e idioma persistentes, pausa, menu no celular,
// ?draft=1, ?lang=en, blog, post, 404 e fallback sem Three.js.
// Uso: sirva o site (python -m http.server 8080) e rode: node tests/functional.mjs [url-base]
import { launch } from './browser.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:8080/';
const TIMEOUT = 60000;
const browser = await launch();
const results = [];
async function test(name, fn) {
  try { await fn(); results.push(['ok', name]); }
  catch (e) { results.push(['FALHOU', name + ' → ' + e.message.split('\n')[0]]); }
}
const assert = (c, msg) => { if (!c) throw new Error(msg); };
async function fresh(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, ...opts });
  const page = await ctx.newPage();
  page.setDefaultTimeout(TIMEOUT);
  page.errors = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) page.errors.push(m.text()); });
  page.on('pageerror', (e) => page.errors.push(e.message));
  return { ctx, page };
}

await test('filtro e busca de projetos', async () => {
  const { ctx, page } = await fresh();
  await page.goto(BASE, { waitUntil: 'networkidle' }); await page.waitForSelector('html[data-ready="1"]');
  assert(await page.locator('#projList .item').count() === 3, '3 projetos esperados');
  await page.getByRole('button', { name: 'PyTorch' }).click();
  assert(await page.locator('#projList .item').count() === 1, 'filtro PyTorch deveria deixar 1');
  await page.getByRole('button', { name: 'Todos' }).click();
  await page.fill('#search', 'logíst');
  assert(await page.locator('#projList .item').count() === 1, 'busca "logíst" deveria achar 1');
  await page.fill('#search', 'zzzz');
  assert(await page.locator('#projList .empty').isVisible(), 'mensagem de vazio');
  await page.fill('#search', '');
  // teclado: seta para baixo + Enter expande o segundo
  await page.locator('#projList .item-head').first().focus();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  assert(await page.locator('#projList .item').nth(1).locator('.item-head').getAttribute('aria-expanded') === 'true', 'Enter deveria expandir o 2º');
  assert((await page.locator('#screenAlt').getAttribute('aria-label')).length > 20, 'texto alternativo do painel');
  const repo = page.locator('#projList .item.sel a.btn.primary');
  assert((await repo.getAttribute('rel')) === 'noopener' && (await repo.getAttribute('target')) === '_blank', 'repo em nova aba com noopener');
  assert(!page.errors.length, page.errors.join(' | '));
  await ctx.close();
});

await test('tema e idioma persistem após recarregar', async () => {
  const { ctx, page } = await fresh();
  await page.goto(BASE, { waitUntil: 'networkidle' }); await page.waitForSelector('html[data-ready="1"]');
  assert(await page.getAttribute('html', 'data-theme') === 'dark', 'padrão escuro');
  await page.click('#themeBtn'); await page.click('#langBtn');
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('html[data-ready="1"]');
  assert(await page.getAttribute('html', 'data-theme') === 'light', 'tema claro salvo');
  assert(await page.getAttribute('html', 'lang') === 'en', 'idioma en salvo');
  assert((await page.title()).includes('data analyst'), 'título em inglês');
  assert((await page.textContent('#langBtn')).trim() === 'PT', 'botão mostra PT');
  await ctx.close();
});

await test('padrão escuro mesmo com sistema claro', async () => {
  const { ctx, page } = await fresh({ colorScheme: 'light' });
  await page.goto(BASE, { waitUntil: 'networkidle' }); await page.waitForSelector('html[data-ready="1"]');
  assert(await page.getAttribute('html', 'data-theme') === 'dark', 'deveria ser escuro');
  await ctx.close();
});

await test('pausar animações (salvo; congela o glitch)', async () => {
  const { ctx, page } = await fresh();
  await page.goto(BASE, { waitUntil: 'networkidle' }); await page.waitForSelector('html[data-ready="1"]');
  await page.click('#pauseBtn');
  assert(await page.getAttribute('#pauseBtn', 'aria-pressed') === 'true', 'aria-pressed true');
  assert(await page.evaluate(() => document.documentElement.classList.contains('paused')), 'classe paused');
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.glitch'), '::before').animationName);
  assert(anim === 'none', 'glitch deveria parar: ' + anim);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('html[data-ready="1"]');
  assert(await page.getAttribute('#pauseBtn', 'aria-pressed') === 'true', 'pausa salva');
  await ctx.close();
});

await test('movimento reduzido começa pausado', async () => {
  const { ctx, page } = await fresh({ reducedMotion: 'reduce' });
  await page.goto(BASE, { waitUntil: 'networkidle' }); await page.waitForSelector('html[data-ready="1"]');
  assert(await page.getAttribute('#pauseBtn', 'aria-pressed') === 'true', 'deveria começar pausado');
  await ctx.close();
});

await test('menu no celular abre, navega e fecha com Esc', async () => {
  const { ctx, page } = await fresh({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  await page.goto(BASE, { waitUntil: 'networkidle' }); await page.waitForSelector('html[data-ready="1"]');
  assert(!(await page.locator('#navLinks a[data-go="sobre"]').isVisible()), 'links escondidos no celular');
  await page.click('#menuBtn');
  assert(await page.locator('#sheet').isVisible(), 'folha aberta');
  assert(await page.getAttribute('#menuBtn', 'aria-expanded') === 'true', 'aria-expanded');
  await page.locator('#sheet a[data-go="habilidades"]').click();
  await page.waitForTimeout(1600);
  assert(!(await page.locator('#sheet').isVisible()), 'folha fecha ao navegar');
  const top = await page.evaluate(() => document.getElementById('habilidades').getBoundingClientRect().top);
  assert(Math.abs(top) < 120, 'rolou até Habilidades: ' + top);
  await page.click('#menuBtn'); await page.keyboard.press('Escape');
  assert(!(await page.locator('#sheet').isVisible()), 'Esc fecha');
  const small = await page.evaluate(() => [...document.querySelectorAll('.tools .pill, #menuBtn, .btn')].filter((b) => b.offsetParent && b.getBoundingClientRect().height < 40).map((b) => b.id || b.textContent.trim()));
  assert(!small.length, 'alvos de toque pequenos: ' + small.join(', '));
  await ctx.close();
});

await test('seções vazias escondidas; ?draft=1 mostra tudo', async () => {
  const { ctx, page } = await fresh();
  await page.goto(BASE, { waitUntil: 'networkidle' }); await page.waitForSelector('html[data-ready="1"]');
  for (const id of ['certificacoes', 'depoimentos', 'blog']) {
    assert(!(await page.locator('#' + id).isVisible()), id + ' deveria estar escondida');
    assert(!(await page.locator(`#navLinks a[data-go="${id}"]`).isVisible()), id + ' fora do menu');
  }
  await page.goto(BASE + '?draft=1', { waitUntil: 'networkidle' });
  for (const id of ['certificacoes', 'depoimentos', 'blog']) assert(await page.locator('#' + id).isVisible(), id + ' visível em draft');
  assert(await page.locator('#blogGrid a[href*="draft=1"]').count() > 0, 'links do blog mantêm draft=1');
  await ctx.close();
});

await test('?lang=en abre em inglês', async () => {
  const { ctx, page } = await fresh();
  await page.goto(BASE + '?lang=en', { waitUntil: 'networkidle' });
  assert(await page.getAttribute('html', 'lang') === 'en', 'lang en');
  assert((await page.textContent('#projTitle')).includes('Selected'), 'textos em inglês');
  await ctx.close();
});

await test('CV desativado sem link quebrado', async () => {
  const { ctx, page } = await fresh();
  await page.goto(BASE, { waitUntil: 'networkidle' }); await page.waitForSelector('html[data-ready="1"]');
  assert(await page.getAttribute('#cvHero', 'aria-disabled') === 'true', 'aria-disabled');
  assert(await page.locator('#cvHero').evaluate((e) => e.tagName) === 'SPAN', 'não é link');
  await ctx.close();
});

await test('blog e post (com ?draft=1), 404', async () => {
  const { ctx, page } = await fresh();
  await page.goto(BASE + 'blog.html', { waitUntil: 'networkidle' });
  assert(await page.locator('#postList .error-box').isVisible(), 'sem posts publicados');
  await page.goto(BASE + 'blog.html?draft=1', { waitUntil: 'networkidle' });
  await page.locator('#postList a').first().click();
  await page.waitForSelector('.prose h2');
  assert((await page.textContent('.post-meta')).includes('min'), 'tempo de leitura');
  assert(await page.locator('.prose pre code').count() > 0, 'bloco de código');
  await page.click('#langBtn');
  await page.waitForFunction(() => document.querySelector('#article h1')?.textContent.includes('How'));
  await page.goto(BASE + 'post.html?slug=exemplo', { waitUntil: 'networkidle' });
  assert(await page.locator('#article .error-box').isVisible(), 'rascunho escondido sem draft');
  await page.goto(BASE + '404.html', { waitUntil: 'networkidle' });
  assert((await page.textContent('h1')) === '404', '404');
  assert(!page.errors.filter((e) => !e.includes('404')).length, page.errors.join(' | '));
  await ctx.close();
});

await test('sem Three.js: fallback 2D e site funcionando', async () => {
  const { ctx, page } = await fresh();
  await page.route('**/three.min.js', (r) => r.abort());
  await page.goto(BASE, { waitUntil: 'networkidle' }); await page.waitForSelector('html[data-ready="1"]');
  await page.waitForTimeout(500);
  assert(await page.evaluate(() => document.documentElement.classList.contains('no-webgl')), 'classe no-webgl');
  assert(await page.locator('.scene-fallback canvas').isVisible(), 'imagem estática do dashboard');
  assert(await page.locator('#projList .item').count() === 3, 'projetos funcionando');
  await ctx.close();
});

await test('cena WebGL ativa quando disponível', async () => {
  const { ctx, page } = await fresh();
  await page.goto(BASE, { waitUntil: 'networkidle' }); await page.waitForSelector('html[data-ready="1"]');
  await page.waitForTimeout(500);
  assert(!(await page.evaluate(() => document.documentElement.classList.contains('no-webgl'))), 'deveria usar WebGL');
  await ctx.close();
});

await browser.close();
results.forEach(([s, n]) => console.log(`${s === 'ok' ? '✓' : '✗'} ${n}`));
const fail = results.filter(([s]) => s !== 'ok').length;
console.log(fail ? `\n${fail} teste(s) falharam.` : `\nTodos os ${results.length} testes passaram.`);
process.exit(fail ? 1 : 0);

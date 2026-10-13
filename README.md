# Portfólio do Rickz

Site pessoal do Henrique Reis (Rickz), analista de dados. Publicado em **https://rickyz-120.github.io**.

HTML, CSS e JavaScript puros, sem framework e sem etapa de build: o GitHub Pages serve os arquivos como estão. Quase todo o conteúdo vem dos arquivos JSON em `data/`. Para mudar texto, você edita o JSON e não precisa mexer no HTML.

---

## Sumário

1. [Rodar no seu computador](#1-rodar-no-seu-computador)
2. [Onde fica cada coisa](#2-onde-fica-cada-coisa)
3. [Tarefas comuns](#3-tarefas-comuns)
4. [Rascunhos, selos "exemplo" e modo revisão](#4-rascunhos-selos-exemplo-e-modo-revisão)
5. [Publicar alterações](#5-publicar-alterações)
6. [Testes e verificação](#6-testes-e-verificação)
7. [Decisões tomadas](#7-decisões-tomadas)
8. [Notas do Lighthouse e limitações](#8-notas-do-lighthouse-e-limitações)

---

## 1. Rodar no seu computador

Pré-requisito: [Node.js](https://nodejs.org) 20 ou mais novo (já instalado nesta máquina).

```bash
npm install          # só na primeira vez: baixa as ferramentas de teste
npm run serve        # abre o servidor em http://127.0.0.1:8080
```

Abra `http://127.0.0.1:8080` no navegador. O site precisa de um servidor porque lê os JSON com `fetch`; abrir o `index.html` direto (duplo clique) não funciona.

Alternativa sem Node: `python -m http.server 8080`.

## 2. Onde fica cada coisa

| Arquivo | O que tem |
|---|---|
| `data/site.json` | Nome, cargo, frase do hero, texto do Sobre, foto, links, CV, analytics, selos e SEO |
| `data/projects.json` | Projetos (a ordem do arquivo é a ordem no site) |
| `data/skills.json` | Habilidades por categoria (sem nível) |
| `data/experience.json` | Experiência profissional (linha do tempo) |
| `data/education.json` | Formação (linha do tempo) |
| `data/certifications.json` | Certificações |
| `data/testimonials.json` | Depoimentos |
| `data/posts.json` + `content/posts/` | Blog |
| `data/screen-demo.json` | Dados **fictícios** de esportes do painel 3D |
| `assets/js/i18n.js` | Textos fixos da interface (botões, títulos) em PT e EN |
| `assets/css/tokens.css` | Cores e fontes dos temas escuro e claro |

Textos traduzíveis usam o formato `{ "pt": "...", "en": "..." }`. Sem `en`, o site mostra o `pt` (o validador avisa).

## 3. Tarefas comuns

Depois de qualquer mudança em `data/`, rode o validador:

```bash
npm run validate
```

Ele aponta, em português, o arquivo, o campo e o problema (campo faltando, erro de digitação, arquivo inexistente etc.).

### Trocar a frase do hero

Em `data/site.json`, edite `tagline`. Quando for a frase definitiva, apague o `"draft": true` de dentro dela.

```json
"tagline": { "pt": "Sua frase nova.", "en": "Your new line." }
```

### Escrever o Sobre, a trajetória e a formação

- **Sobre:** `data/site.json` → `about.paragraphs.pt` e `about.paragraphs.en` (uma string por parágrafo). Depois apague `"draft": true` de `about`.
- **Trajetória:** `data/experience.json`. **Formação:** `data/education.json`. Campos: `role` (cargo ou curso), `org`, `start` e `end` no formato `"AAAA-MM"` (`end: null` aparece como "atual"), `place`, `summary` e `bullets` (lista de tópicos). Troque `draft` para `false` quando revisar.

### Adicionar um projeto

1. Em `data/projects.json`, copie um bloco existente e cole onde quer que ele apareça na lista.
2. Preencha `id` (único, minúsculas e hífens), `title`, `tags`, `tech` (vira filtro), `problem`, `solution`, `result` e `repo`.
   - Campo sem informação: `{ "pt": null, "en": null }`. O site mostra "em breve" com discrição.
   - **Só coloque métricas reais.**
3. Opcional:
   - `demo`: `{ "type": "link", "url": "https://..." }`, ou `"iframe"` (Power BI "publicar na web", Streamlit, ou um HTML em `demos/`), ou `"image"` (com `"alt"`).
   - `screen`: gráfico com **dados reais** que aparece no painel 3D quando o projeto é selecionado (o Titanic tem um exemplo). `kind` pode ser `bars`, `line` ou `donut`.
   - `plot`: gráfico interativo Plotly, carregado só quando o visitante abre o bloco: `{ "data": [ ... ], "layout": { ... } }` no formato do Plotly.
   - `"status": "hidden"` esconde o projeto sem apagá-lo.
4. `npm run validate`, depois commit e push (veja a seção 5).

### Adicionar um post no blog

1. Crie `content/posts/meu-post.pt.md` (e `meu-post.en.md`, se quiser a versão em inglês) com o cabeçalho:

   ```markdown
   ---
   title: Título do post
   date: 2026-10-20
   summary: Uma frase de resumo.
   tags: [sql, estudo]
   ---

   Texto em Markdown...
   ```

2. Adicione o post em `data/posts.json` (copie o bloco do `exemplo`), com `"draft": false`. Sem versão em inglês, use `"en": null` em `file`.
3. `npm run validate` e `npm run sitemap` (o sitemap passa a incluir o post).

O post de exemplo (`exemplo`) explica tudo isso e só aparece com `?draft=1`. Pode apagá-lo quando quiser.

### Adicionar certificação ou depoimento

- `data/certifications.json`: `title`, `issuer`, `year`, `url` da credencial.
- `data/testimonials.json`: `name`, `role`, `org`, `quote` (PT/EN), `photo` (opcional), `url` (opcional). **Só depoimentos reais e com autorização da pessoa.**
- Apague os itens de exemplo. A seção aparece sozinha quando houver pelo menos um item com `"draft": false`.

### Adicionar o CV

1. Salve o PDF como `assets/cv/Henrique-Reis-CV.pdf`.
2. Em `data/site.json`, mude `cv.available` para `true`.

Os botões "Baixar CV" passam a funcionar. Antes disso, eles aparecem desativados com "em breve", sem link quebrado.

### Adicionar a foto

1. Salve a foto em `assets/img/profile.jpg` (quadrada, de uns 400×400 px; WebP também serve).
2. Em `data/site.json`, mude `"photo": null` para `"photo": "assets/img/profile.jpg"`.

### Trocar LinkedIn, Kaggle e e-mail

Em `data/site.json` → `links` (use `null` para esconder um botão). Cada botão de contato só aparece quando o link existe. O e-mail aparece como botão `mailto:` e como texto com botão "copiar". Depois rode:

```bash
npm run sitemap      # atualiza também o JSON-LD (sameAs) do index.html
```

### Ligar o analytics (opcional, sem cookies)

1. Crie uma conta gratuita em [GoatCounter](https://www.goatcounter.com) (recomendado) ou [Plausible](https://plausible.io).
2. Em `data/site.json`:
   - GoatCounter: `"analytics": { "provider": "goatcounter", "siteId": "seu-codigo" }` (o código é o `seu-codigo` de `seu-codigo.goatcounter.com`).
   - Plausible: `"analytics": { "provider": "plausible", "siteId": "rickyz-120.github.io" }`.

O script só carrega com esses campos preenchidos, nunca em `localhost`, e respeita "Do Not Track" e Global Privacy Control.

### Mudar cores ou fontes

Tudo fica em `assets/css/tokens.css` (um bloco para o tema escuro e outro para o claro). Os componentes só usam esses tokens.

## 4. Rascunhos, selos "exemplo" e modo revisão

- `"draft": true` marca conteúdo provisório.
- Em **Sobre, Projetos, Habilidades e Trajetória**, rascunhos aparecem com um selo pequeno "exemplo" enquanto `site.json > showDraftBadges` for `true`.
- Em **Certificações, Depoimentos e Blog**, rascunhos ficam **escondidos**. Seção sem nenhum item publicado some da página e do menu, para não deixar "buracos" para recrutadores.
- **Modo revisão:** abra o site com `?draft=1` (ex.: `http://127.0.0.1:8080/?draft=1`) para ver tudo, inclusive os rascunhos escondidos.
- **Desligar os selos:** quando revisar os textos, mude `showDraftBadges` para `false` em `data/site.json`.

## 5. Publicar alterações

```bash
npm run validate
npm run sitemap
git add -A
git commit -m "Descreva a mudança"
git push
```

O GitHub Pages atualiza o site em um ou dois minutos. Acompanhe em **Actions** no repositório.

Outros comandos:

| Comando | Para quê |
|---|---|
| `npm run vendor` | Recopia Three.js, marked, DOMPurify, Plotly e fontes de `node_modules` para `assets/` |
| `npm run og` | Regera `assets/img/og-image.png` e os favicons PNG (precisa do `npm run serve` rodando) |

## 6. Testes e verificação

Com o servidor rodando (`npm run serve`):

```bash
npm test               # comportamento (12 testes) + erros de console em todas as páginas
npm run screenshots    # capturas em 375/768/1440 px, temas escuro e claro, PT e EN → tests/output/
npm run lighthouse     # Lighthouse no modo celular (adicione "desktop" para o modo desktop)
```

Os testes usam o Playwright. Se o Chromium do Playwright não abrir, eles usam o Microsoft Edge ou o Chrome instalados (`tests/browser.mjs`). A cena 3D roda com WebGL por software (SwiftShader).

O que `npm test` cobre: filtro, busca e teclado nos projetos; tema e idioma persistindo após recarregar; tema escuro por padrão mesmo com o sistema claro; pausa (salva, e congela o glitch); `prefers-reduced-motion` começando pausado; menu do celular (abre, navega, fecha com Esc, alvos ≥ 44 px); seções vazias escondidas e `?draft=1`; `?lang=en`; CV desativado; blog, post e 404; fallback sem Three.js; cena WebGL ativa.

## 7. Decisões tomadas

Decisões que tomei sozinho durante a construção, para você revisar:

- **Rascunhos em duas regras** (seção 4): seções principais mostram rascunhos com selo; seções opcionais os escondem. Seguir a regra "esconder seção sem itens publicados" ao pé da letra sumiria com os projetos, que estão todos em revisão.
- **Ordem dos projetos:** Titanic primeiro, porque é o único com resultado documentado (acurácia de 79,89% no notebook). Depois o classificador de gêneros musicais e o Wise Routes (`operation-strategy`).
- **Gráfico real no painel 3D:** o Titanic mostra a taxa de sobrevivência por classe (63,0%, 47,3% e 24,2%), calculada a partir do `titanic.csv` do próprio repositório. Os outros projetos mostram os gráficos fictícios de esportes, marcados como "dados fictícios".
- **Tecnologias dos projetos** (que viram filtros), tiradas dos READMEs, do notebook e do `requirements.txt`: Python, pandas, scikit-learn, PyTorch, Flask e JavaScript.
- **Projeto de música** descrito sem menção a equipe, como você pediu.
- **Datas da linha do tempo** só com o ano (`"start": "2023"`); o formato `"AAAA-MM"` também é aceito.
- **Habilidades com nome traduzível:** um item pode ser texto simples ou `{ "pt": "HTML e CSS (básico)", "en": "HTML & CSS (basic)" }`.
- **Fontes hospedadas no próprio site** (`assets/fonts/`, subconjunto latino) em vez do Google Fonts: mais rápido e sem depender de terceiros.
- **Three.js carregado quando o navegador fica ocioso**, depois do `load`, e não só com `defer`. É o que mantém a nota de performance no celular acima de 85. O painel 3D aparece com um fade curto.
- **Plotly** na versão "basic" (barras, linhas, pizza; 1 MB), copiado para `assets/vendor/` e carregado só quando um projeto declara `plot` e o visitante abre o gráfico. Nenhum projeto usa por enquanto.
- **Painel do hero** um pouco mais baixo que no protótipo no desktop, para os botões "Ver projetos" e "Baixar CV" não ficarem por cima da moldura. O movimento continua igual (reduzido).
- **Alvos de toque** de 44 px também nos links da pílula do menu.
- **Botão de idioma** com rótulo acessível que começa pelo texto visível ("EN, mudar para inglês"), como pede a WCAG.
- **404.html** com estilos embutidos e link para `/`, porque o GitHub Pages serve essa página em qualquer caminho.
- **`PROMPT_CLAUDE_CODE.md` e `prototipo-referencia.html`** ficam fora do repositório (`.gitignore`): são arquivos de trabalho e têm anotações que não precisam ser públicas.
- **`scripts/build-sitemap.mjs`** também atualiza o JSON-LD `Person` do `index.html` a partir do `site.json`.

## 8. Notas do Lighthouse e limitações

Medido localmente com um servidor com gzip (`npm run serve`, parecido com o GitHub Pages), Lighthouse 12.2.1:

| Página | Modo | Performance | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|---|
| Início | Celular (simulado) | 92 | 100 | 100 | 100 |
| Início | Desktop | 100 | 100 | 100 | 100 |
| Blog | Celular (simulado) | 99 | 100 | 100 | 100 |

Gargalo de performance no celular: o tempo de CPU da cena 3D (Three.js tem 600 KB; 150 KB comprimido). No teste, a cena roda com WebGL por software, o que exagera o custo. Em aparelhos reais a GPU faz esse trabalho.

Limitações conhecidas:

- Sem JavaScript, o `<noscript>` mostra só nome, resumo e links principais.
- O blog é renderizado no navegador. Buscadores que não executam JavaScript veem apenas o título e a descrição da página `post.html`.
- O cache dos arquivos é definido pelo GitHub Pages (10 minutos); não dá para configurar.
- A imagem de compartilhamento (`og-image.png`) mostra o gráfico fictício de esportes. Se mudar nome ou cargo, rode `npm run og`.

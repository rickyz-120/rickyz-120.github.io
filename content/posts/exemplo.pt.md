---
title: Como este blog funciona
date: 2026-10-12
summary: Post de exemplo: onde ficam os arquivos, como escrever em Markdown e como publicar.
tags: [blog, guia]
---

Este é um **post de exemplo**. Ele só aparece com `?draft=1` na URL, então recrutadores não veem esta página enquanto ela estiver como rascunho.

## Onde ficam as coisas

- O texto de cada post fica em `content/posts/<slug>.pt.md` (e `<slug>.en.md` para a versão em inglês).
- A lista de posts fica em `data/posts.json`: título, data, resumo, tags e o caminho dos arquivos.
- Um post com `"draft": true` fica escondido. Troque para `false` para publicar.

## Como escrever

O blog aceita Markdown comum: títulos, listas, links, imagens e blocos de código.

```python
import pandas as pd

df = pd.read_csv("dados.csv")
print(df.describe())
```

> Dica: notas de estudo curtas funcionam bem aqui. Um aprendizado por post já vale.

Imagens: coloque o arquivo em `assets/img/blog/` e use `![texto alternativo](assets/img/blog/arquivo.webp)`. Sempre escreva o texto alternativo.

## Como publicar

1. Crie os arquivos `.md` e adicione o post em `data/posts.json`.
2. Rode `node scripts/validate-data.mjs` e `node scripts/build-sitemap.mjs`.
3. Faça commit e push. O GitHub Pages atualiza o site em um ou dois minutos.

---
title: How this blog works
date: 2026-10-12
summary: Sample post: where files live, how to write in Markdown and how to publish.
tags: [blog, guide]
---

This is a **sample post**. It only shows up with `?draft=1` in the URL, so recruiters do not see this page while it is a draft.

## Where things live

- Each post's text lives in `content/posts/<slug>.en.md` (and `<slug>.pt.md` for the Portuguese version).
- The post list lives in `data/posts.json`: title, date, summary, tags and the file paths.
- A post with `"draft": true` stays hidden. Switch it to `false` to publish.

## How to write

The blog supports regular Markdown: headings, lists, links, images and code blocks.

```python
import pandas as pd

df = pd.read_csv("data.csv")
print(df.describe())
```

> Tip: short study notes work well here. One lesson per post is plenty.

Images: put the file in `assets/img/blog/` and use `![alt text](assets/img/blog/file.webp)`. Always write the alt text.

## How to publish

1. Create the `.md` files and add the post to `data/posts.json`.
2. Run `node scripts/validate-data.mjs` and `node scripts/build-sitemap.mjs`.
3. Commit and push. GitHub Pages updates the site in a minute or two.

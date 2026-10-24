# hqz.me

Personal site of Léonard Henriquez. Static [Astro](https://astro.build) site, deployed to GitHub Pages.

## Develop

```sh
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # outputs dist/
```

## Content

- `src/content/profile.yaml`, `src/content/projects/*.md` and `src/content/art.yaml` (shared landscape images and their alt text): everything the site says (schema in `src/content.config.ts`).
- `src/lib/portfolio.ts`: `getPortfolio()`, the only thing a theme reads.

Add a project by dropping a Markdown file in `src/content/projects/`; it shows up in every theme, and `/#project-<file name>` links to it (opened) whatever the theme. Run `pnpm check` before pushing.

Projects with `status: released` or `building` are Selected work in Contemplation; `exploring` and `study` are Explorations. A project's `results` (measured outcomes) are its proof line; without them, its `stack` is.

The current role is `current` in `profile.yaml`. The full career (every role, every school) is on LinkedIn only, never in this repo, so the two can't contradict each other: what matters of it is told in `about`.

## For LLMs

The same content is also published as Markdown, rendered from `getPortfolio()` by `src/lib/markdown.ts` (nothing is duplicated):

- `/llms.txt`: entry point ([llmstxt.org](https://llmstxt.org)): who, and links to everything below.
- `/index.md` and `/llms-full.txt`: the whole site in one document. The HTML page points to it with `<link rel="alternate" type="text/markdown">`.
- `/projects/<id>.md`: one project.

Everything the themes show is there too, principles included; for the career, they point to LinkedIn. A new content field shows up there only once `src/lib/markdown.ts` renders it.

## Themes

The site is one static page, `/`, that can be shown in several themes: **Contemplation** (the default), **Minimal** and **Terminal**. A switcher in the bottom-right corner lets visitors pick one; the choice is remembered in `localStorage` (`site-theme`).

- `/?theme=<slug>` opens the site in that theme and remembers it, e.g. [`/?theme=minimal`](https://hqz.me/?theme=minimal) or [`/?theme=terminal`](https://hqz.me/?theme=terminal). The parameter is removed from the address bar; unknown values are ignored.
- Without JavaScript, and for crawlers, the default theme is what's there (`DEFAULT_THEME` in `src/themes/registry.ts`). The other themes sit in inert `<template>`s.

How it works (`src/layouts/Site.astro`, `src/themes/document.ts`): a blocking script at the top of `<head>` resolves the theme (`?theme=` → stored choice → default) and applies its `meta.ts` settings before first paint (`html[data-theme]`, theme colour, font preloads, a `fetchpriority="high"` preload of its hero image, `boot`). At the end of `<body>`, a second script swaps the default theme's markup for the chosen theme's template, so only one theme is ever in the DOM. Every theme's CSS ships on the page, which is why each theme scopes its global styles to `html[data-theme="<slug>"]`. Only the active theme's `client.ts` is downloaded. Switching fades the page out, navigates to `/?theme=<slug>` and fades the new page in (no fades with reduced motion). The switcher slides away while the page scrolls down, so it doesn't sit on text, and comes back on scrolling up, at the end of the page or on keyboard focus.

Known trade-off: the default theme's markup is in the HTML (for crawlers and visitors without JavaScript), so its eager hero images are always downloaded, even when another theme is shown. The active theme's hero is preloaded from the `<head>` with high priority, so it doesn't wait behind it, but the default theme's hero is a wasted download for those visitors (Contemplation's panorama: six WebP landscapes, from about 70 KB each on a phone to about 150 KB on a large screen).

### Adding a theme

Create `src/themes/<slug>/` (lowercase; folders starting with `_` are ignored) with:

- `Page.astro`: the markup, without `<html>`/`<head>`/`<body>`. It receives `{ portfolio }`. Scope global CSS to `html[data-theme="<slug>"]`, prefix keyframes, set the `--switcher-*` custom properties, and don't use `<script>` tags. Give project rows `id={project.anchor}` so deep links work.
- `meta.ts` (optional): name, order in the switcher, theme colour, `color-scheme`, preloads, the hero image to preload (`heroImage`: return the same options the theme's `<Picture>`/`<Image>` uses, see `src/themes/*/hero.ts`), social image, and a tiny pre-paint `boot` function.
- `client.ts` (optional): the theme's browser code, imported only when it's active.

That's enough for it to appear on the page and in the switcher (restart the dev server if it doesn't show up). The full contract is in `src/themes/types.ts`.

## Deploy

Every push to `main` builds and deploys through `.github/workflows/deploy.yml`.

One-time setup:

1. In the GitHub repo, go to Settings → Pages and set Source to **GitHub Actions**.
2. In Cloudflare DNS for `hqz.me`, add these records with the proxy turned **off** (grey cloud), so GitHub can issue the certificate:
   - `A` `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` `www` → `leonard-henriquez.github.io`
3. Back in Settings → Pages, set the custom domain to `hqz.me` (`public/CNAME` already contains it), wait for the DNS check, then tick **Enforce HTTPS**.

## Previews

Every pull request is built and deployed to [Cloudflare Pages](https://pages.cloudflare.com) by `.github/workflows/preview.yml`, on a URL that follows its branch (`<branch>.hqz-me.pages.dev`, updated on every push). A comment on the PR links to it, in each theme. Cloudflare marks these deployments `noindex`. Production is unaffected: it stays on GitHub Pages.

One-time setup:

1. In Cloudflare, create an API token (My Profile → API Tokens → Create Token → Custom token) with the permission **Account → Cloudflare Pages → Edit**.
2. In the GitHub repo, go to Settings → Secrets and variables → Actions and add two repository secrets: `CLOUDFLARE_API_TOKEN` (the token) and `CLOUDFLARE_ACCOUNT_ID` (shown in the Cloudflare dashboard, in the URL or under Account details).

The first run creates the Pages project (`hqz-me`). Without the secrets, and on pull requests from forks, the workflow deploys nothing and says why.

# hqz.me

Personal site of Léonard Henriquez. Static [Astro](https://astro.build) site, deployed to GitHub Pages.

## Develop

```sh
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # outputs dist/
```

All content lives in `src/pages/index.astro`, as arrays at the top of the file.

## Deploy

Every push to `main` builds and deploys through `.github/workflows/deploy.yml`.

One-time setup:

1. In the GitHub repo, go to Settings → Pages and set Source to **GitHub Actions**.
2. In Cloudflare DNS for `hqz.me`, add these records with the proxy turned **off** (grey cloud), so GitHub can issue the certificate:
   - `A` `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` `www` → `leonard-henriquez.github.io`
3. Back in Settings → Pages, set the custom domain to `hqz.me` (`public/CNAME` already contains it), wait for the DNS check, then tick **Enforce HTTPS**.

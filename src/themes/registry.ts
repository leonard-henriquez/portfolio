import type { AstroComponentFactory } from "astro/runtime/server/index.js";
import type { ThemeMeta } from "./types";

/** The theme shown to first-time visitors, crawlers and visitors without JavaScript. */
export const DEFAULT_THEME = "contemplation";

// Every `src/themes/<slug>/Page.astro`, except folders starting with "_" (drafts, examples).
// Imported eagerly on purpose: the one page renders every theme, so it ships every theme's CSS.
const pages = import.meta.glob<{ default: AstroComponentFactory }>(["./*/Page.astro", "!./_*/Page.astro"], {
  eager: true,
});
const metas = import.meta.glob<{ default: Partial<ThemeMeta> }>(["./*/meta.ts", "!./_*/meta.ts"], { eager: true });

export interface Theme {
  slug: string;
  meta: ThemeMeta;
  Page: AstroComponentFactory;
  /** Link that opens the site in this theme (and remembers it). */
  href: string;
}

const slugOf = (path: string) => path.split("/")[1];

export const themes: Theme[] = Object.entries(pages)
  .map(([path, module]) => {
    const slug = slugOf(path);
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new Error(`Theme folder "${slug}" must be lowercase letters, digits and dashes (it is used in URLs and CSS).`);
    }
    const meta = metas[`./${slug}/meta.ts`]?.default ?? {};
    return { slug, meta: { ...meta, name: meta.name ?? slug }, Page: module.default, href: `/?theme=${slug}` };
  })
  .sort(
    (a, b) =>
      (a.meta.order ?? Number.POSITIVE_INFINITY) - (b.meta.order ?? Number.POSITIVE_INFINITY) ||
      a.slug.localeCompare(b.slug),
  );

const found = themes.find((theme) => theme.slug === DEFAULT_THEME);
if (!found) {
  throw new Error(`DEFAULT_THEME "${DEFAULT_THEME}" has no src/themes/${DEFAULT_THEME}/Page.astro.`);
}
export const defaultTheme: Theme = found;

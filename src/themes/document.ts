import type { Theme } from "./registry";
import type { ThemeMeta, ThemePreload } from "./types";

/*
 * The inline scripts and CSS that let one static document show any theme (used by src/layouts/Site.astro).
 * `resolveTheme`, `mountTheme` and `markSwitchArrival` are written as plain functions so they are type-checked, then serialized
 * into the page with Function.prototype.toString: they must stay self-contained (no imports, no closures).
 */

/** localStorage key of the visitor's choice. */
export const STORAGE_KEY = "site-theme";
/** `/?theme=<slug>` opens the site in that theme and remembers it. */
export const QUERY_PARAM = "theme";
/** sessionStorage flag: the next load comes from a theme switch and fades in. */
export const SWITCH_KEY = "theme-switched";

interface DocumentSettings {
  colorScheme: NonNullable<ThemeMeta["colorScheme"]>;
  /** [light, dark]: one per `<meta name="theme-color">`, in that order. */
  themeColor: [string, string];
  preload: ThemePreload[];
}

interface ResolveConfig {
  fallback: string;
  key: string;
  param: string;
  themes: Record<string, DocumentSettings>;
}

export function documentSettings(meta: ThemeMeta): DocumentSettings {
  const color = meta.themeColor ?? "#ffffff";
  return {
    colorScheme: meta.colorScheme ?? "light dark",
    themeColor: typeof color === "string" ? [color, color] : [color.light, color.dark],
    preload: meta.preload ?? [],
  };
}

/**
 * Browser, top of <head>, blocking: picks the theme (`?theme=` → stored choice → default), then applies
 * its document-level settings and its `boot`. `?theme=` is validated, remembered and removed from the URL.
 */
function resolveTheme(config: ResolveConfig, boots: Record<string, (root: HTMLElement) => void>): void {
  const root = document.documentElement;
  const known = (slug: string | null): slug is string =>
    slug !== null && Object.prototype.hasOwnProperty.call(config.themes, slug);
  let slug: string | null = null;

  try {
    const url = new URL(location.href);
    if (url.searchParams.has(config.param)) {
      const requested = url.searchParams.get(config.param);
      url.searchParams.delete(config.param);
      history.replaceState(history.state, "", url.pathname + url.search + url.hash);
      if (known(requested)) {
        slug = requested;
        try {
          localStorage.setItem(config.key, requested);
        } catch {}
      }
    }
  } catch {}

  if (!slug) {
    try {
      const stored = localStorage.getItem(config.key);
      if (known(stored)) slug = stored;
      else if (stored !== null) localStorage.removeItem(config.key);
    } catch {}
  }
  if (!known(slug)) slug = config.fallback;

  const settings = config.themes[slug];
  root.setAttribute("data-theme", slug);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", settings.colorScheme);
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta, i) => meta.setAttribute("content", settings.themeColor[i] ?? settings.themeColor[0]));
  for (const resource of settings.preload) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = resource.href;
    link.as = resource.as;
    if (resource.type) link.type = resource.type;
    if (resource.as === "font") link.crossOrigin = "";
    if (resource.imagesrcset) link.setAttribute("imagesrcset", resource.imagesrcset);
    if (resource.imagesizes) link.setAttribute("imagesizes", resource.imagesizes);
    if (resource.fetchpriority) link.setAttribute("fetchpriority", resource.fetchpriority);
    document.head.append(link);
  }
  const boot = boots[slug];
  if (boot) boot(root);
}

/**
 * Browser, end of <body>, blocking: when the active theme isn't the default, swaps the default theme's
 * markup for the active theme's template, so only one theme is ever in the live DOM (no duplicate IDs).
 * The templates are then dropped: switching themes reloads the page.
 */
function mountTheme(fallback: string): void {
  const root = document.documentElement;
  const slug = root.getAttribute("data-theme");
  const templates = document.querySelectorAll<HTMLTemplateElement>("template[data-theme-root]");
  if (slug !== fallback) {
    let template: HTMLTemplateElement | undefined;
    templates.forEach((t) => {
      if (t.getAttribute("data-theme-root") === slug) template = t;
    });
    const current = document.querySelector(`div[data-theme-root="${fallback}"]`);
    if (template && current) current.replaceWith(template.content);
    else root.setAttribute("data-theme", fallback);
  }
  templates.forEach((t) => t.remove());
}

/**
 * Browser, <head>: if this load comes from a theme switch (flag set by ThemeSwitcher.astro), fade the page in.
 * The fade is a CSS animation that ends fully opaque on its own, so the page can't stay hidden; normal
 * visits never get the class, so their first paint is untouched.
 */
function markSwitchArrival(key: string): void {
  try {
    if (sessionStorage.getItem(key) === null) return;
    sessionStorage.removeItem(key);
    document.documentElement.classList.add("theme-arriving");
  } catch {}
}

/* Serialization */

const json = (value: unknown) => JSON.stringify(value);
// Keeps a "</script>" inside a string from ending the inline script early.
const safe = (code: string) => code.replace(/<\/(script)/gi, "<\\/$1");

function serializeBoot(slug: string, boot: NonNullable<ThemeMeta["boot"]>): string {
  const source = boot.toString();
  try {
    if (typeof new Function(`return (${source})`)() !== "function") throw new Error("not a function");
  } catch (error) {
    throw new Error(
      `src/themes/${slug}/meta.ts: \`boot\` must be a self-contained arrow function or function expression (${error}).`,
    );
  }
  return source;
}

/**
 * @param extraPreloads Preloads resolved at build time, per theme slug (the hero images, see Site.astro),
 *   added to the theme's own `meta.preload` and injected the same way: only for the active theme.
 */
export function headScript(themes: Theme[], fallback: string, extraPreloads: Record<string, ThemePreload[]> = {}): string {
  const config: ResolveConfig = {
    fallback,
    key: STORAGE_KEY,
    param: QUERY_PARAM,
    themes: Object.fromEntries(
      themes.map((t) => {
        const settings = documentSettings(t.meta);
        return [t.slug, { ...settings, preload: [...settings.preload, ...(extraPreloads[t.slug] ?? [])] }];
      }),
    ),
  };
  const boots = themes
    .flatMap((t) => (t.meta.boot ? [`${json(t.slug)}:${serializeBoot(t.slug, t.meta.boot)}`] : []))
    .join(",");
  return safe(`(${resolveTheme.toString()})(${json(config)},{${boots}});(${markSwitchArrival.toString()})(${json(SWITCH_KEY)});`);
}

export function mountScript(fallback: string): string {
  return safe(`(${mountTheme.toString()})(${json(fallback)});`);
}

/** Theme roots add no box; the default theme's markup stays hidden while another theme is active. */
export function rootCss(fallback: string): string {
  return `div[data-theme-root]{display:contents}html:not([data-theme=${json(fallback)}]) div[data-theme-root=${json(fallback)}]{display:none}`;
}

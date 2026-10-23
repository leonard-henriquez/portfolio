import type { ImageMetadata, ImageOutputFormat } from "astro";
import type { Portfolio } from "../lib/portfolio";

/**
 * Every theme renders on the one page at `/`; the visitor picks which one is shown.
 * A theme is a folder `src/themes/<slug>/` (folders starting with "_" are ignored) containing:
 *
 * - `Page.astro` (required): the theme's markup, without `<html>`, `<head>` or `<body>`.
 *   It receives `ThemePageProps` and is wrapped by the page in `<div data-theme-root="<slug>">`
 *   (`display: contents`, so it adds no box). The default theme is rendered in the body; the others
 *   inside `<template data-theme-root="<slug>">` until one of them is the active theme, so their
 *   markup is inert (no image loads) and only the active theme's markup is ever in the live DOM.
 *   - All of its global CSS (resets, `html`/`body` rules, custom properties) must be scoped to
 *     `html[data-theme="<slug>"]`: every theme's CSS is bundled into the page. Component `<style>`
 *     blocks are scoped by Astro already. Keyframe names are global: prefix them per theme.
 *   - It must not contain `<script>` tags. Pre-paint setup goes in `meta.boot`, behaviour in `client.ts`.
 *   - It sets the theme switcher's custom properties (`--switcher-*`, see
 *     `src/components/ThemeSwitcher.astro`) on `html[data-theme="<slug>"]` to blend it in, and marks
 *     rows the fixed switcher must not cover (e.g. the last footer line) with `data-switcher-avoid`.
 * - `meta.ts` (optional): `export default { name, … } satisfies ThemeMeta`. Document-level settings
 *   that used to be `<head>` content: they are applied by an inline script when the theme is active.
 * - `client.ts` (optional): a browser module, imported only when this theme is active, after its
 *   markup is in the DOM. It runs on import. `src/themes/active.ts` has helpers.
 *
 * Adding the folder is enough: the page and the switcher pick it up (restart the dev server if needed).
 */
export interface ThemePageProps {
  portfolio: Portfolio;
}

export interface ThemePreload {
  /** URL of the resource, e.g. a font imported with `?url`. */
  href: string;
  as: "font" | "image" | "style";
  /** MIME type, e.g. "font/woff2". Browsers skip preloads of a type they can't use. */
  type?: string;
  /** Responsive images: the `srcset` and `sizes` of the element the preload is for, so the same candidate is fetched. */
  imagesrcset?: string;
  imagesizes?: string;
  fetchpriority?: "high" | "low" | "auto";
}

/**
 * A theme's hero image (its LCP element), described with the exact options its `<Picture>` or `<Image>` is
 * rendered with: spread the same object into the component (`<Picture {...hero} alt=… />`), so the preload
 * built from it at build time (`getImage`) names the very URLs the page then requests.
 */
export interface ThemeHeroImage {
  src: ImageMetadata;
  widths: number[];
  sizes: string;
  /** `<Picture>` formats, preferred first; the preload is for the first one. Omit for an `<Image>` (Astro's default, WebP). */
  formats?: ImageOutputFormat[];
  quality?: number;
}

export interface ThemeMeta {
  /** Display name, e.g. "Terminal". Defaults to the folder slug. */
  name: string;
  /** Position in the switcher (ascending). Themes without one come last, by slug. */
  order?: number;
  /** `theme-color` for browser chrome: one value, or one per system color scheme. */
  themeColor?: string | { light: string; dark: string };
  /** `<meta name="color-scheme">` while the theme is active. Defaults to "light dark". */
  colorScheme?: "light" | "dark" | "light dark";
  /** Resources to preload, only while the theme is active. Fonts are fetched with CORS. */
  preload?: ThemePreload[];
  /**
   * The theme's hero image, preloaded with `fetchpriority="high"` only while the theme is active, so it is
   * requested from the `<head>` instead of when the theme's markup is mounted at the end of `<body>`.
   * Return the same object the theme renders its hero with (see `ThemeHeroImage`).
   */
  heroImage?: (portfolio: Portfolio) => ThemeHeroImage;
  /** Social preview image, used when this theme is the default. Defaults to the profile hero image. */
  ogImage?: (portfolio: Portfolio) => ImageMetadata;
  /**
   * Runs in `<head>` before first paint, only while the theme is active, with `<html>` as argument
   * (e.g. to add a "js" class or restore a stored preference). It is serialized with
   * `Function.prototype.toString`, so it must be a self-contained arrow function or function
   * expression: no imports, no closure variables. Keep it tiny; it blocks rendering.
   */
  boot?: (root: HTMLElement) => void;
}

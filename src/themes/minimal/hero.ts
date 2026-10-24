import type { Portfolio, Project } from "../../lib/portfolio";
import type { ThemeHeroImage } from "../types";

/** The hero photo, as `components/Hero.astro` renders it and `meta.ts` preloads it. */
export function heroImage({ art }: Portfolio): ThemeHeroImage & { alt: string } {
  const { src, alt } = art.photo.sea;
  return {
    src,
    alt,
    formats: ["avif", "webp"],
    widths: [640, 960, 1280, 1600, src.width],
    sizes: "(min-width: 1440px) 1360px, 94vw",
  };
}

/**
 * A project's photo at the top of its page, as `ProjectPage.astro` renders it and `meta.ts` preloads it.
 * None for a pixel grid (the photo's fallback when a project has no hi-res image): it is drawn as is, never resized.
 */
export function projectHeroImage(_portfolio: Portfolio, { image }: Project): ThemeHeroImage | undefined {
  const { src, pixelated } = image.photo;
  if (pixelated) return undefined;
  return {
    src,
    widths: [640, 960, 1280, 1600, src.width].filter((w, i, all) => w <= src.width && all.indexOf(w) === i),
    sizes: "(min-width: 1440px) 1360px, 94vw",
  };
}

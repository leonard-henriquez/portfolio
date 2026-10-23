import type { Portfolio } from "../../lib/portfolio";
import type { ThemeHeroImage } from "../types";

/** The hero photo, as `components/Hero.astro` renders it and `meta.ts` preloads it. */
export function heroImage({ art }: Portfolio): ThemeHeroImage & { alt: string } {
  const { src, alt } = art.photo.night;
  return {
    src,
    alt,
    formats: ["avif", "webp"],
    widths: [640, 960, 1280, 1600, 1800],
    sizes: "100vw",
    quality: 72,
  };
}

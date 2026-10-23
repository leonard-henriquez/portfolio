import type { Portfolio } from "../../lib/portfolio";
import type { ThemeHeroImage } from "../types";

/** The dithered Wanderer, as `Page.astro` renders it and `meta.ts` preloads it. */
export function heroImage({ profile }: Portfolio): ThemeHeroImage & { alt: string } {
  return {
    src: profile.heroImage.src,
    alt: profile.heroImage.alt,
    widths: [560, 840, 1108],
    sizes: "(min-width: 1024px) 560px, 100vw",
    quality: 85,
  };
}

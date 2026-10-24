import type { ImageMetadata } from "astro";
import alpineLake from "../../assets/vista/alpine-lake.webp";
import fuji from "../../assets/vista/fuji.webp";
import glacier from "../../assets/vista/glacier.webp";
import halong from "../../assets/vista/halong.webp";
import larches from "../../assets/vista/larches.webp";
import volcanic from "../../assets/vista/volcanic.webp";
import type { Portfolio, Project } from "../../lib/portfolio";
import type { ThemeHeroImage } from "../types";

/*
 * The theme's own landscapes: six pixel-art panoramas, 1672×941, one per panel of the hero.
 * They belong to the look, not to the content, so they live here rather than in src/content/art.yaml.
 */

export interface Vista {
  src: ImageMetadata;
  alt: string;
  /** Horizontal `object-position` when the panel is cropped on its own (phones). */
  x: string;
  /** Sky colour, shown while the image loads. */
  sky: string;
}

export const VISTAS: Vista[] = [
  {
    src: halong,
    alt: "Pixel art: limestone karsts rising from the calm water of Ha Long Bay",
    x: "8%",
    sky: "#77abda",
  },
  {
    src: glacier,
    alt: "Pixel art: a glacier flowing between snowy peaks",
    x: "28%",
    sky: "#7da8d6",
  },
  {
    src: fuji,
    alt: "Pixel art: Mount Fuji above a sea of clouds, a pine and pampas grass in front",
    x: "52%",
    sky: "#81a9d2",
  },
  {
    src: alpineLake,
    alt: "Pixel art: a hiker on a rock above an alpine lake, below jagged peaks at dawn",
    x: "58%",
    sky: "#7c9add",
  },
  {
    src: larches,
    alt: "Pixel art: golden larches along a stream in a wide valley",
    x: "76%",
    sky: "#84acd5",
  },
  {
    src: volcanic,
    alt: "Pixel art: a volcanic valley at sunset with giant groundsels",
    x: "92%",
    sky: "#a5a9c7",
  },
];

/** The About band and the footer reuse two of the panoramas, under the text. */
export const ABOUT_VISTA = VISTAS[3];
export const CONTACT_VISTA = VISTAS[5];

/** Projects shown in the panorama: the first ones in display order, one landscape each. */
export function panoramaProjects(
  projects: Project[],
): { project: Project; vista: Vista }[] {
  return projects
    .slice(0, VISTAS.length)
    .map((project, i) => ({ project, vista: VISTAS[i] }));
}

/** The landscape of a project, when it has a panel. */
export function vistaOf(project: Project): Vista | undefined {
  return project.index < VISTAS.length ? VISTAS[project.index] : undefined;
}

/** Every panorama image, as components/Panorama.astro renders it; meta.ts preloads the first one. */
export function panoramaImage(src: ImageMetadata): ThemeHeroImage {
  return { src, widths: [960, 1280, src.width], sizes: "100vw" };
}

export function heroImage(_portfolio: Portfolio): ThemeHeroImage {
  return panoramaImage(VISTAS[0].src);
}

/**
 * The landscape at the top of a project's page, as `ProjectPage.astro` renders it and `meta.ts` preloads it: the
 * project's panorama, or its illustration. None for a pixel grid (the fallback when a project has no hi-res image).
 */
export function projectBanner(project: Project): (ThemeHeroImage & { alt: string; position: string; sky?: string }) | undefined {
  const vista = vistaOf(project);
  if (vista) {
    return { ...panoramaImage(vista.src), alt: vista.alt, position: `${vista.x} 66%`, sky: vista.sky };
  }
  const { src, alt, position, pixelated } = project.image.illustration;
  if (pixelated) return undefined;
  return { src, widths: [960, 1280, src.width].filter((w) => w <= src.width), sizes: "100vw", alt, position };
}

export function projectHeroImage(_portfolio: Portfolio, project: Project): ThemeHeroImage | undefined {
  return projectBanner(project);
}

import type { ImageMetadata } from "astro";
import alpineLake from "../../assets/vista/alpine-lake.webp";
import arete from "../../assets/vista/arete.webp";
import basalt from "../../assets/vista/basalt.webp";
import birches from "../../assets/vista/birches.webp";
import caldera from "../../assets/vista/caldera.webp";
import canyon from "../../assets/vista/canyon.webp";
import cirque from "../../assets/vista/cirque.webp";
import foldedRidges from "../../assets/vista/folded-ridges.webp";
import fuji from "../../assets/vista/fuji.webp";
import glacier from "../../assets/vista/glacier.webp";
import halong from "../../assets/vista/halong.webp";
import heatherRidge from "../../assets/vista/heather-ridge.webp";
import heather from "../../assets/vista/heather.webp";
import iceCave from "../../assets/vista/ice-cave.webp";
import larches from "../../assets/vista/larches.webp";
import limestoneTower from "../../assets/vista/limestone-tower.webp";
import limestoneWall from "../../assets/vista/limestone-wall.webp";
import river from "../../assets/vista/river.webp";
import saltFlat from "../../assets/vista/salt-flat.webp";
import volcanic from "../../assets/vista/volcanic.webp";
import waterfall from "../../assets/vista/waterfall.webp";
import type { Portfolio, Project } from "../../lib/portfolio";
import type { ThemeHeroImage } from "../types";

/*
 * The theme's own landscapes: pixel-art panoramas, 1672×941, one per project — six for the panels of the hero, then
 * one for each later project's page.
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

/** The six panels of the hero, for the first six projects in display order. */
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

/** One more landscape for each later project, in display order: shown on its page and in its Selected work row. */
export const MORE_VISTAS: Vista[] = [
  {
    src: basalt,
    alt: "Pixel art: a wall of basalt columns with an arch, snowy peaks in the mist beyond",
    x: "48%",
    sky: "#808995",
  },
  {
    src: iceCave,
    alt: "Pixel art: jagged snowy peaks above a sea of clouds, seen from a glacial ice cave",
    x: "56%",
    sky: "#618090",
  },
  {
    src: limestoneTower,
    alt: "Pixel art: a limestone tower rising from a sea of fog",
    x: "38%",
    sky: "#b6b6c5",
  },
  {
    src: foldedRidges,
    alt: "Pixel art: folded mountain ridges seen from above, fog in the valleys",
    x: "62%",
    sky: "#d7c7ba",
  },
  {
    src: river,
    alt: "Pixel art: the mossy roots of an old tree over a misty river",
    x: "40%",
    sky: "#5c6054",
  },
  {
    src: cirque,
    alt: "Pixel art: a waterfall in a green volcanic cirque, clouds in the valleys and ferns in front",
    x: "60%",
    sky: "#ceccce",
  },
  {
    src: waterfall,
    alt: "Pixel art: a waterfall falling into a pool in a basalt ravine, ferns in front",
    x: "58%",
    sky: "#2d383a",
  },
  {
    src: heather,
    alt: "Pixel art: hills of purple heather around a green hollow",
    x: "60%",
    sky: "#e0d9d1",
  },
  {
    src: limestoneWall,
    alt: "Pixel art: a towering limestone wall above a sea of clouds at sunrise",
    x: "60%",
    sky: "#beafa5",
  },
  {
    src: heatherRidge,
    alt: "Pixel art: a ridge covered in heather above a sea of clouds",
    x: "55%",
    sky: "#bdbdcd",
  },
  {
    src: birches,
    alt: "Pixel art: a snowy mountain cliff seen between winter birches",
    x: "50%",
    sky: "#a7a0a6",
  },
  {
    src: saltFlat,
    alt: "Pixel art: a turquoise lagoon on a salt flat below ochre mountains",
    x: "55%",
    sky: "#baafdd",
  },
  {
    src: caldera,
    alt: "Pixel art: a rust-red volcanic caldera below hazy mountains",
    x: "50%",
    sky: "#eed5b4",
  },
  {
    src: arete,
    alt: "Pixel art: a snow arête winding into the mist",
    x: "50%",
    sky: "#a0afc0",
  },
  {
    src: canyon,
    alt: "Pixel art: distant snowy peaks seen through the walls of a sandstone canyon",
    x: "55%",
    sky: "#847278",
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

/** The landscape of a project: its panel, else its own from MORE_VISTAS. None past the end of both lists. */
export function vistaOf(project: Project): Vista | undefined {
  return VISTAS[project.index] ?? MORE_VISTAS[project.index - VISTAS.length];
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
 * project's landscape, or its illustration. None for a pixel grid (the fallback when a project has no hi-res image).
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

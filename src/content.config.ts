import { defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { IMAGE_STYLES, PROJECT_STATUSES } from "./lib/constants";

/**
 * Content for every theme. Themes never read these collections directly:
 * they receive the resolved, typed data from `getPortfolio()` in src/lib/portfolio.ts.
 */

const projects = defineCollection({
  // Files starting with "_" are ignored, so a project can be drafted without showing up anywhere.
  loader: glob({ base: "./src/content/projects", pattern: "**/[^_]*.md" }),
  schema: ({ image }) => {
    const art = z.object({
      src: image(),
      alt: z.string().min(1),
      caption: z.string().optional(),
      /** CSS `object-position`, e.g. "center 60%". */
      position: z.string().optional(),
      /** Crop factor for detail views (1 = whole image). */
      zoom: z.number().min(1).optional(),
    });

    return z.object({
      title: z.string().min(1),
      /** For tight layouts; falls back to `title`. */
      shortTitle: z.string().optional(),
      status: z.enum(PROJECT_STATUSES),
      start: z.number().int(),
      /** Last year, or "present" while the project is ongoing. Omit for single-year projects. */
      end: z.union([z.number().int(), z.literal("present")]).optional(),
      role: z.string().min(1),
      /** Display order, ascending. */
      order: z.number(),
      /** One line. Required; every other short text falls back to it. */
      summary: z.string().min(1),
      /** A few words, for index rows. Falls back to `summary`. */
      focus: z.string().optional(),
      /** Editorial standfirst, one sentence. Falls back to `summary`. */
      dek: z.string().optional(),
      images: z
        .object({
          photo: art.optional(),
          pixel: art.optional(),
          illustration: art.optional(),
          illustrationPixel: art.optional(),
        })
        .refine((images) => IMAGE_STYLES.some((style) => images[style]), {
          message: "A project needs at least one image (photo, pixel, illustration or illustrationPixel).",
        }),
      links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
      stack: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
      /** Deeper material: sub-projects or work streams inside this project. */
      highlights: z
        .array(
          z.object({
            title: z.string(),
            body: z.string(),
            result: z.string().optional(),
            stack: z.array(z.string()).default([]),
          }),
        )
        .default([]),
    });
  },
});

const sectionText = z.object({ intro: z.string().optional(), summary: z.string().optional() }).prefault({});

const profile = defineCollection({
  loader: file("src/content/profile.yaml"),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      handle: z.string(),
      location: z.object({ city: z.string(), country: z.string() }),
      roles: z.array(z.string()).min(1),
      current: z.object({
        title: z.string(),
        org: z.string(),
        orgDetail: z.string().optional(),
        href: z.url().optional(),
        since: z.number().int(),
        /** The headline result in this role, one sentence: "Our AI SDR went from $0 to $1M ARR in three months." */
        highlight: z.string().optional(),
        /** The project about this role (a file name in src/content/projects/), e.g. `topo`. */
        project: reference("projects").optional(),
      }),
      headline: z.string(),
      intro: z.string(),
      /** Alternate hero lines keyed by a short id describing the line (e.g. `night`). A theme asks for one by id and falls back to `headline`. */
      taglines: z.record(z.string(), z.string().min(1)).default({}),
      focusAreas: z.array(z.string()).default([]),
      about: z.object({
        short: z.string(),
        long: z.array(z.string()).min(1),
        facts: z.array(z.string()).default([]),
      }),
      numbers: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
      principles: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
      talks: z.array(z.object({ year: z.number().int().optional(), text: z.string() })).default([]),
      earlier: z
        .array(
          z.object({
            start: z.number().int(),
            end: z.number().int(),
            title: z.string(),
            text: z.string(),
          }),
        )
        .default([]),
      stack: z
        .array(z.object({ key: z.string(), label: z.string(), items: z.array(z.string()).min(1) }))
        .default([]),
      quote: z.object({ text: z.string(), context: z.string().optional() }).optional(),
      contact: z.object({
        email: z.email(),
        links: z.array(
          z.object({ label: z.string(), href: z.url(), kind: z.enum(["github", "linkedin", "x", "website"]) }),
        ),
      }),
      /**
       * Framing text for page sections, all optional: `intro` introduces the section, `summary` is a
       * one-line teaser (e.g. in navigation). `work` is about what was built in the current role.
       */
      sections: z
        .object({ work: sectionText, principles: sectionText, talks: sectionText, earlier: sectionText })
        .prefault({}),
      seo: z.object({ title: z.string(), description: z.string() }),
      heroImage: z.object({
        src: image(),
        alt: z.string(),
        credit: z.object({ artist: z.string(), title: z.string(), year: z.number().int() }).optional(),
      }),
    }),
});

/**
 * Shared landscape imagery (heroes, section breaks, backgrounds), with its alt text. One entry, keyed `art`:
 * groups of named images. Project-specific images (with crops and captions) live on each project instead.
 */
const art = defineCollection({
  loader: file("src/content/art.yaml"),
  schema: ({ image }) => {
    const artImage = z.object({
      src: image(),
      /** Empty for purely decorative layers. */
      alt: z.string(),
    });
    const group = z.record(z.string(), artImage);
    return z.object({
      /** Filmic landscape renders. */
      photo: group,
      /** True pixel grids: render with `image-rendering: pixelated`, never below their size. */
      pixel: group,
      /** Hi-res pixel-art illustrations. */
      illustration: group,
      /** Layered heroes: each a set of named layers, listed back to front. */
      hero: z.record(z.string(), group),
    });
  },
});

export const collections = { projects, profile, art };

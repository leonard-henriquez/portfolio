import { defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { EMPLOYMENT_TYPES, IMAGE_STYLES, PROJECT_STATUSES, WEIGHTS } from "./lib/constants";

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

/** "2020-08". */
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use "YYYY-MM", e.g. "2020-08" (quoted in YAML).');

/** How much a theme should make of an entry: `high` is what matters most, `low` can be compact. Never hides it. */
const weight = z.enum(WEIGHTS).default("medium");

const role = z
  .object({
    /** As the organization titled it: "Head of Engineering". */
    title: z.string().min(1),
    type: z.enum(EMPLOYMENT_TYPES),
    start: yearMonth,
    /** Last month in the role. Omit while the role is ongoing. */
    end: yearMonth.optional(),
    /** What the role was, one or two sentences. Facts only. */
    text: z.string().optional(),
    /** Notable results or facts, most important first: "Raised $5.5M in a public token sale…". */
    highlights: z.array(z.string()).default([]),
    skills: z.array(z.string()).default([]),
  })
  .refine((r) => !r.end || r.end >= r.start, { message: "A role cannot end before it starts." });

const experience = z.object({
  /** Current name: "Manda". */
  org: z.string().min(1),
  /** Shown after the name in parentheses: "YC W24". */
  detail: z.string().optional(),
  /** Name at the time, when it changed since: "Flatlooker". */
  formerly: z.string().optional(),
  href: z.url().optional(),
  /** "Paris, France". */
  location: z.string().optional(),
  /** What the organization is, one line. */
  summary: z.string().optional(),
  /** The project about this organization (a file name in src/content/projects/), e.g. `topo`. */
  project: reference("projects").optional(),
  weight,
  /** One per title held, in any order. */
  roles: z.array(role).min(1),
});

const education = z
  .object({
    school: z.string().min(1),
    /** The qualification or programme: "MSc", "Fullstack Developer". */
    degree: z.string().optional(),
    /** "Data Analytics and Artificial Intelligence". */
    field: z.string().optional(),
    start: z.number().int(),
    /** Last year. Omit when it is the same as `start`. */
    end: z.number().int().optional(),
    /** One short line: "W24 batch, with Topo." */
    note: z.string().optional(),
    href: z.url().optional(),
    weight,
  })
  .refine((e) => !e.end || e.end >= e.start, { message: "Education cannot end before it starts." });

const profile = defineCollection({
  loader: file("src/content/profile.yaml"),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      handle: z.string(),
      location: z.object({ city: z.string(), country: z.string() }),
      roles: z.array(z.string()).min(1),
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
      /**
       * Career, one entry per organization, in any order (getPortfolio() sorts it newest first). The organization
       * with an ongoing role (no `end`) is the current one: `profile.current` is derived from it.
       */
      experience: z.array(experience).min(1),
      education: z.array(education).default([]),
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
        .object({
          work: sectionText,
          principles: sectionText,
          talks: sectionText,
          experience: sectionText,
          education: sectionText,
        })
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

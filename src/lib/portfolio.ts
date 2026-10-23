import type { ImageMetadata } from "astro";
import { getCollection, render, type CollectionEntry } from "astro:content";
import { IMAGE_STYLES, PROJECT_ANCHOR_PREFIX, PROJECT_STATUSES } from "./constants";

/*
 * The one contract between content and themes.
 * Themes call `getPortfolio()` and render what it returns. They never call `getCollection`,
 * and they never need to handle a missing optional field: every fallback is resolved here.
 */

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ImageStyle = (typeof IMAGE_STYLES)[number];
/** The component returned by Astro's `render()`; use as `<project.Content />`. */
export type ContentComponent = Awaited<ReturnType<typeof render>>["Content"];

export { IMAGE_STYLES, PROJECT_STATUSES };

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  shipped: "Shipped",
  building: "Building",
  exploring: "Exploring",
  study: "Study",
};

export interface ProjectImage {
  src: ImageMetadata;
  alt: string;
  /** Short caption; falls back to the project title. */
  caption: string;
  /** CSS `object-position`; defaults to "center". Also a sensible `transform-origin` when zooming. */
  position: string;
  /** Crop factor for detail views; defaults to 1 (whole image). */
  zoom: number;
  /** The series the image really comes from. Differs from the requested style when a fallback was used. */
  style: ImageStyle;
  /**
   * True for tiny pixel grids (`pixel`, `illustrationPixel`): render with `image-rendering: pixelated`,
   * and keep them lossless — `<Image format="png">` or a plain `<img src={image.src.src}>` (Astro's default is lossy WebP).
   */
  pixelated: boolean;
}

export interface ProjectLink {
  label: string;
  href: string;
}

export interface ProjectHighlight {
  title: string;
  body: string;
  /** Measured outcome, e.g. "Merged PRs/month 80 → 318". */
  result?: string;
  stack: string[];
}

export interface Project {
  /** File name without extension, e.g. "durable-exec-s3". Stable; usable as a URL slug. */
  id: string;
  /**
   * Element id for the project's row, and its deep link (`/#project-durable-exec-s3`): "project-" + `id`, so a
   * project file named like a section ("about", "contact"…) never collides with a theme's section anchors.
   * Every theme uses it, so a deep link opens the project whatever the theme.
   */
  anchor: string;
  /** `id` + "/", for directory-listing layouts. */
  folder: string;
  /** 0-based position in display order. */
  index: number;
  /** 1-based position in display order. */
  number: number;
  /** `number` padded to 2 digits: "01". */
  no2: string;
  /** `number` padded to 3 digits: "001". */
  no3: string;

  title: string;
  /** For tight layouts. Falls back to `title`. */
  shortTitle: string;
  status: ProjectStatus;
  /** "Shipped", "Building", "Exploring" or "Study". */
  statusLabel: string;

  /** First year. Use for one-year "Year" columns. */
  start: number;
  /** Last year, "present", or undefined for single-year projects. */
  end?: number | "present";
  /** "2026", "2022–2024" or "2022–present". */
  period: string;
  role: string;

  /** One line. Always present. */
  summary: string;
  /** A few words for index rows. Falls back to `summary`. */
  focus: string;
  /** Editorial standfirst. Falls back to `summary`. */
  dek: string;
  /** Long description (Markdown body) as a component: `<project.Content />`. */
  Content: ContentComponent;
  /** Same long description as an HTML string, for `set:html`. Empty when there is no body. */
  html: string;
  /** Same long description as its Markdown source, for text outputs (see src/lib/markdown.ts). Empty when there is no body. */
  markdown: string;
  hasBody: boolean;

  /** Every series, always defined: the requested one, or the closest available one (see `style`). */
  image: Record<ImageStyle, ProjectImage>;

  links: ProjectLink[];
  stack: string[];
  tags: string[];
  /** Deeper material (e.g. Topo's work streams). Often empty. */
  highlights: ProjectHighlight[];
}

export type ProfileSection = "work" | "principles" | "talks" | "earlier";

export interface SectionText {
  /** A sentence or two introducing the section. */
  intro?: string;
  /** One-line teaser, e.g. next to a navigation link. Falls back to `intro`. */
  summary?: string;
}

export interface ProfileLink {
  label: string;
  href: string;
  kind: "github" | "linkedin" | "x" | "website";
}

export interface Profile {
  /** "Léonard Henriquez". */
  name: string;
  /** "Leonard Henriquez", for monospace/ASCII-only contexts. */
  nameAscii: string;
  firstName: string;
  /** "hqz". */
  handle: string;
  location: { city: string; country: string; /** "Paris, France". */ label: string };
  /** e.g. ["Founder", "Engineer"]. */
  roles: string[];
  current: {
    title: string;
    org: string;
    orgDetail?: string;
    href?: string;
    since: number;
    /** "Co-founder & CTO, Topo (YC W24)". */
    label: string;
    /** The headline result in this role, one sentence: "Our AI SDR went from $0 to $1M ARR in three months." */
    highlight?: string;
    /** The project about this role (e.g. the company's, with its `highlights`), when the profile names one. */
    project?: Project;
  };
  /** Default hero line. */
  headline: string;
  /** One-sentence introduction. */
  intro: string;
  /**
   * Alternate hero lines, keyed by a short id that describes the line (e.g. `night`). Any may be missing:
   * ask for one by id and fall back, `profile.taglines.night ?? profile.headline`. Never match on the wording.
   */
  taglines: Partial<Record<string, string>>;
  /** e.g. ["Durable execution", "Search", "Orchestration"]. */
  focusAreas: string[];
  about: {
    short: string;
    /** Paragraphs. */
    long: string[];
    /** Tiny standalone facts: "Coding since I was 12.", "Based in Paris." */
    facts: string[];
  };
  /** Key figures, e.g. { value: "10M+", label: "agent actions executed per month" }. */
  numbers: { value: string; label: string }[];
  /** Lessons from shipping agents, numbered in order. Every theme and the Markdown output show them. */
  principles: { title: string; body: string; number: number; no2: string }[];
  /** Talks, juries and recognition. */
  talks: { year?: number; text: string }[];
  /** Before Topo, most recent first. */
  earlier: { start: number; end: number; /** "2019–2022". */ period: string; /** "2019–22". */ periodShort: string; title: string; text: string }[];
  stack: { key: string; label: string; items: string[] }[];
  /** All stack items, flattened, in order. */
  stackItems: string[];
  quote?: { text: string; context?: string };
  contact: {
    email: string;
    /** "mailto:…". */
    mailto: string;
    /** Social links (no email). */
    links: ProfileLink[];
  };
  /**
   * Framing text for page sections; `work` is about what was built in the current role
   * (e.g. the current company's `highlights`). Use it when a layout introduces these sections.
   */
  sections: Record<ProfileSection, SectionText>;
  seo: { title: string; description: string };
  heroImage: {
    src: ImageMetadata;
    alt: string;
    credit?: { artist: string; title: string; year: number };
  };
}

/** A shared landscape image with its alt text (empty for purely decorative layers). */
export interface ArtImage {
  src: ImageMetadata;
  alt: string;
}

/**
 * Shared landscape imagery from src/content/art.yaml, by group then name, e.g. `art.photo.night`.
 * Keys are content: check the YAML for what exists.
 */
export interface Art {
  /** Filmic landscape renders, 1800×1100 JPG. */
  photo: Record<string, ArtImage>;
  /** True pixel grids (PNG): render with `image-rendering: pixelated`, never below their size. */
  pixel: Record<string, ArtImage>;
  /** Pixel-art illustrations, 1536×1024 JPG. */
  illustration: Record<string, ArtImage>;
  /** Layered heroes: each a set of named layers, back to front (e.g. `art.hero.lake.foreground`). */
  hero: Record<string, Record<string, ArtImage>>;
}

export interface Portfolio {
  profile: Profile;
  /** Sorted by display order. */
  projects: Project[];
  /** Number of projects per status (every status present, possibly 0). */
  statusCounts: Record<ProjectStatus, number>;
  /** Years covered by the projects; "present" counts as the build year. */
  span: { start: number; end: number; /** "2022–2026". */ label: string };
  /** Shared landscape imagery for heroes and section breaks (src/content/art.yaml). */
  art: Art;
}

/* Closest substitute for each style: same medium (hi-res vs pixel grid) first, then the other. */
const IMAGE_FALLBACKS: Record<ImageStyle, ImageStyle[]> = {
  photo: ["photo", "illustration", "pixel", "illustrationPixel"],
  illustration: ["illustration", "photo", "illustrationPixel", "pixel"],
  pixel: ["pixel", "illustrationPixel", "photo", "illustration"],
  illustrationPixel: ["illustrationPixel", "pixel", "illustration", "photo"],
};

const PIXELATED: Record<ImageStyle, boolean> = {
  photo: false,
  illustration: false,
  pixel: true,
  illustrationPixel: true,
};

export function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

const stripAccents = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "");

function period(start: number, end?: number | "present"): string {
  if (end === "present") return `${start}–present`;
  if (end !== undefined && end !== start) return `${start}–${end}`;
  return String(start);
}

async function resolveProject(entry: CollectionEntry<"projects">, index: number): Promise<Project> {
  const d = entry.data;
  const { Content } = await render(entry);
  const html = entry.rendered?.html ?? "";

  const images: Partial<Record<ImageStyle, ProjectImage>> = {};
  for (const style of IMAGE_STYLES) {
    const img = d.images[style];
    if (!img) continue;
    images[style] = {
      src: img.src,
      alt: img.alt,
      caption: img.caption ?? d.title,
      position: img.position ?? "center",
      zoom: img.zoom ?? 1,
      style,
      pixelated: PIXELATED[style],
    };
  }

  const image = Object.fromEntries(
    IMAGE_STYLES.map((style) => {
      const found = IMAGE_FALLBACKS[style].map((s) => images[s]).find(Boolean);
      // The schema guarantees at least one image, so `found` is always defined.
      return [style, found!];
    }),
  ) as Record<ImageStyle, ProjectImage>;

  const number = index + 1;
  return {
    id: entry.id,
    anchor: `${PROJECT_ANCHOR_PREFIX}${entry.id}`,
    folder: `${entry.id}/`,
    index,
    number,
    no2: pad(number, 2),
    no3: pad(number, 3),
    title: d.title,
    shortTitle: d.shortTitle ?? d.title,
    status: d.status,
    statusLabel: STATUS_LABELS[d.status],
    start: d.start,
    end: d.end,
    period: period(d.start, d.end),
    role: d.role,
    summary: d.summary,
    focus: d.focus ?? d.summary,
    dek: d.dek ?? d.summary,
    Content,
    html,
    markdown: entry.body?.trim() ?? "",
    hasBody: html.trim().length > 0,
    image,
    links: d.links,
    stack: d.stack,
    tags: d.tags,
    highlights: d.highlights,
  };
}

function resolveProfile(entry: CollectionEntry<"profile">, projects: Project[]): Profile {
  const d = entry.data;
  const { project: projectRef, ...current } = d.current;
  const project = projectRef && projects.find((p) => p.id === projectRef.id);
  if (projectRef && !project) {
    throw new Error(
      `src/content/profile.yaml: current.project "${projectRef.id}" is not a project (no src/content/projects/${projectRef.id}.md).`,
    );
  }

  return {
    name: d.name,
    nameAscii: stripAccents(d.name),
    firstName: d.name.split(/\s+/)[0],
    handle: d.handle,
    location: { ...d.location, label: `${d.location.city}, ${d.location.country}` },
    roles: d.roles,
    current: {
      ...current,
      label: `${current.title}, ${current.org}${current.orgDetail ? ` (${current.orgDetail})` : ""}`,
      project,
    },
    headline: d.headline,
    intro: d.intro,
    taglines: d.taglines,
    focusAreas: d.focusAreas,
    about: d.about,
    numbers: d.numbers,
    principles: d.principles.map((p, i) => ({ ...p, number: i + 1, no2: pad(i + 1, 2) })),
    talks: d.talks,
    earlier: d.earlier.map((e) => ({
      ...e,
      period: `${e.start}–${e.end}`,
      periodShort: `${e.start}–${String(e.end).slice(-2)}`,
    })),
    stack: d.stack,
    stackItems: d.stack.flatMap((g) => g.items),
    quote: d.quote,
    contact: { ...d.contact, mailto: `mailto:${d.contact.email}` },
    sections: Object.fromEntries(
      Object.entries(d.sections).map(([key, text]) => [key, { ...text, summary: text.summary ?? text.intro }]),
    ) as Record<ProfileSection, SectionText>,
    seo: d.seo,
    heroImage: d.heroImage,
  };
}

/** The one entry of a single-entry data file (profile.yaml, art.yaml). */
async function single<C extends "profile" | "art">(collection: C, file: string): Promise<CollectionEntry<C>> {
  const entries = await getCollection(collection);
  if (entries.length !== 1) {
    throw new Error(`${file} must define exactly one entry, found ${entries.length}.`);
  }
  return entries[0];
}

async function loadPortfolio(): Promise<Portfolio> {
  const profile = await single("profile", "src/content/profile.yaml");
  const art = await single("art", "src/content/art.yaml");

  const entries = (await getCollection("projects")).sort(
    (a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title),
  );
  const projects = await Promise.all(entries.map(resolveProject));

  const statusCounts = Object.fromEntries(PROJECT_STATUSES.map((s) => [s, 0])) as Record<ProjectStatus, number>;
  for (const p of projects) statusCounts[p.status]++;

  const buildYear = new Date().getFullYear();
  const starts = projects.map((p) => p.start);
  const ends = projects.map((p) => (p.end === "present" ? buildYear : (p.end ?? p.start)));
  const spanStart = starts.length ? Math.min(...starts) : buildYear;
  const spanEnd = ends.length ? Math.max(...ends) : buildYear;

  return {
    profile: resolveProfile(profile, projects),
    projects,
    statusCounts,
    span: { start: spanStart, end: spanEnd, label: period(spanStart, spanEnd) },
    art: art.data,
  };
}

let cached: Promise<Portfolio> | undefined;

/** All site content, resolved and typed. Cached for the duration of a build (not in dev, so edits show up). */
export function getPortfolio(): Promise<Portfolio> {
  if (import.meta.env.DEV) return loadPortfolio();
  cached ??= loadPortfolio();
  return cached;
}

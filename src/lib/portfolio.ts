import type { ImageMetadata } from "astro";
import { getCollection, render, type CollectionEntry } from "astro:content";
import { EMPLOYMENT_TYPES, IMAGE_STYLES, PROJECT_ANCHOR_PREFIX, PROJECT_STATUSES } from "./constants";

/*
 * The one contract between content and themes.
 * Themes call `getPortfolio()` and render what it returns. They never call `getCollection`,
 * and they never need to handle a missing optional field: every fallback is resolved here.
 */

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ImageStyle = (typeof IMAGE_STYLES)[number];
/** The component returned by Astro's `render()`; use as `<project.Content />`. */
export type ContentComponent = Awaited<ReturnType<typeof render>>["Content"];

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export { EMPLOYMENT_TYPES, IMAGE_STYLES, PROJECT_STATUSES };

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  shipped: "Shipped",
  building: "Building",
  exploring: "Exploring",
  study: "Study",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  permanent: "Permanent",
  "full-time": "Full-time",
  "part-time": "Part-time",
  freelance: "Freelance",
  contract: "Contract",
  internship: "Internship",
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

/** A month, e.g. August 2020. */
export interface YearMonth {
  year: number;
  /** 1–12. */
  month: number;
  /** "2020-08", for `<time datetime>`. */
  iso: string;
  /** "Aug 2020". */
  label: string;
}

/** One title held at an organization. */
export interface ExperienceRole {
  title: string;
  type: EmploymentType;
  /** "Permanent", "Freelance", "Internship", "Part-time"… */
  typeLabel: string;
  start: YearMonth;
  /** Last month in the role; undefined while it is ongoing. */
  end?: YearMonth;
  /** True while the role is ongoing. */
  current: boolean;
  /** "Aug 2020 – Aug 2022" or "Aug 2022 – present". */
  period: string;
  /** "2020–2022", "2022–present", or "2015" within one year. */
  years: string;
  /** Inclusive length, LinkedIn style: "2 yrs 1 mo", "11 mos". Ongoing roles count up to the build month. */
  duration: string;
  /** One or two sentences. Empty when the content has none. */
  text: string;
  /** Notable results or facts, most important first. Often empty. */
  highlights: string[];
  skills: string[];
}

/** One organization in the career, with every title held there (newest first). */
export interface Experience {
  /** Slug of the organization, e.g. "btu-protocol". Stable; usable as a key. */
  id: string;
  /** Element id for the entry, `experience-<id>`, so themes deep-link to it the same way. */
  anchor: string;
  /** 0-based position, newest first. */
  index: number;
  /** Current name: "Manda". */
  org: string;
  /** "YC W24". */
  detail?: string;
  /** Name at the time, when it changed since: "Flatlooker". */
  formerly?: string;
  /** Name with its detail: "Topo (YC W24)", "Manda". */
  label: string;
  /** `label`, plus the former name: "Manda (formerly Flatlooker)". Use where there is room for one name only. */
  fullLabel: string;
  href?: string;
  /** "Paris, France". */
  location?: string;
  /**
   * Secondary facts about the organization, for one secondary line: `detail`, "Formerly <name>", `location`,
   * in that order (e.g. ["YC W24"], ["Formerly Flatlooker"], ["Paris, France"]). Often empty.
   */
  details: string[];
  /** What the organization is, one line. Empty when the content has none. */
  summary: string;
  /** The project about this organization, with its own page and highlights, when the content names one. */
  project?: Project;
  /** Newest first. Never empty. */
  roles: ExperienceRole[];
  /** More than one title held: themes nest the roles under the organization. */
  multiRole: boolean;
  /** True while one of its roles is ongoing. */
  current: boolean;
  /** First month of the earliest role. */
  start: YearMonth;
  /** Last month of the latest role; undefined while current. */
  end?: YearMonth;
  /** Whole span, e.g. "Sep 2019 – Aug 2022". */
  period: string;
  /** "2019–2022", "2022–present". */
  years: string;
  /** Whole span, inclusive: "3 yrs". */
  duration: string;
  /** Distinct employment types across roles, newest first: ["Freelance", "Internship"]. */
  types: string[];
  /** Every role's skills, deduplicated, in order. */
  skills: string[];
}

export interface Education {
  /** Slug of the school, e.g. "edhec-business-school". */
  id: string;
  /** Element id for the entry, `education-<id>`. */
  anchor: string;
  /** 0-based position, newest first. */
  index: number;
  school: string;
  /** One line: "MSc, Data Analytics and Artificial Intelligence". */
  program: string;
  start: number;
  /** Last year; equal to `start` for single-year entries. */
  end: number;
  /** "2015–2019", or "2018" within one year. */
  years: string;
  href?: string;
}

export type ProfileSection = "work" | "principles" | "talks" | "experience" | "education";

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
  /** Derived from the experience entry with an ongoing role: never set apart from `experience`. */
  current: {
    title: string;
    org: string;
    orgDetail?: string;
    href?: string;
    /** Year the current role started. */
    since: number;
    /** "Co-founder & CTO, Topo (YC W24)". */
    label: string;
    /** The headline result in this role, one sentence (the role's first highlight): "Our AI SDR went from $0 to $1M ARR in three months." */
    highlight?: string;
    /** The project about this role (e.g. the company's, with its `highlights`), when the experience entry names one. */
    project?: Project;
    /** The experience entry it comes from (also first in `experience`). */
    experience: Experience;
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
  /** Career, one entry per organization, newest first (the current one first). Roles nested, newest first. */
  experience: Experience[];
  /** Newest first (by last year, then first year). */
  education: Education[];
  stack: { key: string; label: string; items: string[] }[];
  /** All stack items, flattened, in order. */
  stackItems: string[];
  quote?: { text: string; context?: string };
  contact: {
    /** A sentence inviting people to get in touch. */
    intro?: string;
    /** The one channel to put forward (LinkedIn); also listed in `links`. The site shows no email address. */
    preferred: ProfileLink;
    /** Social links. */
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Course Croisière EDHEC" → "course-croisiere-edhec". */
function slug(s: string): string {
  return stripAccents(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function yearMonth(iso: string): YearMonth {
  const [year, month] = iso.split("-").map(Number);
  return { year, month, iso, label: `${MONTHS[month - 1]} ${year}` };
}

/** Months as a sortable number. */
const monthIndex = (m: YearMonth) => m.year * 12 + m.month - 1;

/** Inclusive span, LinkedIn style: "4 yrs 3 mos", "1 yr", "11 mos", "1 mo". Ongoing spans run to `now`. */
function duration(start: YearMonth, end: YearMonth): string {
  const months = monthIndex(end) - monthIndex(start) + 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [
    years > 0 && `${years} ${years === 1 ? "yr" : "yrs"}`,
    rest > 0 && `${rest} ${rest === 1 ? "mo" : "mos"}`,
  ];
  return parts.filter(Boolean).join(" ");
}

function monthSpan(start: YearMonth, end: YearMonth | undefined, now: YearMonth) {
  return {
    period: `${start.label} – ${end ? end.label : "present"}`,
    years: period(start.year, end ? end.year : "present"),
    duration: duration(start, end ?? now),
  };
}

function resolveExperience(
  entries: CollectionEntry<"profile">["data"]["experience"],
  projects: Project[],
  now: YearMonth,
): Experience[] {
  const resolved = entries.map((e) => {
    const roles: ExperienceRole[] = e.roles
      .map((r) => {
        const start = yearMonth(r.start);
        const end = r.end ? yearMonth(r.end) : undefined;
        return {
          title: r.title,
          type: r.type,
          typeLabel: EMPLOYMENT_TYPE_LABELS[r.type],
          start,
          end,
          current: !end,
          ...monthSpan(start, end, now),
          text: r.text ?? "",
          highlights: r.highlights,
          skills: r.skills,
        };
      })
      .sort((a, b) => monthIndex(b.end ?? now) - monthIndex(a.end ?? now) || monthIndex(b.start) - monthIndex(a.start));

    const project = e.project && projects.find((p) => p.id === e.project!.id);
    if (e.project && !project) {
      throw new Error(
        `src/content/profile.yaml: experience "${e.org}" names project "${e.project.id}", which does not exist (no src/content/projects/${e.project.id}.md).`,
      );
    }

    const current = roles.some((r) => r.current);
    const start = roles.reduce((min, r) => (monthIndex(r.start) < monthIndex(min) ? r.start : min), roles[0].start);
    const end = current ? undefined : roles[0].end;
    const label = e.detail ? `${e.org} (${e.detail})` : e.org;
    const id = slug(e.org);

    return {
      id,
      anchor: `experience-${id}`,
      index: 0,
      org: e.org,
      detail: e.detail,
      formerly: e.formerly,
      label,
      fullLabel: e.formerly ? `${e.org} (${e.detail ? `${e.detail}, ` : ""}formerly ${e.formerly})` : label,
      href: e.href,
      location: e.location,
      details: [e.detail, e.formerly && `Formerly ${e.formerly}`, e.location].filter((d): d is string => Boolean(d)),
      summary: e.summary ?? "",
      project,
      roles,
      multiRole: roles.length > 1,
      current,
      start,
      end,
      ...monthSpan(start, end, now),
      types: [...new Set(roles.map((r) => r.typeLabel))],
      skills: [...new Set(roles.flatMap((r) => r.skills))],
    } satisfies Experience;
  });

  return resolved
    .sort((a, b) => monthIndex(b.end ?? now) - monthIndex(a.end ?? now) || monthIndex(b.start) - monthIndex(a.start))
    .map((e, index) => ({ ...e, index }));
}

function resolveEducation(entries: CollectionEntry<"profile">["data"]["education"]): Education[] {
  return entries
    .map((e) => {
      const end = e.end ?? e.start;
      const id = slug(e.school);
      return {
        id,
        anchor: `education-${id}`,
        index: 0,
        school: e.school,
        program: e.program,
        start: e.start,
        end,
        years: period(e.start, end),
        href: e.href,
      } satisfies Education;
    })
    .sort((a, b) => b.end - a.end || b.start - a.start)
    .map((e, index) => ({ ...e, index }));
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
  const today = new Date();
  const now = yearMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
  const experience = resolveExperience(d.experience, projects, now);

  // The current role is the ongoing one; its organization sorts first.
  const company = experience[0];
  const role = company.roles[0];
  if (!role.current) {
    throw new Error("src/content/profile.yaml: no ongoing role in `experience` (a role without `end`), so there is no current role.");
  }

  return {
    name: d.name,
    nameAscii: stripAccents(d.name),
    firstName: d.name.split(/\s+/)[0],
    handle: d.handle,
    location: { ...d.location, label: `${d.location.city}, ${d.location.country}` },
    roles: d.roles,
    current: {
      title: role.title,
      org: company.org,
      orgDetail: company.detail,
      href: company.href,
      since: role.start.year,
      label: `${role.title}, ${company.label}`,
      highlight: role.highlights[0],
      project: company.project,
      experience: company,
    },
    headline: d.headline,
    intro: d.intro,
    taglines: d.taglines,
    focusAreas: d.focusAreas,
    about: d.about,
    numbers: d.numbers,
    principles: d.principles.map((p, i) => ({ ...p, number: i + 1, no2: pad(i + 1, 2) })),
    talks: d.talks,
    experience,
    education: resolveEducation(d.education),
    stack: d.stack,
    stackItems: d.stack.flatMap((g) => g.items),
    quote: d.quote,
    contact: {
      intro: d.contact.intro,
      // The schema guarantees a link of this kind.
      preferred: d.contact.links.find((l) => l.kind === d.contact.preferred)!,
      links: d.contact.links,
    },
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

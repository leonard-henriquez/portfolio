import type { Portfolio, Profile, Project } from "./portfolio";

/*
 * The site as Markdown, for LLMs and agents (served by src/pages/llms.txt.ts, index.md.ts, llms-full.txt.ts
 * and projects/[slug].md.ts). Like a theme, it only reads `getPortfolio()`: content lives in src/content/, never here.
 * It keeps the substance (facts, figures, projects, links) and drops what is only presentation (images, numbering,
 * alternate taglines). Every URL is absolute, because these files are often read out of context.
 */

/** URLs of the Markdown documents, relative to the site root. */
export const MARKDOWN_PATHS = {
  index: "/llms.txt",
  full: "/index.md",
  fullTxt: "/llms-full.txt",
  project: (project: Project) => `/projects/${project.id}.md`,
};

const url = (path: string, site: URL) => new URL(path, site).href;
const link = (label: string, href: string) => `[${label}](${href})`;
/** A bullet list; falsy items are skipped. */
const list = (items: (string | false | undefined)[]) =>
  items.filter((item): item is string => Boolean(item)).map((item) => `- ${item}`).join("\n");
const today = () => new Date().toISOString().slice(0, 10);

/** Joins blocks with blank lines, skipping empty ones. */
function blocks(...parts: (string | false | undefined)[]): string {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join("\n\n");
}

/** Shifts the headings of a Markdown body down by `levels` (outside code fences), so it nests under ours. */
function demoteHeadings(markdown: string, levels: number): string {
  let fence: string | undefined;
  return markdown
    .split("\n")
    .map((line) => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1];
      if (marker && (!fence || marker.startsWith(fence))) {
        fence = fence ? undefined : marker;
        return line;
      }
      if (fence) return line;
      return line.replace(/^(#{1,6})(?=\s)/, (hashes) => "#".repeat(Math.min(6, hashes.length + levels)));
    })
    .join("\n");
}

function contactLines(profile: Profile, site: URL): string[] {
  return [
    `Email: ${profile.contact.email}`,
    ...profile.contact.links.map((l) => `${l.label}: ${l.href}`),
    `Website: ${url("/", site)}`,
  ];
}

function header(profile: Profile, site: URL): string {
  const { current } = profile;
  return blocks(
    `# ${profile.name}`,
    `> ${profile.seo.description}`,
    list([
      `Current role: ${current.label}, since ${current.since}${current.href ? ` (${current.href})` : ""}`,
      current.highlight && `Highlight: ${current.highlight}`,
      `Location: ${profile.location.label}`,
      `Focus: ${profile.focusAreas.join(", ")}`,
      ...contactLines(profile, site),
    ]),
  );
}

/** One project, its heading at `level`, with an optional line under the title. */
function renderProject(project: Project, level: number, byline?: string): string {
  const h = "#".repeat(level);
  const facts = list([
    `Status: ${project.statusLabel}`,
    `Period: ${project.period}`,
    `Role: ${project.role}`,
    project.stack.length > 0 && `Stack: ${project.stack.join(", ")}`,
    project.tags.length > 0 && `Tags: ${project.tags.join(", ")}`,
    project.links.length > 0 && `Links: ${project.links.map((l) => link(l.label, l.href)).join(", ")}`,
  ]);

  const highlights = project.highlights.map((item) =>
    blocks(
      `${h}# ${item.title}`,
      item.body,
      list([item.result && `Result: ${item.result}`, item.stack.length > 0 && `Stack: ${item.stack.join(", ")}`]),
    ),
  );

  return blocks(
    `${h} ${project.title}`,
    byline,
    `> ${project.dek}`,
    facts,
    project.hasBody ? demoteHeadings(project.markdown, level) : project.summary,
    ...highlights,
  );
}

/** One project on its own: `/projects/<id>.md`. Says whose project it is, since it is often read alone. */
export function renderProjectPage(portfolio: Portfolio, project: Project, site: URL): string {
  const { profile } = portfolio;
  const byline = `A project by ${profile.name} (${profile.current.label}). Full profile: ${url(MARKDOWN_PATHS.full, site)}`;
  return renderProject(project, 1, byline) + "\n";
}

/** The whole site in one document: `/index.md` and `/llms-full.txt`. */
export function renderPortfolio(portfolio: Portfolio, site: URL): string {
  const { profile, projects } = portfolio;
  const { sections } = profile;

  const about = blocks(
    "## About",
    ...profile.about.long,
    profile.quote && `> “${profile.quote.text}”${profile.quote.context ? ` (${profile.quote.context})` : ""}`,
  );

  const figures =
    profile.numbers.length > 0 &&
    blocks("## Key figures", list(profile.numbers.map((n) => `**${n.value}**: ${n.label}`)));

  const work = blocks(
    "## Projects",
    `${projects.length} projects, ${portfolio.span.label}. Each one also has its own file, listed in ${url(MARKDOWN_PATHS.index, site)}.`,
    ...projects.map((project) => renderProject(project, 3)),
  );

  const principles =
    profile.principles.length > 0 &&
    blocks(
      "## Principles",
      sections.principles.intro,
      ...profile.principles.map((p) => blocks(`### ${p.number}. ${p.title}`, p.body)),
    );

  const talks =
    profile.talks.length > 0 &&
    blocks(
      "## Talks and recognition",
      list(profile.talks.map((t) => (t.year ? `${t.year}: ${t.text}` : t.text))),
    );

  const earlier =
    profile.earlier.length > 0 &&
    blocks(
      "## Earlier experience",
      sections.earlier.intro,
      list(profile.earlier.map((e) => `**${e.period}, ${e.title}**: ${e.text}`)),
    );

  const stack =
    profile.stack.length > 0 &&
    blocks("## Stack", list(profile.stack.map((group) => `**${group.label}**: ${group.items.join(", ")}`)));

  return (
    blocks(
      header(profile, site),
      about,
      figures,
      work,
      principles,
      talks,
      earlier,
      stack,
      `---\n\nSource: ${url("/", site)} · Generated ${today()}`,
    ) + "\n"
  );
}

/** The entry point for LLMs (https://llmstxt.org): who this is, and where the full content is. */
export function renderLlmsTxt(portfolio: Portfolio, site: URL): string {
  const { profile, projects } = portfolio;

  return (
    blocks(
      `# ${profile.name}`,
      `> ${profile.seo.description}`,
      profile.about.short,
      blocks(
        "## Profile",
        list([
          `${link("Full profile", url(MARKDOWN_PATHS.full, site))}: about, key figures, every project, principles, talks, background, stack and contact, in one Markdown file (same content as ${url(MARKDOWN_PATHS.fullTxt, site)}).`,
          `${link("Website", url("/", site))}: the HTML version.`,
        ]),
      ),
      blocks(
        "## Projects",
        list(projects.map((p) => `${link(p.title, url(MARKDOWN_PATHS.project(p), site))}: ${p.summary} (${p.statusLabel}, ${p.period})`)),
      ),
      blocks("## Contact", list(contactLines(profile, site))),
    ) + "\n"
  );
}

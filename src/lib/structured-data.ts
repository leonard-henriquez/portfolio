import { MARKDOWN_PATHS } from "./markdown";
import type { Portfolio, Project } from "./portfolio";

/*
 * schema.org data for the page's <head> (src/layouts/Site.astro): a `ProfilePage` about a `Person` on the home page,
 * a `WebPage` about a `CreativeWork` by that person on a project's page. Built from `getPortfolio()` like everything
 * else. Search engines and some agents read it instead of the markup.
 */

// `undefined` fields are dropped by JSON.stringify; "<" is escaped so no string can close the <script>.
const serialize = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

/** The page as JSON-LD, ready for `<script type="application/ld+json">`. */
export function profilePageJsonLd({ profile }: Portfolio, site: URL): string {
  const url = (path: string) => new URL(path, site).href;
  const { current } = profile;

  const person = {
    "@type": "Person",
    "@id": url("/#person"),
    name: profile.name,
    alternateName: profile.nameAscii !== profile.name ? profile.nameAscii : undefined,
    url: url("/"),
    description: profile.intro,
    jobTitle: current.title,
    worksFor: { "@type": "Organization", name: current.org, url: current.href },
    address: { "@type": "PostalAddress", addressLocality: profile.location.city, addressCountry: profile.location.country },
    knowsAbout: profile.focusAreas,
    sameAs: profile.contact.links.map((l) => l.href),
  };

  const page = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: url("/"),
    name: profile.seo.title,
    description: profile.seo.description,
    mainEntity: person,
    // The same content as Markdown (src/lib/markdown.ts).
    encoding: { "@type": "MediaObject", contentUrl: url(MARKDOWN_PATHS.full), encodingFormat: "text/markdown" },
  };

  return serialize(page);
}

/** A project's page (`/projects/<id>/`) as JSON-LD. The person is the one described in full on the home page. */
export function projectPageJsonLd({ profile }: Portfolio, project: Project, site: URL): string {
  const url = (path: string) => new URL(path, site).href;

  const page = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: url(project.href),
    name: `${project.title} · ${profile.name}`,
    description: project.summary,
    isPartOf: { "@type": "WebSite", url: url("/"), name: profile.seo.title },
    mainEntity: {
      "@type": "CreativeWork",
      name: project.title,
      description: project.dek,
      creator: { "@type": "Person", "@id": url("/#person"), name: profile.name, url: url("/") },
      dateCreated: String(project.start),
      keywords: [...project.stack, ...project.tags].join(", ") || undefined,
      sameAs: project.links.length > 0 ? project.links.map((l) => l.href) : undefined,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: profile.name, item: url("/") },
        { "@type": "ListItem", position: 2, name: project.title, item: url(project.href) },
      ],
    },
    encoding: { "@type": "MediaObject", contentUrl: url(MARKDOWN_PATHS.project(project)), encodingFormat: "text/markdown" },
  };

  return serialize(page);
}

import { MARKDOWN_PATHS } from "./markdown";
import type { Portfolio } from "./portfolio";

/*
 * schema.org data for the page's <head> (src/layouts/Site.astro): a `ProfilePage` about a `Person`, built from
 * `getPortfolio()` like everything else. Search engines and some agents read it instead of the markup.
 */

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
    alumniOf: profile.education.map((e) => ({ "@type": "Organization", name: e.school, url: e.href })),
    knowsAbout: [...profile.focusAreas, ...profile.stackItems],
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

  // `undefined` fields are dropped by JSON.stringify; "<" is escaped so no string can close the <script>.
  return JSON.stringify(page).replace(/</g, "\\u003c");
}

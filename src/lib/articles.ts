import { getCollection, render } from "astro:content";

async function loadArticles() {
  const entries = await getCollection("articles");
  return Promise.all(entries.map(async (entry) => {
    const { Content, headings } = await render(entry);
    const markdown = `# ${entry.data.title}\n\n${entry.body ?? ""}`;
    return {
      ...entry.data,
      id: entry.id,
      href: `/articles/${entry.id}/`,
      markdownPath: `/articles/${entry.id}.md`,
      minutes: Math.ceil(markdown.split(/\s+/).length / 220),
      Content,
      headings: headings.filter((h) => h.depth === 2 && h.slug !== "footnote-label"),
      markdown,
    };
  }));
}

export type Article = Awaited<ReturnType<typeof loadArticles>>[number];
let articles: ReturnType<typeof loadArticles> | undefined;
export const getArticles = () => articles ??= loadArticles();

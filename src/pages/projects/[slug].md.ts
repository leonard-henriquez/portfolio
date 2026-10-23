import type { APIRoute, GetStaticPaths } from "astro";
import { renderProjectPage } from "../../lib/markdown";
import { getPortfolio, type Project } from "../../lib/portfolio";

/** `/projects/<id>.md`: one project as Markdown, linked from `/llms.txt` (see src/lib/markdown.ts). */
export const getStaticPaths = (async () => {
  const { projects } = await getPortfolio();
  return projects.map((project) => ({ params: { slug: project.id }, props: { project } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ project: Project }> = async ({ props, site }) =>
  new Response(renderProjectPage(await getPortfolio(), props.project, site!), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });

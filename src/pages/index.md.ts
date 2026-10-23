import type { APIRoute } from "astro";
import { renderPortfolio } from "../lib/markdown";
import { getPortfolio } from "../lib/portfolio";

/** `/index.md`: the whole site as one Markdown document (see src/lib/markdown.ts). */
export const GET: APIRoute = async ({ site }) =>
  new Response(renderPortfolio(await getPortfolio(), site!), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });

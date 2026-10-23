import type { APIRoute } from "astro";
import { renderPortfolio } from "../lib/markdown";
import { getPortfolio } from "../lib/portfolio";

/** `/llms-full.txt`: same document as `/index.md`, at the URL the llms.txt convention expects. */
export const GET: APIRoute = async ({ site }) =>
  new Response(renderPortfolio(await getPortfolio(), site!), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });

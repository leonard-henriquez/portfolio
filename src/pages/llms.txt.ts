import type { APIRoute } from "astro";
import { renderLlmsTxt } from "../lib/markdown";
import { getPortfolio } from "../lib/portfolio";

/** `/llms.txt`: the entry point for LLMs (see src/lib/markdown.ts). */
export const GET: APIRoute = async ({ site }) =>
  new Response(renderLlmsTxt(await getPortfolio(), site!), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });

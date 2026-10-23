import type { APIRoute } from "astro";
import { MARKDOWN_PATHS } from "../lib/markdown";

/** `/robots.txt`: everything may be crawled, and agents are pointed to the Markdown version (src/lib/markdown.ts). */
export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const body = [
    "# The same content as Markdown, for LLMs and AI agents:",
    `#   ${url(MARKDOWN_PATHS.index)}  (index, llmstxt.org)`,
    `#   ${url(MARKDOWN_PATHS.full)}  (everything in one document; also ${url(MARKDOWN_PATHS.fullTxt)})`,
    "",
    "User-agent: *",
    "Allow: /",
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};

import type { APIRoute, GetStaticPaths } from "astro";
import { getArticles, type Article } from "../../lib/articles";

export const getStaticPaths = (async () => (await getArticles()).map((article) => ({
  params: { slug: article.id }, props: { article },
}))) satisfies GetStaticPaths;

export const GET: APIRoute<{ article: Article }> = ({ props }) =>
  new Response(props.article.markdown, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });

import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://hqz.me",
  // Code blocks in project articles stay plain <pre><code>: each theme styles them (no inline colours to fight).
  markdown: { syntaxHighlight: false },
});

import type { ThemeMeta } from "../types";

export default {
  name: "Raw",
  order: 1,
  themeColor: { light: "#eef1f3", dark: "#16191b" },
  colorScheme: "light dark",
  // Its own light/dark choice, before paint so the stored or system scheme never flashes.
  boot: (root) => {
    let scheme: string | null = null;
    try {
      scheme = localStorage.getItem("raw-scheme");
      // The original single-theme site stored it as `theme`: carry it over once, then drop the old key.
      // (Only a light/dark value is touched; the site's theme choice lives under `site-theme`.)
      const legacy = localStorage.getItem("theme");
      if (legacy === "light" || legacy === "dark") {
        if (scheme !== "light" && scheme !== "dark") {
          scheme = legacy;
          localStorage.setItem("raw-scheme", legacy);
        }
        localStorage.removeItem("theme");
      }
    } catch {}
    if (scheme !== "light" && scheme !== "dark") {
      scheme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    root.dataset.rawScheme = scheme;
  },
} satisfies ThemeMeta;

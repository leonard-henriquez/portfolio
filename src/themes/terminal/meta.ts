import monoUrl from "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url";
import serifItalicUrl from "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2?url";
import type { ThemeMeta } from "../types";
import { heroImage } from "./hero";

export default {
  name: "Terminal",
  order: 3,
  themeColor: "#0B0C0E",
  colorScheme: "dark",
  preload: [
    { href: monoUrl, as: "font", type: "font/woff2" },
    { href: serifItalicUrl, as: "font", type: "font/woff2" },
  ],
  heroImage,
  ogImage: (portfolio) => heroImage(portfolio).src,
  boot: (root) => {
    root.classList.add("tm-js");
  },
} satisfies ThemeMeta;

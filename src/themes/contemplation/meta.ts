import groteskLatin from "@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url";
import monoLatin from "@fontsource/space-mono/files/space-mono-latin-400-normal.woff2?url";
import type { ThemeMeta } from "../types";
import { heroImage } from "./vista";

export default {
  name: "Contemplation",
  order: 0,
  themeColor: "#eae8e3",
  colorScheme: "light",
  preload: [
    { href: groteskLatin, as: "font", type: "font/woff2" },
    { href: monoLatin, as: "font", type: "font/woff2" },
  ],
  heroImage,
  ogImage: (portfolio) => heroImage(portfolio).src,
} satisfies ThemeMeta;

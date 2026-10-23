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
  // Collapsed panels only apply under `ct-js`, so the page reads fine without JS.
  boot: (root) => {
    root.classList.add("ct-js");
    // Failsafe: if client.ts hasn't run 3 s after the page has loaded, show the no-JS page (panels open).
    addEventListener("load", () =>
      setTimeout(() => {
        if (!(window as { __ct?: boolean }).__ct)
          root.classList.remove("ct-js");
      }, 3000),
    );
  },
} satisfies ThemeMeta;

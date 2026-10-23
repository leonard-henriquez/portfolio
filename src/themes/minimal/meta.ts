import interLatin from "@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2?url";
import type { ThemeMeta } from "../types";
import { heroImage } from "./hero";

export default {
  name: "Minimal",
  order: 2,
  themeColor: "#ffffff",
  colorScheme: "light",
  preload: [{ href: interLatin, as: "font", type: "font/woff2" }],
  heroImage,
  ogImage: (portfolio) => heroImage(portfolio).src,
  // Hidden-until-revealed states (and collapsed table panels) only apply under `mn-js`, so the page reads fine without JS.
  boot: (root) => {
    root.classList.add("mn-js");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeline = window.CSS && CSS.supports("animation-timeline: view()");
    if (!timeline && !still) root.classList.add("mn-io");
    // The load sequence is CSS, from first paint (components/Hero.astro): nothing waits for client.ts.
    // The hero photo wipes open once it has loaded and decoded, or at most 1 s after first paint.
    const heroReady = () => root.classList.add("mn-hero-ready");
    document.addEventListener(
      "load",
      (event) => {
        const img = event.target;
        if (img instanceof HTMLImageElement && img.closest("[data-mn-hero]")) {
          img.decode().catch(() => undefined).then(heroReady);
        }
      },
      true,
    );
    // Runs just before first paint: number the headline's words by rendered line, so lines rise one after another.
    requestAnimationFrame(() => {
      let line = -1;
      let top = Number.NEGATIVE_INFINITY;
      document.querySelectorAll<HTMLElement>("[data-mn-headline] .w").forEach((word) => {
        if (word.offsetTop > top + 4) {
          line++;
          top = word.offsetTop;
        }
        word.style.setProperty("--l", String(line));
      });
      setTimeout(heroReady, 1000);
    });
    // Failsafe: if client.ts hasn't run 3 s after the page has loaded, show the no-JS page (panels open).
    addEventListener("load", () =>
      setTimeout(() => {
        heroReady();
        if (!(window as { __mn?: boolean }).__mn) root.classList.remove("mn-js", "mn-io");
      }, 3000),
    );
  },
} satisfies ThemeMeta;

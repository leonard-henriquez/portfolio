/*
 * Contemplation theme behaviour, imported only while it is the active theme. Progressive: the page is complete without it.
 * - the disclosures of every list (components/Disclosure.astro): toggled on click, their height animated
 * - the URL fragment opens the item it names (`#project-<id>`, or a bare `#<id>`)
 */

import { projectFromHash } from "../active";

const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";

// Tells meta.ts's failsafe this module ran. If it arrives after the failsafe already showed the no-JS page
// (`ct-js` removed), the panels stay as they are: open, without toggles.
(window as { __ct?: boolean }).__ct = true;
const enhanced = root.classList.contains("ct-js");

const running = new WeakMap<HTMLElement, Animation[]>();

function setOpen(item: HTMLElement, open: boolean, animate = true) {
  const button = item.querySelector<HTMLButtonElement>("[data-ct-row]");
  const panel = item.querySelector<HTMLElement>("[data-ct-panel]");
  const inner = panel?.firstElementChild as HTMLElement | null;
  if (
    !button ||
    !panel ||
    !inner ||
    open === item.classList.contains("is-open")
  )
    return;

  for (const a of running.get(item) ?? []) a.cancel();
  running.delete(item);
  button.setAttribute("aria-expanded", String(open));
  item.classList.toggle("is-open", open);
  const motion =
    animate && !reduce.matches && typeof panel.animate === "function";

  if (open) {
    panel.removeAttribute("hidden");
    if (!motion) return;
    const h = panel.getBoundingClientRect().height;
    const duration = Math.min(800, 420 + h * 0.4);
    running.set(item, [
      panel.animate({ height: ["0px", `${h}px`] }, { duration, easing: EASE }),
      inner.animate(
        { opacity: [0, 1], transform: ["translateY(-12px)", "none"] },
        {
          duration: duration + 150,
          delay: 80,
          easing: EASE,
          fill: "backwards",
        },
      ),
    ]);
    return;
  }

  if (!motion || panel.hidden) {
    panel.setAttribute("hidden", "until-found");
    return;
  }
  const h = panel.getBoundingClientRect().height;
  const duration = Math.min(650, 360 + h * 0.3);
  const animations = [
    panel.animate(
      { height: [`${h}px`, "0px"] },
      { duration, easing: EASE, fill: "forwards" },
    ),
    inner.animate(
      { opacity: [1, 0] },
      { duration: duration * 0.6, easing: "ease", fill: "forwards" },
    ),
  ];
  running.set(item, animations);
  Promise.all(animations.map((a) => a.finished))
    .then(() => {
      if (running.get(item) !== animations) return;
      // Hide and drop the animations in the same frame, so nothing jumps.
      panel.setAttribute("hidden", "until-found");
      for (const a of animations) a.cancel();
      running.delete(item);
    })
    .catch(() => undefined);
}

if (enhanced) {
  const items = [
    ...document.querySelectorAll<HTMLElement>(
      "[data-ct-disclosures] > [data-ct-item]",
    ),
  ];
  for (const item of items) {
    const row = item.querySelector("[data-ct-row]");
    // Not in the markup: without JS every panel is shown (see Page.astro).
    row?.setAttribute("aria-expanded", "false");
    row?.addEventListener("click", () =>
      setOpen(item, !item.classList.contains("is-open")),
    );
    // Find-in-page reveals `hidden="until-found"` panels; keep the button state in sync.
    item
      .querySelector("[data-ct-panel]")
      ?.addEventListener("beforematch", () => setOpen(item, true, false));
  }

  const openFromHash = () => {
    const target = projectFromHash(items);
    if (!target) return;
    setOpen(target.row, true, false);
    if (target.bare) target.row.scrollIntoView();
  };
  openFromHash();
  addEventListener("hashchange", openFromHash);
}

export {}; // A module, so its top-level names stay private.

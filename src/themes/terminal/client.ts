/*
 * Terminal theme behaviour, imported only while Terminal is the active theme.
 * Everything here is progressive: without it the page is complete and static.
 * - hero terminal typed character by character, prompts typed when they scroll into view
 * - IntersectionObserver reveals where CSS scroll-driven animations are missing (Firefox)
 * - number scramble, cursor-following project preview
 * - expandable lists: open the row a link points at, j/k between rows, Escape to close
 */

import { projectFromHash } from "../active";

const root = document.documentElement;
const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const scrollTimeline = CSS.supports("animation-timeline: scroll()");

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const rand = (min: number, max: number) => min + Math.random() * (max - min);

function el(tag: string, className: string, text = ""): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

/* Human-ish cadence: quick bursts inside words, small hesitations at spaces and punctuation. */
function keyDelay(ch: string, prev: string, speed: number): number {
  let ms = rand(45, 120);
  if (ch === " ") ms += rand(20, 70);
  if (/[./\-_"~]/.test(ch)) ms += rand(30, 90);
  if (ch === prev) ms *= 0.6;
  if (Math.random() < 0.06) ms += rand(120, 260);
  return ms * speed;
}

/** Types `target`'s text into it with a caret; layout never moves because the untyped rest stays in place, hidden. */
async function typeInto(target: HTMLElement, caret: HTMLElement, speed = 1): Promise<void> {
  const text = target.textContent ?? "";
  const typed = el("span", "typed");
  const rest = el("span", "rest", text);
  target.replaceChildren(typed, caret, rest);
  caret.classList.remove("is-idle");
  for (let i = 0; i < text.length; i++) {
    await sleep(keyDelay(text[i], text[i - 1] ?? "", speed));
    typed.textContent = text.slice(0, i + 1);
    rest.textContent = text.slice(i + 1);
  }
  target.replaceChildren(text);
}

async function runTerminal(term: HTMLElement): Promise<void> {
  const caret = term.querySelector<HTMLElement>(".caret");
  if (!caret) return;
  const lines = [...term.querySelectorAll<HTMLElement>(".ln")];
  await sleep(900);
  for (const line of lines) {
    line.classList.add("is-on");
    const cmd = line.querySelector<HTMLElement>("[data-type]");
    if (cmd) {
      // Prompt appears, a beat, then the keystrokes, then "enter".
      cmd.before(caret);
      caret.classList.add("is-idle");
      await sleep(rand(450, 750));
      cmd.classList.add("is-typing");
      await typeInto(cmd, caret);
      cmd.after(caret);
      await sleep(rand(260, 420));
    } else if (line.hasAttribute("data-final")) {
      line.append(caret);
    } else {
      // Output prints line by line, fast.
      await sleep(rand(40, 90));
    }
  }
  caret.classList.add("is-idle");
  term.classList.add("is-done");
}

function initTerminal(): void {
  const term = document.querySelector<HTMLElement>("[data-term]");
  if (!term) return;
  if (motionQuery.matches) {
    term.classList.add("is-done");
    return;
  }
  void runTerminal(term);
}

/* One observer for everything that reacts to entering the viewport. */
function initViewport(): void {
  const reduce = motionQuery.matches;
  const prompts = [...document.querySelectorAll<HTMLElement>("[data-tv]")];
  const prints = [...document.querySelectorAll<HTMLElement>("[data-print]")];
  const scrambles = [...document.querySelectorAll<HTMLElement>("[data-scramble]")];
  const reveals = scrollTimeline ? [] : [...document.querySelectorAll<HTMLElement>(".reveal")];

  if (reduce || !("IntersectionObserver" in window)) {
    for (const node of [...prompts, ...prints, ...reveals]) node.classList.add("is-in", "is-done");
    return;
  }

  const handlers = new Map<Element, () => void>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        handlers.get(entry.target)?.();
      }
    },
    { rootMargin: "0px 0px -12% 0px" },
  );
  const watch = (node: Element, fn: () => void) => {
    handlers.set(node, fn);
    io.observe(node);
  };

  for (const node of reveals) watch(node, () => node.classList.add("is-in"));
  for (const node of prints) watch(node, () => node.classList.add("is-in"));
  for (const node of scrambles) watch(node, () => scramble(node));
  for (const node of prompts) {
    watch(node, async () => {
      const caret = el("span", "caret");
      await sleep(180);
      await typeInto(node, caret, 0.55);
      node.classList.add("is-done");
    });
  }
}

/* Decode effect: random glyphs settle left to right into the real value. Monospace, so no reflow. */
function scramble(node: HTMLElement): void {
  const final = node.textContent?.trim() ?? "";
  const glyphs = "0123456789$#%&*+=<>/";
  const duration = 900;
  const start = performance.now() + 200;
  let last = 0;
  const frame = (now: number) => {
    const t = Math.max(0, now - start) / duration;
    if (t >= 1) {
      node.textContent = final;
      return;
    }
    if (now - last > 45) {
      last = now;
      const settled = Math.floor(t * final.length);
      node.textContent = [...final]
        .map((ch, i) => (i < settled || ch === " " ? ch : glyphs[Math.floor(Math.random() * glyphs.length)]))
        .join("");
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* Firefox & co: drive the progress bar and the hero zoom from scroll, transform/opacity only. */
function initScrollFallback(): void {
  if (scrollTimeline) return;
  const bar = document.querySelector<HTMLElement>(".progress");
  const photo = document.querySelector<HTMLElement>(".hero .photo");
  let ticking = false;
  const update = () => {
    ticking = false;
    const max = root.scrollHeight - innerHeight;
    const y = scrollY;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (photo && !motionQuery.matches) {
      const p = Math.min(1, y / innerHeight);
      photo.style.transform = `scale(${1 + 0.15 * p}) translateY(${6 * p}%)`;
      photo.style.opacity = String(1 - 0.65 * p);
    }
  };
  addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

/* The row a link points at: a project (`#project-<id>`, or a bare `#<id>`, see projectFromHash) or any other
 * row with an id (`#experience-<org>`). Opens it. */
function initHash(): void {
  const projects = [...document.querySelectorAll<HTMLElement>("[data-row]")];
  const open = () => {
    const project = projectFromHash(projects);
    let row: HTMLElement | null | undefined = project?.row;
    if (!row) {
      try {
        row = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      } catch {
        return;
      }
    }
    const details = row?.querySelector(":scope > details");
    if (!(details instanceof HTMLDetailsElement)) return;
    details.open = true;
    if (project?.bare) row?.scrollIntoView();
  };
  open();
  addEventListener("hashchange", open);
}

/* Every expandable list: j/k move between its rows, Escape closes the focused one. Only while one of the list's
 * own rows has focus (WCAG 2.1.4: no page-wide single-key shortcuts), so Tab into the list first. */
function initLists(): void {
  for (const list of document.querySelectorAll<HTMLElement>("[data-list]")) {
    const summaries = [...list.querySelectorAll<HTMLElement>(":scope > li > details > summary")];
    if (!summaries.length) continue;
    list.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const current = summaries.indexOf(event.target as HTMLElement);
      if (current < 0) return;
      if (event.key === "Escape") {
        (summaries[current].parentElement as HTMLDetailsElement).open = false;
        return;
      }
      if (event.key !== "j" && event.key !== "k") return;
      const step = event.key === "j" ? 1 : -1;
      const summary = summaries[Math.max(0, Math.min(summaries.length - 1, current + step))];
      event.preventDefault();
      summary.focus({ preventScroll: true });
      summary.scrollIntoView({ block: "nearest", behavior: motionQuery.matches ? "auto" : "smooth" });
    });
  }
}

/* A small photo that trails the cursor over the project list. */
function initPeek(): void {
  const list = document.querySelector<HTMLElement>('[data-list="projects"]');
  const peek = document.querySelector<HTMLElement>("[data-peek]");
  const inner = document.querySelector<HTMLElement>("[data-peek-inner]");
  if (!list || !peek || !inner || !finePointer.matches || motionQuery.matches) return;

  const images = new Map(
    [...peek.querySelectorAll<HTMLElement>("[data-peek-img]")].map((img) => [img.dataset.peekImg, img]),
  );
  let x = 0;
  let y = 0;
  let tx = 0;
  let ty = 0;
  let active: HTMLElement | undefined;
  let raf = 0;

  const loop = () => {
    x += (tx - x) * 0.16;
    y += (ty - y) * 0.16;
    const tilt = Math.max(-6, Math.min(6, (tx - x) * 0.04));
    peek.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${tilt}deg)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
  };
  const show = (id: string | undefined) => {
    const img = id ? images.get(id) : undefined;
    if (img === active) return;
    active?.classList.remove("is-on");
    active = img;
    img?.classList.add("is-on");
    inner.classList.toggle("is-on", !!img);
  };

  list.addEventListener(
    "pointerenter",
    (event) => {
      peek.hidden = false;
      tx = x = event.clientX + 28;
      ty = y = event.clientY - 90;
    },
    { once: true },
  );
  list.addEventListener("pointermove", (event) => {
    // The project lines only, not the highlights inside an open README.
    const summary = (event.target as HTMLElement).closest<HTMLElement>("[data-row] > details > summary");
    const row = summary?.closest<HTMLElement>("[data-row]");
    const open = summary?.parentElement instanceof HTMLDetailsElement && summary.parentElement.open;
    show(summary && !open ? row?.dataset.row : undefined);
    // Keep the card on screen: flip to the left of the cursor near the right edge.
    const w = peek.offsetWidth || 300;
    tx = event.clientX + 28 + w > innerWidth - 16 ? event.clientX - 28 - w : event.clientX + 28;
    ty = event.clientY - (peek.offsetHeight || 184) / 2;
    if (!raf) raf = requestAnimationFrame(loop);
  });
  list.addEventListener("pointerleave", () => show(undefined));
  list.addEventListener("toggle", () => show(undefined), true);
  addEventListener("scroll", () => show(undefined), { passive: true });
}

function init(): void {
  root.classList.add("tm-ready");
  initTerminal();
  initViewport();
  initScrollFallback();
  initHash();
  initLists();
  initPeek();
}

init();

export {}; // A module, so its top-level names stay private.

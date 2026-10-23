/*
 * Minimal theme behaviour, imported only while Minimal is the active theme. Progressive: the page is complete without it.
 * (The load sequence is CSS plus a few lines in meta.ts's `boot`, so it never waits for this module.)
 * - IntersectionObserver reveals where CSS scroll-driven animations are missing
 * - the disclosures of every table (components/Disclosure.astro), animated with FLIP (transform and clip-path only)
 * - the cursor-following preview of the project index on fine pointers
 */

import { projectFromHash } from "../active";

const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const EASE_IO = "cubic-bezier(0.77, 0, 0.18, 1)";
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

// Tells meta.ts's failsafe this module ran. If it arrives after the failsafe already showed the no-JS page
// (`mn-js` removed), the panels stay as they are: open, without toggles.
(window as { __mn?: boolean }).__mn = true;
const enhanced = root.classList.contains("mn-js");

/* Reveals for browsers without animation-timeline (Firefox). The CSS hides `.mn-reveal` only under `.mn-io`. */

function revealFallback() {
  if (!root.classList.contains("mn-io")) return;
  const io = new IntersectionObserver(
    (entries) => {
      let i = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.style.setProperty("--d", `${Math.min(i++, 8) * 60}ms`);
        el.classList.add("is-in");
        io.unobserve(el);
      }
    },
    { rootMargin: "0px 0px -6% 0px" },
  );
  document.querySelectorAll(".mn-reveal").forEach((el) => io.observe(el));
}

/* Disclosures */

type Running = { animations: Animation[]; token: number };
const running = new WeakMap<HTMLElement, Running>();

/** Everything that sits below `item` in the flow and will move when its panel opens or closes. */
function below(item: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  let node: Element | null = item;
  while (node && node !== document.body) {
    for (let s = node.nextElementSibling; s; s = s.nextElementSibling) {
      if (s instanceof HTMLElement && !(s instanceof HTMLScriptElement) && getComputedStyle(s).position !== "fixed") {
        out.push(s);
      }
    }
    node = node.parentElement;
  }
  return out;
}

/*
 * Scroll-driven reveals track layout, not transforms: an element pushed below the fold by the open panel
 * would fade out while FLIP still shows it on screen. Hold reveals at their end state while things move.
 */
const holds = new WeakMap<HTMLElement, number>();

function hold(elements: HTMLElement[], animations: Animation[]) {
  for (const el of elements) {
    holds.set(el, (holds.get(el) ?? 0) + 1);
    el.classList.add("mn-hold");
  }
  Promise.allSettled(animations.map((a) => a.finished)).then(() => {
    for (const el of elements) {
      const n = (holds.get(el) ?? 1) - 1;
      holds.set(el, n);
      if (n === 0) el.classList.remove("mn-hold");
    }
  });
}

function stop(item: HTMLElement): Running {
  const state = running.get(item) ?? { animations: [], token: 0 };
  state.token++;
  for (const a of state.animations) a.cancel();
  state.animations = [];
  running.set(item, state);
  return state;
}

function setOpen(item: HTMLElement, open: boolean, animate = true) {
  const button = item.querySelector<HTMLButtonElement>("[data-mn-row]");
  const panel = item.querySelector<HTMLElement>("[data-mn-panel]");
  const inner = panel?.firstElementChild as HTMLElement | null;
  if (!button || !panel || !inner) return;
  if (open === item.classList.contains("is-open")) return;

  const state = stop(item);
  button.setAttribute("aria-expanded", String(open));
  item.classList.toggle("is-open", open);
  const motion = animate && !reduce.matches && typeof panel.animate === "function";

  if (open) {
    panel.removeAttribute("hidden");
    if (!motion) return;
    const h = panel.getBoundingClientRect().height;
    const duration = Math.min(900, 520 + h * 0.4);
    const opts = { duration, easing: EASE_IO };
    const moving = below(item);
    state.animations = [
      panel.animate({ clipPath: ["inset(0 0 100% 0)", "inset(0 0 0% 0)"] }, opts),
      inner.animate(
        { opacity: [0, 1], transform: ["translateY(-16px)", "none"] },
        { duration: duration + 200, delay: 120, easing: EASE_OUT, fill: "backwards" },
      ),
      ...moving.map((el) =>
        el.animate({ transform: [`translateY(${-h}px)`, "translateY(0)"] }, { ...opts, composite: "add" }),
      ),
    ];
    hold(moving, state.animations);
    return;
  }

  if (!motion || panel.hidden) {
    panel.setAttribute("hidden", "until-found");
    return;
  }
  const h = panel.getBoundingClientRect().height;
  const duration = Math.min(800, 460 + h * 0.35);
  const opts: KeyframeAnimationOptions = { duration, easing: EASE_IO, fill: "forwards" };
  const token = state.token;
  const moving = below(item);
  state.animations = [
    panel.animate({ clipPath: ["inset(0 0 0% 0)", "inset(0 0 100% 0)"] }, opts),
    inner.animate({ opacity: [1, 0] }, { duration: duration * 0.6, easing: "ease", fill: "forwards" }),
    ...moving.map((el) =>
      el.animate({ transform: ["translateY(0)", `translateY(${-h}px)`] }, { ...opts, composite: "add" }),
    ),
  ];
  hold(moving, state.animations);
  Promise.all(state.animations.map((a) => a.finished))
    .then(() => {
      if (state.token !== token) return;
      // Hide and drop the transforms in the same frame, so nothing jumps.
      panel.setAttribute("hidden", "until-found");
      for (const a of state.animations) a.cancel();
      state.animations = [];
    })
    .catch(() => undefined);
}

function disclosures(list: HTMLElement, onToggle: () => void) {
  const items = [...list.querySelectorAll<HTMLElement>("[data-mn-item]")];
  for (const item of items) {
    const row = item.querySelector("[data-mn-row]");
    // Not in the markup: without JS every panel is shown (see Page.astro).
    row?.setAttribute("aria-expanded", "false");
    row?.addEventListener("click", () => {
      setOpen(item, !item.classList.contains("is-open"));
      onToggle();
    });
    // Find-in-page reveals `hidden="until-found"` panels; keep the button state in sync.
    item.querySelector("[data-mn-panel]")?.addEventListener("beforematch", () => setOpen(item, true, false));
  }

  // The fragment opens the item it names: `#project-<id>` (or a bare `#<id>`, see projectFromHash), `#principle-<n>`…
  const openFromHash = () => {
    const target = projectFromHash(items);
    if (!target) return;
    setOpen(target.row, true, false);
    if (target.bare) target.row.scrollIntoView();
  };
  openFromHash();
  addEventListener("hashchange", openFromHash);
}

/* Preview */

function preview(list: HTMLElement) {
  const el = document.querySelector<HTMLElement>("[data-mn-preview]");
  if (!el) return () => undefined;
  const layers = [...el.querySelectorAll<HTMLElement>(".pv-layer")];
  const caps = [...el.querySelectorAll<HTMLElement>(".pv-cap")];

  // Start loading the preview images (lazy, inside a display:none box until armed) as the index approaches.
  const arm = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting || !finePointer.matches) return;
      el.classList.add("is-armed");
      arm.disconnect();
      for (const img of el.querySelectorAll("img")) img.decode?.().catch(() => undefined);
    },
    { rootMargin: "800px 0px" },
  );
  // Only after the page (and so the hero image) has loaded, so previews never compete with it.
  if (document.readyState === "complete") arm.observe(list);
  else addEventListener("load", () => arm.observe(list), { once: true });

  let x = 0;
  let y = 0;
  let tx = 0;
  let ty = 0;
  let mx = -1;
  let my = -1;
  let active = -1;
  let visible = false;
  let z = 1;
  let frame = 0;
  let last = 0;
  let pointerInside = false;

  const tick = (now: number) => {
    const dt = Math.min(64, now - (last || now - 16));
    last = now;
    const k = reduce.matches ? 1 : 1 - Math.pow(1 - 0.15, dt / 16.67);
    x += (tx - x) * k;
    y += (ty - y) * k;
    el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    if (Math.abs(tx - x) + Math.abs(ty - y) > 0.2) {
      frame = requestAnimationFrame(tick);
    } else {
      frame = 0;
      last = 0;
    }
  };
  const kick = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const target = (px: number, py: number, snap: boolean) => {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const gap = 36;
    const flip = px + gap + w > innerWidth - 16;
    el.classList.toggle("is-flip", flip);
    tx = flip ? px - gap - w : px + gap;
    ty = Math.max(16, Math.min(innerHeight - h - 16, py - h / 2));
    if (snap) {
      x = tx;
      y = ty;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    kick();
  };

  const show = (index: number) => {
    if (!el.classList.contains("is-armed")) return;
    if (index !== active) {
      const layer = layers[index];
      if (!layer) return;
      layer.style.zIndex = String(++z);
      if (visible && !reduce.matches) {
        layer.animate({ clipPath: ["inset(100% 0 0 0)", "inset(0 0 0 0)"] }, { duration: 650, easing: EASE_IO });
        layer.firstElementChild?.animate({ transform: ["scale(1.18)", "scale(1)"] }, { duration: 900, easing: EASE_OUT });
      }
      caps.forEach((cap, i) => cap.classList.toggle("is-active", i === index));
      active = index;
    }
    if (!visible) {
      visible = true;
      el.classList.add("is-visible");
    }
  };

  const hide = () => {
    if (!visible) return;
    visible = false;
    el.classList.remove("is-visible");
  };

  const rowAt = (px: number, py: number) => {
    const row = document.elementFromPoint(px, py)?.closest<HTMLElement>("[data-mn-row]");
    return row && list.contains(row) && !row.closest("[data-mn-item]")?.classList.contains("is-open") ? row : null;
  };

  const update = () => {
    const row = rowAt(mx, my);
    if (row) {
      const wasVisible = visible;
      show(Number(row.dataset.index));
      target(mx, my, !wasVisible);
    } else {
      hide();
    }
  };

  list.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || !finePointer.matches) return;
    pointerInside = true;
    mx = e.clientX;
    my = e.clientY;
    update();
  });
  list.addEventListener("pointerleave", () => {
    pointerInside = false;
    hide();
  });

  // Rows slide under a still cursor while scrolling.
  let scrollQueued = false;
  addEventListener(
    "scroll",
    () => {
      if (!pointerInside || scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        update();
      });
    },
    { passive: true },
  );

  // Keyboard: park the preview beside the focused row.
  list.addEventListener("focusin", (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-mn-row]");
    if (!row || !finePointer.matches || pointerInside || !row.matches(":focus-visible")) return;
    if (row.closest("[data-mn-item]")?.classList.contains("is-open")) return hide();
    const r = row.getBoundingClientRect();
    const wasVisible = visible;
    show(Number(row.dataset.index));
    target(r.left + r.width * 0.56, r.top + r.height / 2, !wasVisible);
  });
  list.addEventListener("focusout", (e) => {
    if (!list.contains(e.relatedTarget as Node) && !pointerInside) hide();
  });

  finePointer.addEventListener("change", () => !finePointer.matches && hide());
  return hide;
}

/* Boot */

revealFallback();
if (enhanced) {
  const projects = document.querySelector<HTMLElement>("[data-mn-list]");
  const hidePreview = projects ? preview(projects) : () => undefined;
  for (const list of document.querySelectorAll<HTMLElement>("[data-mn-disclosures]")) {
    disclosures(list, list === projects ? hidePreview : () => undefined);
  }
}

export {}; // A module, so its top-level names stay private.

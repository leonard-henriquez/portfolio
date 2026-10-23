/*
 * Browser-side helpers for the active theme. The inline script in <head> (see document.ts) resolves it
 * before first paint and writes it to <html data-theme>; nothing changes it afterwards (switching reloads).
 */

import { PROJECT_ANCHOR_PREFIX } from "../lib/constants";

/** Slug of the theme being shown. */
export function activeTheme(): string {
  return document.documentElement.dataset.theme ?? "";
}

/**
 * The project row the URL fragment points at, among `rows` (elements whose id is `Project.anchor`, "project-<id>").
 * `#project-<id>` is the canonical deep link; a bare `#<id>` works too, unless an element already has that id
 * (a section anchor such as `#about` always wins). `bare` is true in that case: the browser didn't scroll, so
 * the caller should.
 */
export function projectFromHash<T extends HTMLElement>(rows: T[]): { row: T; bare: boolean } | undefined {
  let id = "";
  try {
    id = decodeURIComponent(location.hash.slice(1));
  } catch {
    return undefined;
  }
  if (!id) return undefined;
  const exact = rows.find((row) => row.id === id);
  if (exact) return { row: exact, bare: false };
  if (document.getElementById(id)) return undefined;
  const row = rows.find((r) => r.id === `${PROJECT_ANCHOR_PREFIX}${id}`);
  return row && { row, bare: true };
}

// Each theme's optional `client.ts`, as a lazy chunk: only the active theme's code is downloaded and run.
const clients = import.meta.glob(["./*/client.ts", "!./_*/client.ts"]);

/** Imports the active theme's `client.ts`, if it has one. Called once by the site layout. */
export async function loadActiveThemeClient(): Promise<void> {
  const load = clients[`./${activeTheme()}/client.ts`];
  if (load) await load();
}

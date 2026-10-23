/* Raw theme behaviour, imported only while Raw is the active theme: the light/dark toggle, deep links that open a row. */

import { projectFromHash } from "../active";

const root = document.documentElement;

document.getElementById("raw-scheme-toggle")?.addEventListener("click", () => {
  const next = root.dataset.rawScheme === "dark" ? "light" : "dark";
  root.dataset.rawScheme = next;
  try {
    localStorage.setItem("raw-scheme", next);
  } catch {}
});

// `#project-<id>` (or a bare `#<id>`, see projectFromHash) opens that project's details; so does any other row
// linked to by its id (`#experience-<id>`).
const projects = [...document.querySelectorAll<HTMLElement>("[data-raw-project]")];
const openFromHash = () => {
  const target = projectFromHash(projects);
  let row = target?.row;
  if (!row) {
    try {
      row = document.getElementById(decodeURIComponent(location.hash.slice(1))) ?? undefined;
    } catch {}
  }
  const details = row?.matches("li") ? row.querySelector(":scope > details") : null;
  if (details instanceof HTMLDetailsElement) details.open = true;
  if (target?.bare) target.row.scrollIntoView();
};
openFromHash();
addEventListener("hashchange", openFromHash);

export {}; // A module, so its top-level names stay private.

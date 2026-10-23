/* Raw theme behaviour, imported only while Raw is the active theme: the light/dark toggle, project deep links. */

import { projectFromHash } from "../active";

const root = document.documentElement;

document.getElementById("raw-scheme-toggle")?.addEventListener("click", () => {
  const next = root.dataset.rawScheme === "dark" ? "light" : "dark";
  root.dataset.rawScheme = next;
  try {
    localStorage.setItem("raw-scheme", next);
  } catch {}
});

// `#project-<id>` (or a bare `#<id>`, see projectFromHash) opens that project's README.
const projects = [...document.querySelectorAll<HTMLElement>("[data-raw-project]")];
const openFromHash = () => {
  const target = projectFromHash(projects);
  if (!target) return;
  const details = target.row.querySelector("details");
  if (details) details.open = true;
  if (target.bare) target.row.scrollIntoView();
};
openFromHash();
addEventListener("hashchange", openFromHash);

export {}; // A module, so its top-level names stay private.

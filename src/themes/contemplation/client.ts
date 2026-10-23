/*
 * Contemplation theme behaviour, imported only while it is the active theme. The page is complete without it.
 * - a bare `#<id>` deep link scrolls to its project (`#project-<id>` is a real anchor and needs nothing)
 */

import { PROJECT_ANCHOR_PREFIX } from "../../lib/constants";
import { projectFromHash } from "../active";

const rows = [...document.querySelectorAll<HTMLElement>(`[id^="${PROJECT_ANCHOR_PREFIX}"]`)];

const scrollToBare = () => {
  const target = projectFromHash(rows);
  if (target?.bare) target.row.scrollIntoView();
};
scrollToBare();
addEventListener("hashchange", scrollToBare);

export {}; // A module, so its top-level names stay private.

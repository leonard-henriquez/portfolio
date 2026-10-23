/* Terminal-flavoured formatting helpers. Pure functions of content, no content of their own. */

/** Deterministic 7-char hex "commit hash" for decorative git-log lines. */
export function shortHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

/** "https://www.topo.io/" → "topo.io". */
export function displayHost(href: string): string {
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return href;
  }
}

/** Lower-case ASCII token for prompts: "Léonard" → "leonard", "Paris" → "paris". */
export function token(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** TOML key: "Durable execution" → "durable_execution". */
export function tomlKey(s: string): string {
  return token(s).replace(/-/g, "_");
}

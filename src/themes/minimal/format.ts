/** Small text helpers for the Minimal theme. Pure functions of content, no content of their own. */

/** "Engineer" → "engineer", but leaves acronyms and proper nouns like "MCP" or "S3" alone. */
export function lowerFirst(s: string): string {
  return /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}

/** ["a"] → "a", ["a", "b"] → "a and b", ["a", "b", "c"] → "a, b and c". */
export function joinList(items: string[], conjunction = "and"): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${items.at(-1)}`;
}

/** Drops trailing sentence punctuation so a line can be extended. */
export function stripEnd(s: string): string {
  return s.trim().replace(/[.!?…]+$/, "");
}

/**
 * Splits a line into unbreakable units for per-word animation. Short words stick to the next word
 * and dashes to the previous one, so lines never end on "I" or start with "—".
 */
export function words(s: string): string[] {
  const out: string[] = [];
  let carry = "";
  for (const word of s.split(/\s+/).filter(Boolean)) {
    if (/^[—–-]$/.test(word) && out.length && !carry) {
      out[out.length - 1] += `\u00a0${word}`;
      continue;
    }
    const unit = carry ? `${carry}\u00a0${word}` : word;
    carry = "";
    if (word.length <= 2 && !/[.,;:!?]$/.test(word)) carry = unit;
    else out.push(unit);
  }
  if (carry) out.push(carry);
  return out;
}

/** Lower-cases every item but the first: ["Founder", "Engineer"] → ["Founder", "engineer"]. */
export function asPhrase(items: string[]): string[] {
  return items.map((item, i) => (i === 0 ? item : lowerFirst(item)));
}

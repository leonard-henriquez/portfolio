/** Project lifecycle, in the order themes should present it. */
export const PROJECT_STATUSES = ["shipped", "building", "exploring", "study"] as const;

/**
 * Image series available per project:
 * - photo: filmic landscape render (src/assets/photo, 1800×1100)
 * - pixel: low-res pixel grid of the photo (src/assets/pixel, 120×74); render with `image-rendering: pixelated`
 * - illustration: hi-res pixel-art illustration (src/assets/illustration, 1536×1024)
 * - illustrationPixel: true pixel grid of the illustration (src/assets/pixel, 256×171); render pixelated
 */
export const IMAGE_STYLES = ["photo", "pixel", "illustration", "illustrationPixel"] as const;

/**
 * Element ids and deep links of project rows are this prefix + the project id (`#project-topo`), so a project
 * file named like a section ("about", "contact"…) can never collide with a theme's section anchors.
 */
export const PROJECT_ANCHOR_PREFIX = "project-";

/** Employment types of a role, as LinkedIn names them. */
export const EMPLOYMENT_TYPES = ["permanent", "full-time", "part-time", "freelance", "contract", "internship"] as const;

/** Importance of an experience or education entry, most important first. Themes size entries by it. */
export const WEIGHTS = ["high", "medium", "low"] as const;

/**
 * Utilities to work with product tag hierarchy and shared sorting rules.
 */

const TAG_SYNONYMS = {
  xmas: "christmas",
  natal: "christmas",
  "natal 2024": "christmas",
  "natal2024": "christmas",
  prioritaria: "priority",
  prioridade: "priority",
  prioridade1: "priority",
  promocao: "sale",
  promoção: "sale",
  promo: "sale",
  verão: "summer",
  verao: "summer",
};

export const TAG_HIERARCHY = [
  ["priority"],
  ["sale"],
  ["new"],
  ["trending"],
  ["summer"],
  ["christmas"],
];

const DEFAULT_PRIORITY_INDEX = TAG_HIERARCHY.length;

/**
 * Normalize tag values to lower case identifiers and handle synonyms.
 */
export function normalizeTag(tag) {
  if (!tag && tag !== 0) return null;
  const normalized = String(tag).trim().toLowerCase();
  if (!normalized) return null;
  return TAG_SYNONYMS[normalized] || normalized;
}

/**
 * Get all normalized tags for a given product, including derived tags.
 */
export function getNormalizedProductTags(product) {
  const tagSet = new Set();

  if (Array.isArray(product?.tags)) {
    for (const rawTag of product.tags) {
      const normalized = normalizeTag(rawTag);
      if (normalized) tagSet.add(normalized);
    }
  }

  if (product?.isTrending) {
    tagSet.add("trending");
  }
  if (product?.isOnSale) {
    tagSet.add("sale");
  }

  if (product?.season) {
    const normalizedSeason = normalizeTag(product.season);
    if (!normalizedSeason) {
      // nothing to add
    } else if (normalizedSeason === "christmas") {
      tagSet.add("christmas");
    } else if (normalizedSeason === "summer") {
      tagSet.add("summer");
    } else {
      tagSet.add(normalizedSeason);
    }
  }

  return Array.from(tagSet);
}

/**
 * Return the hierarchy index for a specific normalized tag.
 */
export function getTagHierarchyIndex(tag) {
  if (!tag) return DEFAULT_PRIORITY_INDEX;
  for (let idx = 0; idx < TAG_HIERARCHY.length; idx += 1) {
    const group = TAG_HIERARCHY[idx];
    if (!Array.isArray(group)) continue;
    if (group.includes(tag)) return idx;
  }
  return DEFAULT_PRIORITY_INDEX;
}

/**
 * Returns the best (lowest) hierarchy index for a product.
 */
export function getProductHierarchyIndex(product) {
  const tags = getNormalizedProductTags(product);
  if (tags.length === 0) return DEFAULT_PRIORITY_INDEX;

  let best = DEFAULT_PRIORITY_INDEX;
  for (const tag of tags) {
    const idx = getTagHierarchyIndex(tag);
    if (idx < best) best = idx;
    if (best === 0) break;
  }
  return best;
}

/**
 * Compare two products by tag hierarchy. Returns negative when a should come before b.
 */
export function compareProductsByTagHierarchy(a, b) {
  const idxA = getProductHierarchyIndex(a);
  const idxB = getProductHierarchyIndex(b);
  if (idxA !== idxB) return idxA - idxB;
  return 0;
}

/**
 * Helper to check if a product has a given tag (after normalization).
 */
export function productHasTag(product, tag) {
  if (!tag) return false;
  const normalized = normalizeTag(tag);
  if (!normalized) return false;
  const tags = getNormalizedProductTags(product);
  return tags.includes(normalized);
}

export function getDefaultPriorityIndex() {
  return DEFAULT_PRIORITY_INDEX;
}



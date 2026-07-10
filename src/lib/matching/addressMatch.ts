export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Fuzzy match: exact after normalization, or one address is a substring of
 * the other (e.g. "22 Adelaide" vs "22 Adelaide St W"). Substring matching on
 * short numeric prefixes can produce false positives (e.g. "1 Main St" vs
 * "100 Main St"), which is why matches from this function are always
 * surfaced for user confirmation before anything gets overwritten — see
 * MatchReviewStep.
 */
export function addressesMatch(a: string, b: string): boolean {
  const na = normalizeAddress(a);
  const nb = normalizeAddress(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

export function isExactAddressMatch(a: string, b: string): boolean {
  return normalizeAddress(a) === normalizeAddress(b);
}

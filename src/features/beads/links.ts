const BEAD_ID_PATTERN = /^[A-Za-z0-9]+-[A-Za-z0-9][A-Za-z0-9_-]*$/;
const BEAD_SCHEME = 'bead:';

export function isBeadId(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('/') || trimmed.includes('.') || trimmed.includes('#') || trimmed.includes('?')) {
    return false;
  }
  return BEAD_ID_PATTERN.test(trimmed);
}

export function isBeadLinkHref(href: string): boolean {
  if (!href) return false;
  const trimmed = href.trim();
  if (!trimmed || !trimmed.toLowerCase().startsWith(BEAD_SCHEME)) return false;
  return isBeadId(trimmed.slice(BEAD_SCHEME.length));
}

export function decodeBeadLinkHref(href: string): string {
  const trimmed = href.trim();
  const raw = trimmed.toLowerCase().startsWith(BEAD_SCHEME)
    ? trimmed.slice(BEAD_SCHEME.length)
    : trimmed;

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function buildBeadTabId(beadId: string): string {
  return `bead:${beadId}`;
}

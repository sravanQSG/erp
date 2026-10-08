/**
 * Derives a Postgres-identifier-safe slug from a human-entered tenant name
 * (e.g. "Acme Corporation" -> "acme_corporation"). The result is combined
 * with the `tenant_` prefix to form the schema name, so it must stay within
 * the same constraints the old hand-typed slug field enforced: starts with
 * a lowercase letter, only lowercase letters/digits/underscores, capped
 * well under Postgres's 63-byte identifier limit.
 */
export function slugify(name: string, maxLength = 48): string {
  const normalized = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents (e.g. "é" -> "e")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, maxLength)
    .replace(/_+$/g, ''); // trailing underscore left over from slicing

  if (!normalized || !/^[a-z]/.test(normalized)) {
    return `t_${normalized || 'tenant'}`.slice(0, maxLength);
  }
  return normalized;
}

/**
 * Appends a `_2`, `_3`, ... suffix to a base slug, truncating the base so
 * the result still fits within `maxLength`.
 */
export function withSlugSuffix(base: string, suffix: number, maxLength = 48): string {
  const suffixStr = `_${suffix}`;
  return `${base.slice(0, maxLength - suffixStr.length)}${suffixStr}`;
}

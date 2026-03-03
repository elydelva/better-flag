/** FNV-1a 32-bit hash (unsigned) */
function fnv1a32(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Deterministic percentage (0–100) from userId + flagKey + salt.
 * Uses FNV-1a for consistent bucketing across evaluations.
 */
export function hashToPercentage(userId: string, flagKey: string, salt: string): number {
  const input = `${userId}:${flagKey}:${salt}`;
  const hash = fnv1a32(input);
  return (hash % 10000) / 100;
}

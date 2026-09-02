// Research-only deterministic fixture derivation. NOT an OFU canonical derivation.
// Integration must replace this with the frozen P2 addressed derivation adapter.
export function fixtureUnit(key, property) {
  const s = `${key}\u0000${property}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
    h ^= h >>> 13;
  }
  h ^= h << 7; h >>>= 0;
  h ^= h >>> 17; h >>>= 0;
  h ^= h << 5; h >>>= 0;
  return h / 4294967296;
}

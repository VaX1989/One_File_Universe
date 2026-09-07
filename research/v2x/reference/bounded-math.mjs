export const MAX_SAFE = Number.MAX_SAFE_INTEGER;

export function assertRecord(value, label = 'value') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be a plain record`);
  }
  return value;
}

export function int(value, label = 'value', min = -MAX_SAFE, max = MAX_SAFE) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} must be a safe integer in [${min}, ${max}]`);
  }
  return value;
}

export function nonNegativeInt(value, label = 'value', max = MAX_SAFE) {
  return int(value, label, 0, max);
}

export function ppm(value, label = 'ppm') {
  return int(value, label, 0, 1_000_000);
}

export function boundedArray(value, label, max) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  if (value.length > max) throw new RangeError(`${label} exceeds cap ${max}`);
  return value;
}

export function mulDivFloor(a, b, divisor, label = 'mulDivFloor') {
  int(a, `${label}.a`, 0);
  int(b, `${label}.b`, 0);
  int(divisor, `${label}.divisor`, 1);
  const result = (BigInt(a) * BigInt(b)) / BigInt(divisor);
  if (result > BigInt(MAX_SAFE)) throw new RangeError(`${label} overflow`);
  return Number(result);
}

export function addSafe(a, b, label = 'addSafe') {
  int(a, `${label}.a`);
  int(b, `${label}.b`);
  const out = a + b;
  if (!Number.isSafeInteger(out)) throw new RangeError(`${label} overflow`);
  return out;
}

export function sumSafe(values, label = 'sumSafe') {
  let total = 0n;
  for (const value of values) {
    int(value, `${label}.item`);
    total += BigInt(value);
  }
  if (total > BigInt(MAX_SAFE) || total < BigInt(-MAX_SAFE)) throw new RangeError(`${label} overflow`);
  return Number(total);
}

export function fnv1a32(text) {
  if (typeof text !== 'string') throw new TypeError('fnv1a32 text must be a string');
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function uniqueIds(items, label = 'items') {
  const seen = new Set();
  for (const item of items) {
    assertRecord(item, `${label} item`);
    if (typeof item.id !== 'string' || !/^[a-z0-9][a-z0-9._:-]{0,63}$/.test(item.id)) {
      throw new TypeError(`${label} item id is invalid`);
    }
    if (seen.has(item.id)) throw new Error(`${label} duplicate id ${item.id}`);
    seen.add(item.id);
  }
  return seen;
}

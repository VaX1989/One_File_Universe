export const MAX_SAFE = Number.MAX_SAFE_INTEGER;
const ID_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,63}$/;
const PRINTABLE_ASCII = /^[\x20-\x7e]*$/;

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

export function boundedAscii(value, label = 'value', max = 128, { allowEmpty = false } = {}) {
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string`);
  if ((!allowEmpty && value.length === 0) || value.length > max || !PRINTABLE_ASCII.test(value)) {
    throw new TypeError(`${label} must be ${allowEmpty ? 'a' : 'a non-empty'} printable ASCII string no longer than ${max}`);
  }
  return value;
}

export function identifier(value, label = 'id') {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw new TypeError(`${label} is invalid`);
  return value;
}

export function asciiCompare(a, b) {
  boundedAscii(a, 'asciiCompare.a', 4096, { allowEmpty: true });
  boundedAscii(b, 'asciiCompare.b', 4096, { allowEmpty: true });
  return a < b ? -1 : a > b ? 1 : 0;
}

export function encodeFields(fields, label = 'fields', maxFieldLength = 4096) {
  boundedArray(fields, label, 64);
  return fields.map((field, index) => {
    const value = boundedAscii(field, `${label}[${index}]`, maxFieldLength, { allowEmpty: true });
    return `${value.length}:${value}`;
  }).join('|');
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

export function fnv1a64Hex(text) {
  if (typeof text !== 'string') throw new TypeError('fnv1a64Hex text must be a string');
  if (!PRINTABLE_ASCII.test(text)) throw new TypeError('fnv1a64Hex text must be printable ASCII');
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= BigInt(text.charCodeAt(i));
    hash = (hash * prime) & mask;
  }
  return hash.toString(16).padStart(16, '0');
}

export function stableFingerprint64(fields, label = 'fingerprint', maxFieldLength = 4096) {
  return fnv1a64Hex(encodeFields(fields, label, maxFieldLength));
}

export function uniqueIds(items, label = 'items') {
  const seen = new Set();
  for (const item of items) {
    assertRecord(item, `${label} item`);
    const id = identifier(item.id, `${label} item id`);
    if (seen.has(id)) throw new Error(`${label} duplicate id ${id}`);
    seen.add(id);
  }
  return seen;
}

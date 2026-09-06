export const Q = 1_000_000n;
export const U64_MAX = (1n << 64n) - 1n;

export function assertBigInt(v, name) {
  if (typeof v !== 'bigint') throw new TypeError(`${name} must be BigInt`);
  return v;
}

export function assertRange(v, lo, hi, name) {
  assertBigInt(v, name);
  if (v < lo || v > hi) throw new RangeError(`${name} outside [${lo}, ${hi}]`);
  return v;
}

export function absBig(v) { return v < 0n ? -v : v; }

export function divRoundHalfEven(n, d) {
  n = BigInt(n); d = BigInt(d);
  if (d <= 0n) throw new RangeError('denominator must be positive');
  const neg = n < 0n;
  if (neg) n = -n;
  let q = n / d;
  const r = n % d;
  const twice = 2n * r;
  if (twice > d || (twice === d && (q & 1n) === 1n)) q += 1n;
  return neg ? -q : q;
}

export function mulQ(a, b) { return divRoundHalfEven(BigInt(a) * BigInt(b), Q); }
export function divQ(a, b) {
  if (BigInt(b) === 0n) throw new RangeError('division by zero');
  return divRoundHalfEven(BigInt(a) * Q, BigInt(b));
}

export function clampBig(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

function powBig(a, e) {
  let r = 1n;
  while (e > 0n) {
    if (e & 1n) r *= a;
    e >>= 1n;
    if (e) a *= a;
  }
  return r;
}

export function integerRootFloor(n, k) {
  n = BigInt(n); k = BigInt(k);
  if (n < 0n || k <= 0n) throw new RangeError('invalid root');
  if (n < 2n || k === 1n) return n;
  let lo = 0n, hi = 1n;
  while (powBig(hi, k) <= n) hi <<= 1n;
  while (lo + 1n < hi) {
    const mid = (lo + hi) >> 1n;
    if (powBig(mid, k) <= n) lo = mid; else hi = mid;
  }
  return lo;
}

export function fourthRootRatioHalfEven(n, d) {
  n = BigInt(n); d = BigInt(d);
  if (n < 0n || d <= 0n) throw new RangeError('invalid fourth-root ratio');
  if (n === 0n) return 0n;
  const floor = integerRootFloor(n / d, 4n);
  const midpoint2 = 2n * floor + 1n;
  const left = 16n * n;
  const right = d * powBig(midpoint2, 4n);
  return left > right || (left === right && (floor & 1n) === 1n) ? floor + 1n : floor;
}

export function sumBig(values) { return values.reduce((a, b) => a + BigInt(b), 0n); }

export function normalizePpm(parts, names = null) {
  if (!Array.isArray(parts) || parts.length === 0) throw new TypeError('parts required');
  const clean = parts.map((v, i) => {
    assertBigInt(v, names?.[i] || `part[${i}]`);
    if (v < 0n) throw new RangeError('negative composition part');
    return v;
  });
  const total = sumBig(clean);
  if (total <= 0n) throw new RangeError('composition sum must be positive');
  const out = clean.map(v => (v * Q) / total);
  let remainder = Q - sumBig(out);
  for (let i = 0; remainder > 0n; i = (i + 1) % out.length, remainder -= 1n) out[i] += 1n;
  return out;
}

export function stringifyBigInt(value) {
  return JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2);
}

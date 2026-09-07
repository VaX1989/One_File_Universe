function fnv1a64(text) {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= BigInt(text.charCodeAt(i));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, '0');
}

function canonicalPart(value, name) {
  if (value === undefined || value === null || value === '') throw new TypeError(`${name} is required`);
  return String(value).normalize('NFC');
}

export function individualId({ worldId, settlementId, birthOrdinal }) {
  if (!Number.isInteger(birthOrdinal) || birthOrdinal < 0) throw new TypeError('birthOrdinal must be a non-negative integer');
  const address = `${canonicalPart(worldId, 'worldId')}|${canonicalPart(settlementId, 'settlementId')}|${birthOrdinal}`;
  return `person:${fnv1a64(address)}`;
}

export function householdId({ worldId, settlementId, householdOrdinal }) {
  if (!Number.isInteger(householdOrdinal) || householdOrdinal < 0) throw new TypeError('householdOrdinal must be a non-negative integer');
  const address = `${canonicalPart(worldId, 'worldId')}|${canonicalPart(settlementId, 'settlementId')}|household|${householdOrdinal}`;
  return `household:${fnv1a64(address)}`;
}

export function identityCommitment(input) {
  return Object.freeze({
    id: individualId(input),
    worldId: canonicalPart(input.worldId, 'worldId'),
    settlementId: canonicalPart(input.settlementId, 'settlementId'),
    birthOrdinal: input.birthOrdinal,
    birthYear: Number.isInteger(input.birthYear) ? input.birthYear : null,
    provenance: input.provenance || 'MODEL_DERIVED_SIMULATION'
  });
}

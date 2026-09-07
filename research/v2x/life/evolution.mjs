import { assertRecord, boundedArray, boundedAscii, encodeFields, fnv1a32, identifier, int, mulDivFloor, nonNegativeInt, ppm, stableFingerprint64, uniqueIds } from '../reference/bounded-math.mjs';
import { LIFE_AUTHORITY, LIFE_LIMITS } from './energetics.mjs';

export const EVOLUTION_LIMITS = Object.freeze({ lineages: LIFE_LIMITS.lineages, candidatesPerLineage: 4, traitMin: -1_000_000, traitMax: 1_000_000, maxPopulation: LIFE_LIMITS.maxPopulation });

function mutationPolicyFingerprint(policy) {
  const maxStep = int(policy.maxMutationStep, 'policy.maxMutationStep', 0, 100_000);
  const salt = boundedAscii(policy.salt ?? 'v2x16', 'policy.salt', 64, { allowEmpty: true });
  const version = boundedAscii(policy.version ?? 'mutation-policy-v2', 'policy.version', 64);
  const key = encodeFields([version, String(maxStep), salt], 'mutationPolicy', 128);
  return Object.freeze({ maxStep, salt, version, key, fingerprint64: stableFingerprint64([key], 'mutationPolicyFingerprint', 256) });
}

export function deterministicVariant(lineage, generation, policy) {
  assertRecord(lineage, 'lineage'); assertRecord(policy, 'policy');
  const parentId = identifier(lineage.id, 'lineage.id');
  const trait = int(lineage.trait, 'lineage.trait', EVOLUTION_LIMITS.traitMin, EVOLUTION_LIMITS.traitMax);
  const generationValue = nonNegativeInt(generation, 'generation', 1_000_000_000);
  const fingerprint = mutationPolicyFingerprint(policy);
  const identityFields = [parentId, String(generationValue), fingerprint.key];
  const identityKey = encodeFields(identityFields, 'variantIdentity', 256);
  const identityFingerprint64 = stableFingerprint64(identityFields, 'variantIdentity', 256);
  const h = fnv1a32(identityKey);
  const span = fingerprint.maxStep * 2 + 1;
  const delta = fingerprint.maxStep === 0 ? 0 : (h % span) - fingerprint.maxStep;
  const variantTrait = Math.max(EVOLUTION_LIMITS.traitMin, Math.min(EVOLUTION_LIMITS.traitMax, trait + delta));
  return Object.freeze({
    authority: LIFE_AUTHORITY,
    parentId,
    candidateId: `rv:${identityFingerprint64}:g${generationValue}`,
    trait: variantTrait,
    delta: variantTrait - trait,
    hashHint32: h,
    identityFingerprint64,
    mutationPolicy: Object.freeze({ version: fingerprint.version, maxMutationStep: fingerprint.maxStep, salt: fingerprint.salt, fingerprint64: fingerprint.fingerprint64 }),
    identityClaim: 'RESEARCH_DETERMINISTIC_ADDRESS_HINT_NOT_CANONICAL_IDENTITY',
    collisionClaim: 'NONCRYPTOGRAPHIC_64_BIT_RESEARCH_FINGERPRINT_VERIFY_METADATA_ON_MATCH'
  });
}

export function selectionStep(lineages, environment, policy) {
  boundedArray(lineages, 'lineages', EVOLUTION_LIMITS.lineages); uniqueIds(lineages, 'lineages'); assertRecord(environment, 'environment'); assertRecord(policy, 'policy');
  const optimum = int(environment.optimumTrait, 'environment.optimumTrait', EVOLUTION_LIMITS.traitMin, EVOLUTION_LIMITS.traitMax);
  const width = int(environment.viabilityWidth, 'environment.viabilityWidth', 1, 1_000_000); const birthPpm = ppm(policy.birthPpm, 'policy.birthPpm'); const deathPpm = ppm(policy.deathPpm, 'policy.deathPpm');
  return lineages.map((lineage, index) => { assertRecord(lineage, `lineages[${index}]`); const population = nonNegativeInt(lineage.population, `lineages[${index}].population`, EVOLUTION_LIMITS.maxPopulation); const trait = int(lineage.trait, `lineages[${index}].trait`, EVOLUTION_LIMITS.traitMin, EVOLUTION_LIMITS.traitMax); const mismatch = Math.abs(trait - optimum); const viabilityPpm = mismatch >= width ? 0 : Math.floor(((width - mismatch) * 1_000_000) / width); const birthsRaw = mulDivFloor(population, birthPpm, 1_000_000, `births.${lineage.id}`); const births = mulDivFloor(birthsRaw, viabilityPpm, 1_000_000, `viableBirths.${lineage.id}`); const deaths = mulDivFloor(population, deathPpm, 1_000_000, `deaths.${lineage.id}`); const unconstrained = population + births - deaths; if (!Number.isSafeInteger(unconstrained)) throw new RangeError(`population arithmetic overflow for ${lineage.id}`); const nextPopulation = Math.max(0, Math.min(EVOLUTION_LIMITS.maxPopulation, unconstrained)); const capacityRejectedGrowth = Math.max(0, unconstrained - EVOLUTION_LIMITS.maxPopulation); return Object.freeze({ ...lineage, population: nextPopulation, viabilityPpm, births, deaths, capacityRejectedGrowth, saturated: capacityRejectedGrowth > 0, extinct: nextPopulation === 0 }); });
}

export function evaluateSpeciationWitness(candidate, policy) {
  assertRecord(candidate, 'candidate'); assertRecord(policy, 'policy');
  const population = nonNegativeInt(candidate.population, 'candidate.population', EVOLUTION_LIMITS.maxPopulation); const isolation = ppm(candidate.reproductiveIsolationProxyPpm, 'candidate.reproductiveIsolationProxyPpm'); const persistence = nonNegativeInt(candidate.persistenceGenerations, 'candidate.persistenceGenerations', 1_000_000); const divergence = nonNegativeInt(Math.abs(candidate.traitDivergence ?? 0), 'candidate.traitDivergence', 2_000_000);
  const satisfied = population >= nonNegativeInt(policy.minPopulation, 'policy.minPopulation', EVOLUTION_LIMITS.maxPopulation) && isolation >= ppm(policy.minIsolationPpm, 'policy.minIsolationPpm') && persistence >= nonNegativeInt(policy.minPersistenceGenerations, 'policy.minPersistenceGenerations', 1_000_000) && divergence >= nonNegativeInt(policy.minTraitDivergence, 'policy.minTraitDivergence', 2_000_000);
  return Object.freeze({ authority: LIFE_AUTHORITY, state: satisfied ? 'MODEL_SPECIATION_WITNESS_SATISFIED' : 'MODEL_SPECIATION_WITNESS_NOT_SATISFIED', satisfied, biologicalSpeciesClaim: false, nonClaim: 'This witness is a model abstraction and does not establish real reproductive isolation or universal species boundaries.' });
}

export function validateInnovationGraph(innovations) {
  boundedArray(innovations, 'innovations', 64); const ids = uniqueIds(innovations, 'innovations'); const indegree = new Map([...ids].map((id) => [id, 0])); const outgoing = new Map([...ids].map((id) => [id, []]));
  for (const innovation of innovations) { boundedArray(innovation.requires ?? [], `${innovation.id}.requires`, 8); if (new Set(innovation.requires ?? []).size !== (innovation.requires ?? []).length) throw new Error(`innovation ${innovation.id} has duplicate dependencies`); for (const dep of innovation.requires ?? []) { if (!ids.has(dep)) throw new Error(`innovation ${innovation.id} missing dependency ${dep}`); indegree.set(innovation.id, indegree.get(innovation.id) + 1); outgoing.get(dep).push(innovation.id); } }
  const queue = [...ids].filter((id) => indegree.get(id) === 0).sort(); let visited = 0; while (queue.length) { const id = queue.shift(); visited += 1; for (const next of outgoing.get(id)) { indegree.set(next, indegree.get(next) - 1); if (indegree.get(next) === 0) { queue.push(next); queue.sort(); } } } if (visited !== ids.size) throw new Error('innovation graph contains a cycle'); return true;
}

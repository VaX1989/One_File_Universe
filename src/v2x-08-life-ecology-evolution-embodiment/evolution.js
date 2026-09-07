const PPM = 1_000_000n;

function assert(condition, message) {
  if (!condition) throw new Error(`LIFE_V2_EVOLUTION_INVALID: ${message}`);
}

function asPpm(value, name) {
  const out = typeof value === 'bigint' ? value : BigInt(value);
  assert(out >= 0n && out <= PPM, `${name} out of ppm bounds`);
  return out;
}

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function abs(value) {
  return value < 0n ? -value : value;
}

function hash32(text) {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

function requireState(state) {
  assert(state?.schema === 'ofu-v2x-08-life-state-1', 'valid life state required');
  return state;
}

function requireLineage(state, lineageId) {
  const lineage = state.lineages.find((candidate) => candidate.id === String(lineageId));
  assert(lineage, `lineage ${lineageId} missing`);
  assert(lineage.extinctionEventKey == null, `lineage ${lineageId} is formally extinct`);
  return lineage;
}

export const LIFE_V2_EVOLUTION_DESCRIPTOR = Object.freeze({
  authorityClass: 'MODEL_DERIVED_SIMULATION',
  mutationSemantics: 'STYLIZED_DETERMINISTIC_VARIATION_PROPOSAL',
  selectionSemantics: 'PROFILE_BOUND_CRITERION_WITNESS',
  eventAdmission: 'NONE_P4_REMAINS_AUTHORITY',
  universalSpeciesThreshold: false,
  universalMutationRate: false,
  molecularGeneticsModeled: false,
});

export function proposeTraitVariation(state, request) {
  requireState(state);
  assert(request?.eventKey, 'external eventKey required');
  const lineage = requireLineage(state, request.lineageId);
  const allowedKeys = request.allowedTraitKeys == null
    ? null
    : new Set(request.allowedTraitKeys.map(String));
  const candidates = lineage.traits
    .filter((trait) => allowedKeys == null || allowedKeys.has(trait.key))
    .slice()
    .sort((a, b) => a.key.localeCompare(b.key));
  assert(candidates.length > 0, 'at least one eligible modeled trait required');

  const maxAbsoluteDeltaPpm = asPpm(request.maxAbsoluteDeltaPpm ?? 25_000, 'maxAbsoluteDeltaPpm');
  assert(maxAbsoluteDeltaPpm > 0n, 'maxAbsoluteDeltaPpm must be positive');

  const selector = hash32(`${request.eventKey}|${lineage.id}|trait-selector`);
  const trait = candidates[selector % candidates.length];
  const magnitudeSeed = hash32(`${request.eventKey}|${lineage.id}|${trait.key}|magnitude`);
  const magnitude = 1n + BigInt(magnitudeSeed) % maxAbsoluteDeltaPpm;
  const signSeed = hash32(`${request.eventKey}|${lineage.id}|${trait.key}|sign`);
  const signedDelta = (signSeed & 1) === 0 ? magnitude : -magnitude;
  const resultingValue = clamp(trait.valuePpm + signedDelta, 0n, PPM);
  const appliedDelta = resultingValue - trait.valuePpm;

  return Object.freeze({
    schema: 'ofu-v2x-08-trait-variation-proposal-1',
    lineageId: lineage.id,
    eventKey: String(request.eventKey),
    traitKey: trait.key,
    priorValuePpm: trait.valuePpm.toString(),
    deltaPpm: appliedDelta.toString(),
    resultingValuePpm: resultingValue.toString(),
    authorityClass: 'MODEL_DERIVED_SIMULATION',
    status: 'PROPOSAL_ONLY',
    limitations: Object.freeze([
      'Variation is a deterministic stylized proposal, not molecular genetics.',
      'The proposal does not admit an event or alter persistent state.',
      'No universal mutation rate or distribution is asserted.',
    ]),
  });
}

export function evaluateSelectionCriterion(state, proposal, request) {
  requireState(state);
  assert(proposal?.schema === 'ofu-v2x-08-trait-variation-proposal-1', 'variation proposal required');
  const lineage = requireLineage(state, proposal.lineageId);
  const regionId = String(request?.regionId ?? '');
  const region = state.regions[regionId];
  assert(region, `region ${regionId} missing`);
  assert(state.populations.some((population) => population.lineageId === lineage.id && population.regionId === regionId && population.abundance > 0n), 'lineage must have represented abundance in evaluation region');

  const criterion = request?.criterion ?? {};
  assert(criterion.profileId, 'criterion profileId required');
  assert(String(criterion.traitKey) === proposal.traitKey, 'criterion trait must match proposal trait');
  const targetPpm = asPpm(criterion.targetPpm, 'criterion targetPpm');
  const minimumImprovementPpm = asPpm(criterion.minimumImprovementPpm ?? 1, 'criterion minimumImprovementPpm');
  const minimumOpportunityPpm = asPpm(criterion.minimumOpportunityPpm ?? 0, 'criterion minimumOpportunityPpm');
  const prior = asPpm(proposal.priorValuePpm, 'proposal priorValuePpm');
  const resulting = asPpm(proposal.resultingValuePpm, 'proposal resultingValuePpm');
  const beforeDistance = abs(prior - targetPpm);
  const afterDistance = abs(resulting - targetPpm);
  const improvement = beforeDistance > afterDistance ? beforeDistance - afterDistance : 0n;
  const satisfied = improvement >= minimumImprovementPpm && region.opportunityPpm >= minimumOpportunityPpm;

  return Object.freeze({
    schema: 'ofu-v2x-08-selection-witness-1',
    satisfied,
    kind: 'PROFILE_BOUND_SELECTION_WITNESS',
    profileId: String(criterion.profileId),
    lineageId: lineage.id,
    regionId,
    traitKey: proposal.traitKey,
    targetPpm: targetPpm.toString(),
    beforeDistancePpm: beforeDistance.toString(),
    afterDistancePpm: afterDistance.toString(),
    improvementPpm: improvement.toString(),
    opportunityPpm: region.opportunityPpm.toString(),
    minimumOpportunityPpm: minimumOpportunityPpm.toString(),
    authorityClass: 'MODEL_DERIVED_SIMULATION',
    limitations: Object.freeze([
      'Criterion thresholds are profile inputs, not universal fitness or species laws.',
      'Satisfied means only that this explicit modeled criterion was met.',
      'The witness does not itself create a lineage or admit a temporal event.',
    ]),
  });
}

export function buildSpeciationProposal(proposal, witness, request = {}) {
  assert(proposal?.schema === 'ofu-v2x-08-trait-variation-proposal-1', 'variation proposal required');
  assert(witness?.schema === 'ofu-v2x-08-selection-witness-1', 'selection witness required');
  assert(witness.satisfied === true, 'satisfied selection witness required');
  assert(witness.lineageId === proposal.lineageId, 'witness/proposal lineage mismatch');
  assert(request.eventKey, 'external eventKey required');

  return Object.freeze({
    type: 'SPECIATION',
    eventKey: String(request.eventKey),
    parentLineageId: proposal.lineageId,
    ...(request.childLineageId == null ? {} : { childLineageId: String(request.childLineageId) }),
    criterionWitness: Object.freeze({
      satisfied: true,
      kind: witness.kind,
      profileId: witness.profileId,
      regionId: witness.regionId,
      traitKey: witness.traitKey,
      targetPpm: witness.targetPpm,
      beforeDistancePpm: witness.beforeDistancePpm,
      afterDistancePpm: witness.afterDistancePpm,
      improvementPpm: witness.improvementPpm,
      authorityClass: witness.authorityClass,
    }),
    traitDeltasPpm: Object.freeze([{ key: proposal.traitKey, deltaPpm: proposal.deltaPpm }]),
    ...(request.morphology == null ? {} : { morphology: Object.freeze({ ...request.morphology }) }),
    authorityClass: 'MODEL_DERIVED_SIMULATION',
    status: 'EVENT_PROPOSAL_REQUIRES_EXTERNAL_P4_ADMISSION',
  });
}

// One File Universe - Wave V Biology / Evolution research frontier.
// RESEARCH ONLY. NON-CANONICAL. POST-GENESIS POSITIVE FIXTURES ONLY.

export const CONTRACT_ID = 'ofu-wave-v-biology-evolution-research-v1';
export const MODEL_ID = 'wave-v-biology-evolution-research-1';
export const AUTHORITY = 'P6_RESEARCH_ONLY';
export const PRIOR_RESEARCH_CONTRACT = 'ofu-p6-biology-v2-frontier-research-wave4';
export const P5_READINESS_CONTRACT = 'ofu-p5-p6-environment-readiness-research-v2';

export const SCIENCE_STATUS = Object.freeze([
  'ESTABLISHED_GENERAL',
  'EARTH_EMPIRICAL',
  'PLAUSIBLE_HYPOTHESIS',
  'SPECULATIVE_EXOBIOLOGY',
  'GENERATIVE_FICTIONAL'
]);

export const FIDELITY = Object.freeze([
  'FORMAL',
  'HIGH_FIDELITY',
  'APPROXIMATE',
  'STYLIZED',
  'METAPHORICAL'
]);

export const MATERIALIZATION = Object.freeze(['COLD', 'WARM', 'HOT', 'IMMEDIATE']);
export const SEED_AUTHORITIES = Object.freeze(['EXTERNAL_POST_GENESIS_SEED', 'RESEARCH_FIXTURE_ONLY']);
export const INTERACTION_TYPES = Object.freeze([
  'TROPHIC', 'COMPETITION', 'MUTUALISM', 'FACILITATION', 'PARASITISM', 'SYMBIOSIS', 'OTHER_EXPLICIT'
]);
export const EVOLUTION_MECHANISMS = Object.freeze([
  'MUTATION', 'SELECTION', 'DRIFT', 'MIGRATION', 'RECOMBINATION', 'HORIZONTAL_TRANSFER',
  'SYMBIOSIS', 'DEVELOPMENTAL_INNOVATION', 'OTHER_EXPLICIT'
]);

export const LIMITS = Object.freeze({
  MAX_SOURCES: 16,
  MAX_POPULATIONS: 256,
  MAX_INTERACTIONS: 2048,
  MAX_STAGES: 16,
  MAX_STAGE_TRANSITIONS: 64,
  MAX_TRAITS: 64,
  MAX_TAGS: 64,
  MAX_MECHANISM_WITNESSES: 16,
  MAX_IMMEDIATE_ORGANISMS: 128,
  MAX_TEXT: 512
});

const PPM = 1000000n;
const U64_MAX = (1n << 64n) - 1n;
const I64_MIN = -(1n << 63n);
const I64_MAX = (1n << 63n) - 1n;

function freeze(v) { return Object.freeze(v); }
function fail(message) { throw new Error('WV-C Biology v5: ' + message); }
function exact(obj, keys, name) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) fail(name + ' must be a map');
  const a = Object.keys(obj).sort();
  const b = [...keys].sort();
  if (a.length !== b.length || a.some((x, i) => x !== b[i])) fail(name + ' fields invalid');
  return obj;
}
function text(v, name, max = LIMITS.MAX_TEXT) {
  if (typeof v !== 'string' || v.length === 0 || v.length > max || v !== v.normalize('NFC')) {
    fail(name + ' must be bounded NFC text');
  }
  return v;
}
function bool(v, name) { if (typeof v !== 'boolean') fail(name + ' must be boolean'); return v; }
function u64(v, name) { if (typeof v !== 'bigint' || v < 0n || v > U64_MAX) fail(name + ' must be u64'); return v; }
function i64(v, name) { if (typeof v !== 'bigint' || v < I64_MIN || v > I64_MAX) fail(name + ' must be i64'); return v; }
function ppm(v, name) { u64(v, name); if (v > PPM) fail(name + ' must be 0..1e6 ppm'); return v; }
function oneOf(v, allowed, name) { if (!allowed.includes(v)) fail(name + ' unsupported'); return v; }
function boundedStrings(v, name, maxCount = LIMITS.MAX_TAGS) {
  if (!Array.isArray(v) || v.length > maxCount) fail(name + ' must be bounded array');
  const out = v.map((x, i) => text(x, name + '[' + i + ']', 128));
  if (new Set(out).size !== out.length) fail(name + ' duplicates forbidden');
  return freeze(out);
}
function mulPpmFloor(value, factor) { return (u64(value, 'mul value') * ppm(factor, 'mul factor')) / PPM; }
function addU64(a, b, name) { const out = u64(a, name + ' lhs') + u64(b, name + ' rhs'); if (out > U64_MAX) fail(name + ' overflow'); return out; }
function sumU64(values, name) { let total = 0n; for (const v of values) total = addU64(total, v, name); return total; }
function interval(lo, hi, name) { u64(lo, name + ' lower'); u64(hi, name + ' upper'); if (lo > hi) fail(name + ' interval reversed'); return freeze([lo, hi]); }

export function validateClaim(claim) {
  exact(claim, ['claimId', 'statusCategory', 'fidelity', 'statement', 'validityDomain', 'sourceIds', 'uncertainty'], 'claim');
  text(claim.claimId, 'claimId', 128);
  oneOf(claim.statusCategory, SCIENCE_STATUS, 'statusCategory');
  oneOf(claim.fidelity, FIDELITY, 'fidelity');
  text(claim.statement, 'statement', 1024);
  text(claim.validityDomain, 'validityDomain', 1024);
  const sourceIds = boundedStrings(claim.sourceIds, 'sourceIds', LIMITS.MAX_SOURCES);
  text(claim.uncertainty, 'uncertainty', 1024);
  return freeze({...claim, sourceIds});
}

export function validateP5ResearchReadiness(w) {
  exact(w, [
    'contractId', 'researchPostGenesisEligible', 'canAuthorizeCanonicalBiology',
    'canonicalGenesisAvailable', 'canonicalPositivePath', 'abiogenesisStatus', 'environmentEpochKey'
  ], 'P5 readiness');
  if (w.contractId !== P5_READINESS_CONTRACT) fail('P5 readiness contract mismatch');
  bool(w.researchPostGenesisEligible, 'researchPostGenesisEligible');
  if (w.canAuthorizeCanonicalBiology !== false || w.canonicalGenesisAvailable !== false || w.canonicalPositivePath !== false) {
    fail('research P5 witness may not claim canonical biology/genesis');
  }
  text(w.abiogenesisStatus, 'abiogenesisStatus', 128);
  text(w.environmentEpochKey, 'environmentEpochKey', 256);
  return w;
}

export function positiveLifeEligibility(input) {
  exact(input, [
    'p5Readiness', 'viableMediumEstablished', 'usableEnergyEstablished', 'nutrientAvailabilityEstablished',
    'redoxGradientEstablished', 'seedAuthority', 'canonicalGenesisClaim'
  ], 'positive-life eligibility input');
  const p5 = validateP5ResearchReadiness(input.p5Readiness);
  bool(input.viableMediumEstablished, 'viableMediumEstablished');
  bool(input.usableEnergyEstablished, 'usableEnergyEstablished');
  bool(input.nutrientAvailabilityEstablished, 'nutrientAvailabilityEstablished');
  bool(input.redoxGradientEstablished, 'redoxGradientEstablished');
  oneOf(input.seedAuthority, SEED_AUTHORITIES, 'seedAuthority');
  if (input.canonicalGenesisClaim !== false) fail('research positive-life fixture cannot claim canonical genesis');

  const missing = [];
  if (!p5.researchPostGenesisEligible) missing.push('P5_RESEARCH_POST_GENESIS_READINESS');
  if (!input.viableMediumEstablished) missing.push('VIABLE_MEDIUM');
  if (!input.usableEnergyEstablished) missing.push('USABLE_ENERGY');
  if (!input.nutrientAvailabilityEstablished) missing.push('NUTRIENT_AVAILABILITY');
  if (!input.redoxGradientEstablished) missing.push('REDOX_GRADIENT');
  return freeze({
    contractId: CONTRACT_ID,
    state: missing.length === 0 ? 'RESEARCH_POST_GENESIS_ELIGIBLE' : 'INSUFFICIENT_RESEARCH_INPUTS',
    missing: freeze(missing),
    environmentEpochKey: p5.environmentEpochKey,
    seedAuthority: input.seedAuthority,
    mayInstantiateResearchFixture: missing.length === 0,
    canonicalBiologyAuthority: false,
    canonicalGenesisAvailable: false,
    abiogenesisInferred: false,
    abiogenesisProbability: null,
    claim: freeze({
      statusCategory: 'ESTABLISHED_GENERAL',
      fidelity: 'FORMAL',
      limit: 'Eligibility is an authority/dependency gate only; it does not predict abiogenesis or occupancy.'
    })
  });
}

export function energyBudget(input) {
  exact(input, ['sources', 'maintenanceFractionLowerPpm', 'maintenanceFractionUpperPpm'], 'energy budget input');
  if (!Array.isArray(input.sources) || input.sources.length === 0 || input.sources.length > LIMITS.MAX_SOURCES) {
    fail('sources must be 1..MAX_SOURCES');
  }
  const maintenanceLo = ppm(input.maintenanceFractionLowerPpm, 'maintenance lower');
  const maintenanceHi = ppm(input.maintenanceFractionUpperPpm, 'maintenance upper');
  if (maintenanceLo > maintenanceHi) fail('maintenance interval reversed');
  let capturedLo = 0n;
  let capturedHi = 0n;
  const sourceRows = [];
  const ids = new Set();
  for (let i = 0; i < input.sources.length; i++) {
    const s = exact(input.sources[i], [
      'sourceId', 'energyClass', 'availableLowerU', 'availableUpperU',
      'captureEfficiencyLowerPpm', 'captureEfficiencyUpperPpm', 'statusCategory'
    ], 'energy source ' + i);
    const id = text(s.sourceId, 'sourceId', 128);
    if (ids.has(id)) fail('duplicate energy sourceId'); ids.add(id);
    text(s.energyClass, 'energyClass', 128);
    const avail = interval(s.availableLowerU, s.availableUpperU, 'available energy');
    const effLo = ppm(s.captureEfficiencyLowerPpm, 'capture efficiency lower');
    const effHi = ppm(s.captureEfficiencyUpperPpm, 'capture efficiency upper');
    if (effLo > effHi) fail('capture efficiency interval reversed');
    oneOf(s.statusCategory, SCIENCE_STATUS, 'energy statusCategory');
    const lo = mulPpmFloor(avail[0], effLo);
    const hi = mulPpmFloor(avail[1], effHi);
    capturedLo = addU64(capturedLo, lo, 'captured lower sum');
    capturedHi = addU64(capturedHi, hi, 'captured upper sum');
    sourceRows.push(freeze({sourceId: id, capturedIntervalU: interval(lo, hi, 'captured source')}));
  }
  const maintenanceIntervalU = interval(
    mulPpmFloor(capturedLo, maintenanceLo),
    mulPpmFloor(capturedHi, maintenanceHi),
    'maintenance'
  );
  const allocLo = mulPpmFloor(capturedLo, PPM - maintenanceHi);
  const allocHi = mulPpmFloor(capturedHi, PPM - maintenanceLo);
  return freeze({
    contractId: CONTRACT_ID,
    capturedEnergyIntervalU: interval(capturedLo, capturedHi, 'captured total'),
    maintenanceIntervalU,
    allocatableEnergyIntervalU: interval(allocLo, allocHi, 'allocatable'),
    sourceRows: freeze(sourceRows),
    biomassConversion: 'NOT_INFERRED',
    populationCapacity: 'NOT_INFERRED',
    silentEfficienciesUsed: false,
    claim: freeze({statusCategory: 'EARTH_EMPIRICAL', fidelity: 'APPROXIMATE', limit: 'Energy-flow structure is Earth-calibrated; efficiencies are explicit inputs and no universal value is assumed.'})
  });
}

export function validateEcologicalNetwork(input) {
  exact(input, ['populations', 'interactions'], 'ecological network');
  if (!Array.isArray(input.populations) || input.populations.length === 0 || input.populations.length > LIMITS.MAX_POPULATIONS) fail('population list invalid');
  if (!Array.isArray(input.interactions) || input.interactions.length > LIMITS.MAX_INTERACTIONS) fail('interaction list invalid');
  const populations = new Map();
  for (let i = 0; i < input.populations.length; i++) {
    const p = exact(input.populations[i], ['populationId', 'lineageId', 'allocatableEnergyUpperU'], 'population ' + i);
    const id = text(p.populationId, 'populationId', 128);
    if (populations.has(id)) fail('duplicate populationId');
    populations.set(id, freeze({populationId: id, lineageId: text(p.lineageId, 'lineageId', 128), allocatableEnergyUpperU: u64(p.allocatableEnergyUpperU, 'allocatableEnergyUpperU')}));
  }
  const outgoingTrophicDemand = new Map([...populations.keys()].map(k => [k, 0n]));
  const interactions = [];
  const edgeIds = new Set();
  for (let i = 0; i < input.interactions.length; i++) {
    const e = exact(input.interactions[i], [
      'interactionId', 'type', 'fromPopulationId', 'toPopulationId',
      'energyDemandLowerU', 'energyDemandUpperU', 'statusCategory'
    ], 'interaction ' + i);
    const edgeId = text(e.interactionId, 'interactionId', 128);
    if (edgeIds.has(edgeId)) fail('duplicate interactionId'); edgeIds.add(edgeId);
    oneOf(e.type, INTERACTION_TYPES, 'interaction type');
    if (!populations.has(e.fromPopulationId) || !populations.has(e.toPopulationId)) fail('interaction references unknown population');
    if (e.fromPopulationId === e.toPopulationId && e.type === 'TROPHIC') fail('self-trophic edge unsupported by this research contract');
    oneOf(e.statusCategory, SCIENCE_STATUS, 'interaction statusCategory');
    let demand = null;
    if (e.type === 'TROPHIC') {
      demand = interval(e.energyDemandLowerU, e.energyDemandUpperU, 'trophic demand');
      outgoingTrophicDemand.set(e.fromPopulationId, addU64(outgoingTrophicDemand.get(e.fromPopulationId), demand[1], 'outgoing trophic demand'));
    } else if (e.energyDemandLowerU !== null || e.energyDemandUpperU !== null) {
      fail('non-trophic interactions must not smuggle trophic energy demand');
    }
    interactions.push(freeze({...e, interactionId: edgeId, energyDemandIntervalU: demand}));
  }
  for (const [id, demand] of outgoingTrophicDemand.entries()) {
    if (demand > populations.get(id).allocatableEnergyUpperU) fail('trophic demand exceeds explicitly available population energy for ' + id);
  }
  return freeze({
    contractId: CONTRACT_ID,
    populationCount: BigInt(populations.size),
    interactionCount: BigInt(interactions.length),
    interactions: freeze(interactions),
    energyOversubscription: false,
    networkMetricCausalAuthority: false,
    stabilityInferred: false,
    coextinctionRiskInferred: false,
    claim: freeze({statusCategory: 'EARTH_EMPIRICAL', fidelity: 'APPROXIMATE', limit: 'Interaction topology is bookkeeping; network metrics are not promoted to causal or stability laws.'})
  });
}

export function stageStructuredStep(input) {
  exact(input, ['birthStageId', 'stages'], 'stage step');
  const birthStageId = text(input.birthStageId, 'birthStageId', 128);
  if (!Array.isArray(input.stages) || input.stages.length === 0 || input.stages.length > LIMITS.MAX_STAGES) fail('stages invalid');
  const stageIds = new Set();
  for (const s of input.stages) { const id = text(s.stageId, 'stageId', 128); if (stageIds.has(id)) fail('duplicate stageId'); stageIds.add(id); }
  if (!stageIds.has(birthStageId)) fail('birthStageId missing');
  const next = new Map([...stageIds].map(id => [id, 0n]));
  let totalBefore = 0n, totalDeaths = 0n, totalBirths = 0n;
  let transitionCount = 0;
  for (let i = 0; i < input.stages.length; i++) {
    const s = exact(input.stages[i], ['stageId', 'countU', 'mortalityPpm', 'externalBirthsU', 'transitions'], 'stage ' + i);
    const count = u64(s.countU, 'stage count');
    const mortality = ppm(s.mortalityPpm, 'stage mortality');
    const births = u64(s.externalBirthsU, 'externalBirthsU');
    totalBefore = addU64(totalBefore, count, 'total before');
    totalBirths = addU64(totalBirths, births, 'total births');
    if (!Array.isArray(s.transitions)) fail('transitions must be array');
    transitionCount += s.transitions.length;
    if (transitionCount > LIMITS.MAX_STAGE_TRANSITIONS) fail('too many stage transitions');
    let transitionPpmSum = 0n;
    const moved = [];
    for (let j = 0; j < s.transitions.length; j++) {
      const t = exact(s.transitions[j], ['toStageId', 'probabilityPpm'], 'stage transition');
      if (!stageIds.has(t.toStageId) || t.toStageId === s.stageId) fail('stage transition target invalid');
      const q = ppm(t.probabilityPpm, 'stage transition probability');
      transitionPpmSum += q;
      if (transitionPpmSum + mortality > PPM) fail('stage outgoing probability plus mortality exceeds one');
      const n = mulPpmFloor(count, q);
      moved.push([t.toStageId, n]);
    }
    const deaths = mulPpmFloor(count, mortality);
    totalDeaths = addU64(totalDeaths, deaths, 'total deaths');
    const movedTotal = sumU64(moved.map(x => x[1]), 'moved total');
    if (deaths + movedTotal > count) fail('rounded stage flow exceeds count');
    const stay = count - deaths - movedTotal;
    next.set(s.stageId, addU64(next.get(s.stageId), stay, 'stay'));
    for (const [to, n] of moved) next.set(to, addU64(next.get(to), n, 'moved destination'));
  }
  next.set(birthStageId, addU64(next.get(birthStageId), totalBirths, 'birth stage'));
  const totalAfter = sumU64([...next.values()], 'total after');
  if (totalAfter !== totalBefore - totalDeaths + totalBirths) fail('demographic conservation failure');
  return freeze({
    contractId: CONTRACT_ID,
    stageCounts: freeze([...next.entries()].map(([stageId, countU]) => freeze({stageId, countU}))),
    totalBeforeU: totalBefore,
    totalDeathsU: totalDeaths,
    totalBirthsU: totalBirths,
    totalAfterU: totalAfter,
    endogenousGrowthLaw: 'NONE',
    claim: freeze({statusCategory: 'EARTH_EMPIRICAL', fidelity: 'APPROXIMATE', limit: 'Stage structure is a supplied demographic abstraction; rates are explicit inputs, not universal biology.'})
  });
}

export function validateLifecycleModel(model) {
  exact(model, ['modelId', 'stages', 'transitions'], 'lifecycle model');
  text(model.modelId, 'lifecycle modelId', 128);
  const stages = boundedStrings(model.stages, 'lifecycle stages', LIMITS.MAX_STAGES);
  if (stages.length === 0) fail('lifecycle needs at least one stage');
  if (!Array.isArray(model.transitions) || model.transitions.length > LIMITS.MAX_STAGE_TRANSITIONS) fail('lifecycle transitions invalid');
  const stageSet = new Set(stages);
  const keys = new Set();
  const transitions = model.transitions.map((t, i) => {
    exact(t, ['transitionId', 'fromStageId', 'toStageId', 'triggerClass'], 'lifecycle transition ' + i);
    text(t.transitionId, 'transitionId', 128); text(t.triggerClass, 'triggerClass', 128);
    if (!stageSet.has(t.fromStageId) || !stageSet.has(t.toStageId)) fail('lifecycle transition stage unknown');
    const key = t.fromStageId + '>' + t.toStageId + ':' + t.transitionId;
    if (keys.has(key)) fail('duplicate lifecycle transition'); keys.add(key);
    return freeze({...t});
  });
  return freeze({...model, stages, transitions: freeze(transitions)});
}

export function lifecycleTransition(input) {
  exact(input, ['model', 'currentStageId', 'transitionId', 'p4OperationKey'], 'lifecycle transition input');
  const model = validateLifecycleModel(input.model);
  text(input.currentStageId, 'currentStageId', 128);
  text(input.transitionId, 'transitionId', 128);
  text(input.p4OperationKey, 'p4OperationKey', 256);
  const edge = model.transitions.find(t => t.transitionId === input.transitionId && t.fromStageId === input.currentStageId);
  if (!edge) fail('lifecycle transition not declared from current stage');
  return freeze({
    contractId: CONTRACT_ID,
    fromStageId: edge.fromStageId,
    toStageId: edge.toStageId,
    triggerClass: edge.triggerClass,
    p4OperationKey: input.p4OperationKey,
    mutableTruthOwner: 'P4',
    privateBiologyHistoryEntries: 0n,
    claim: freeze({statusCategory: 'ESTABLISHED_GENERAL', fidelity: 'FORMAL', limit: 'Finite-state transition semantics only; the lifecycle graph itself remains source/model-bound.'})
  });
}

export function evolutionTransitionWitness(input) {
  exact(input, ['lineageId', 'mechanisms', 'proposedTraitChanges', 'p4OperationKey'], 'evolution witness');
  text(input.lineageId, 'lineageId', 128);
  text(input.p4OperationKey, 'p4OperationKey', 256);
  if (!Array.isArray(input.mechanisms) || input.mechanisms.length === 0 || input.mechanisms.length > LIMITS.MAX_MECHANISM_WITNESSES) fail('mechanism witnesses invalid');
  const mechanisms = input.mechanisms.map((m, i) => {
    exact(m, ['mechanism', 'statusCategory', 'sourceId', 'witness'], 'mechanism witness ' + i);
    oneOf(m.mechanism, EVOLUTION_MECHANISMS, 'evolution mechanism');
    oneOf(m.statusCategory, SCIENCE_STATUS, 'evolution mechanism status');
    text(m.sourceId, 'sourceId', 128); text(m.witness, 'witness', 512);
    return freeze({...m});
  });
  if (!Array.isArray(input.proposedTraitChanges) || input.proposedTraitChanges.length > LIMITS.MAX_TRAITS) fail('proposed trait changes invalid');
  const changes = input.proposedTraitChanges.map((c, i) => {
    exact(c, ['traitId', 'beforeI', 'afterI', 'unit', 'statusCategory'], 'trait change ' + i);
    text(c.traitId, 'traitId', 128); i64(c.beforeI, 'trait before'); i64(c.afterI, 'trait after'); text(c.unit, 'trait unit', 64); oneOf(c.statusCategory, SCIENCE_STATUS, 'trait status');
    return freeze({...c});
  });
  return freeze({
    contractId: CONTRACT_ID,
    lineageId: input.lineageId,
    mechanisms: freeze(mechanisms),
    proposedTraitChanges: freeze(changes),
    mayProposeP4Transition: true,
    automaticallyAccepted: false,
    microToMacroPrediction: false,
    claim: freeze({statusCategory: 'EARTH_EMPIRICAL', fidelity: 'APPROXIMATE', limit: 'Mutation/selection/drift/migration and related mechanisms are Earth-established; translation to macroevolution is not treated as a universal predictive law.'})
  });
}

export function speciationWitness(input) {
  exact(input, ['parentLineageId', 'childLineageId', 'criterionId', 'criterionSatisfied', 'criterionStatusCategory', 'evidenceWitness', 'p4OperationKey'], 'speciation witness');
  text(input.parentLineageId, 'parentLineageId', 128); text(input.childLineageId, 'childLineageId', 128);
  if (input.parentLineageId === input.childLineageId) fail('speciation requires distinct lineage identity');
  text(input.criterionId, 'criterionId', 128); bool(input.criterionSatisfied, 'criterionSatisfied');
  oneOf(input.criterionStatusCategory, SCIENCE_STATUS, 'criterionStatusCategory');
  text(input.evidenceWitness, 'evidenceWitness', 1024); text(input.p4OperationKey, 'p4OperationKey', 256);
  return freeze({
    contractId: CONTRACT_ID,
    mayProposeSpeciationEvent: input.criterionSatisfied,
    universalSpeciesThresholdUsed: false,
    taxonomicTruthEstablished: false,
    mutableTruthOwner: 'P4',
    claim: freeze({statusCategory: 'EARTH_EMPIRICAL', fidelity: 'APPROXIMATE', limit: 'Eligibility is criterion-bound and never a universal species-delimitation rule.'})
  });
}

export function extinctionWitness(input) {
  exact(input, ['lineageId', 'populationCountU', 'causeWitnesses', 'p4OperationKey'], 'extinction witness');
  text(input.lineageId, 'lineageId', 128); const count = u64(input.populationCountU, 'populationCountU');
  text(input.p4OperationKey, 'p4OperationKey', 256);
  if (!Array.isArray(input.causeWitnesses) || input.causeWitnesses.length > LIMITS.MAX_MECHANISM_WITNESSES) fail('causeWitnesses invalid');
  const causes = input.causeWitnesses.map((c, i) => {
    exact(c, ['causeId', 'statusCategory', 'witness'], 'extinction cause ' + i);
    text(c.causeId, 'causeId', 128); oneOf(c.statusCategory, SCIENCE_STATUS, 'cause status'); text(c.witness, 'witness', 512); return freeze({...c});
  });
  return freeze({
    contractId: CONTRACT_ID,
    demographicExtinctionEstablished: count === 0n,
    mayProposeExtinctionEvent: count === 0n || causes.length > 0,
    universalExtinctionRateUsed: false,
    predictiveExtinctionProbability: null,
    causeWitnesses: freeze(causes),
    mutableTruthOwner: 'P4',
    claim: freeze({statusCategory: count === 0n ? 'ESTABLISHED_GENERAL' : 'EARTH_EMPIRICAL', fidelity: count === 0n ? 'FORMAL' : 'APPROXIMATE', limit: 'Zero population is exact within the model state; nonzero extinction causation remains witness/model-bound.'})
  });
}

export function morphologyConstraintWitness(input) {
  exact(input, ['lineageId', 'environmentTags', 'ecologicalRoleTags', 'lifecycleStageId', 'traitEnvelopes', 'candidate'], 'morphology input');
  text(input.lineageId, 'lineageId', 128); text(input.lifecycleStageId, 'lifecycleStageId', 128);
  const environmentTags = boundedStrings(input.environmentTags, 'environmentTags');
  const ecologicalRoleTags = boundedStrings(input.ecologicalRoleTags, 'ecologicalRoleTags');
  if (!Array.isArray(input.traitEnvelopes) || input.traitEnvelopes.length > LIMITS.MAX_TRAITS) fail('traitEnvelopes invalid');
  const envelopes = new Map();
  for (let i = 0; i < input.traitEnvelopes.length; i++) {
    const e = exact(input.traitEnvelopes[i], ['traitId', 'lowerI', 'upperI', 'unit', 'statusCategory'], 'trait envelope ' + i);
    text(e.traitId, 'traitId', 128); i64(e.lowerI, 'trait lower'); i64(e.upperI, 'trait upper'); if (e.lowerI > e.upperI) fail('trait envelope reversed'); text(e.unit, 'trait unit', 64); oneOf(e.statusCategory, SCIENCE_STATUS, 'trait envelope status');
    if (envelopes.has(e.traitId)) fail('duplicate trait envelope'); envelopes.set(e.traitId, e);
  }
  const c = exact(input.candidate, ['candidateId', 'requiredEnvironmentTags', 'requiredEcologicalRoleTags', 'traits', 'bodyParts'], 'morphology candidate');
  text(c.candidateId, 'candidateId', 128);
  const requiredEnv = boundedStrings(c.requiredEnvironmentTags, 'requiredEnvironmentTags');
  const requiredRole = boundedStrings(c.requiredEcologicalRoleTags, 'requiredEcologicalRoleTags');
  if (!requiredEnv.every(x => environmentTags.includes(x))) fail('candidate environment requirement not satisfied');
  if (!requiredRole.every(x => ecologicalRoleTags.includes(x))) fail('candidate ecological role requirement not satisfied');
  if (!Array.isArray(c.traits) || c.traits.length > LIMITS.MAX_TRAITS) fail('candidate traits invalid');
  for (let i = 0; i < c.traits.length; i++) {
    const t = exact(c.traits[i], ['traitId', 'valueI', 'unit'], 'candidate trait ' + i);
    text(t.traitId, 'candidate traitId', 128); i64(t.valueI, 'candidate trait value'); text(t.unit, 'candidate trait unit', 64);
    const e = envelopes.get(t.traitId); if (!e) fail('candidate trait has no lineage/evolution envelope');
    if (t.unit !== e.unit || t.valueI < e.lowerI || t.valueI > e.upperI) fail('candidate trait outside lineage/evolution constraint');
  }
  if (c.bodyParts !== null) fail('body-part roulette is forbidden; geometry/body parts are not authorized by this constraint witness');
  return freeze({
    contractId: CONTRACT_ID,
    candidateId: c.candidateId,
    lineageId: input.lineageId,
    lifecycleStageId: input.lifecycleStageId,
    environmentTags,
    ecologicalRoleTags,
    constraintSatisfied: true,
    geometryPrescription: false,
    arbitraryBodyPartGenerationAllowed: false,
    claim: freeze({statusCategory: 'PLAUSIBLE_HYPOTHESIS', fidelity: 'STYLIZED', limit: 'The model constrains synthetic morphology proposals from explicit environment/ecology/evolution witnesses; it does not predict alien body plans.'})
  });
}

export function materializationWitness(input) {
  exact(input, ['level', 'biosphereId', 'ecosystemIds', 'populationIds', 'lineageIds', 'immediateOrganisms', 'environmentEpochKey'], 'materialization witness');
  oneOf(input.level, MATERIALIZATION, 'materialization level');
  text(input.biosphereId, 'biosphereId', 128); text(input.environmentEpochKey, 'environmentEpochKey', 256);
  const ecosystemIds = boundedStrings(input.ecosystemIds, 'ecosystemIds', LIMITS.MAX_POPULATIONS);
  const populationIds = boundedStrings(input.populationIds, 'populationIds', LIMITS.MAX_POPULATIONS);
  const lineageIds = boundedStrings(input.lineageIds, 'lineageIds', LIMITS.MAX_POPULATIONS);
  if (!Array.isArray(input.immediateOrganisms) || input.immediateOrganisms.length > LIMITS.MAX_IMMEDIATE_ORGANISMS) fail('immediateOrganisms invalid');
  if (input.level !== 'IMMEDIATE' && input.immediateOrganisms.length !== 0) fail('organism materialization is IMMEDIATE only');
  if (input.level === 'COLD' && (ecosystemIds.length || populationIds.length || lineageIds.length)) fail('COLD materialization may not instantiate lower biological levels');
  if (input.level === 'WARM' && lineageIds.length) fail('WARM materialization may not instantiate lineage detail');
  const organisms = input.immediateOrganisms.map((o, i) => {
    exact(o, ['sampleKey', 'populationId', 'lineageId', 'persistent', 'individualIdentityPromoted'], 'immediate organism ' + i);
    text(o.sampleKey, 'sampleKey', 256); text(o.populationId, 'populationId', 128); text(o.lineageId, 'lineageId', 128);
    if (o.persistent !== false || o.individualIdentityPromoted !== false) fail('IMMEDIATE organisms must remain ephemeral and identity-unpromoted');
    if (!populationIds.includes(o.populationId) || !lineageIds.includes(o.lineageId)) fail('IMMEDIATE organism must bind materialized population/lineage');
    return freeze({...o});
  });
  return freeze({
    contractId: CONTRACT_ID,
    level: input.level,
    biosphereId: input.biosphereId,
    environmentEpochKey: input.environmentEpochKey,
    ecosystemIds,
    populationIds,
    lineageIds,
    immediateOrganisms: freeze(organisms),
    lowerLevelMaterializationCreatesTruth: false,
    individualIdentityPromoted: false,
    claim: freeze({statusCategory: 'ESTABLISHED_GENERAL', fidelity: 'FORMAL', limit: 'Materialization/reconciliation semantics only; biological content remains governed by its own claim metadata.'})
  });
}

export function reconcileHierarchy(input) {
  exact(input, ['coarsePopulationId', 'coarseLineageId', 'coarsePopulationCountU', 'materializedOrganisms'], 'hierarchy reconciliation');
  text(input.coarsePopulationId, 'coarsePopulationId', 128); text(input.coarseLineageId, 'coarseLineageId', 128);
  const count = u64(input.coarsePopulationCountU, 'coarsePopulationCountU');
  if (!Array.isArray(input.materializedOrganisms) || input.materializedOrganisms.length > LIMITS.MAX_IMMEDIATE_ORGANISMS) fail('materializedOrganisms invalid');
  for (let i = 0; i < input.materializedOrganisms.length; i++) {
    const o = exact(input.materializedOrganisms[i], ['sampleKey', 'populationId', 'lineageId', 'persistent', 'individualIdentityPromoted'], 'reconcile organism ' + i);
    text(o.sampleKey, 'sampleKey', 256);
    if (o.populationId !== input.coarsePopulationId || o.lineageId !== input.coarseLineageId || o.persistent !== false || o.individualIdentityPromoted !== false) fail('organism contradicts coarse hierarchy commitment');
  }
  if (BigInt(input.materializedOrganisms.length) > count && count !== 0n) fail('sample count cannot exceed coarse population count');
  if (count === 0n && input.materializedOrganisms.length !== 0) fail('zero coarse population cannot materialize organisms');
  return freeze({
    contractId: CONTRACT_ID,
    reconciled: true,
    coarsePopulationCountU: count,
    sampleCountU: BigInt(input.materializedOrganisms.length),
    coarseCountMutated: false,
    abundanceInferredFromSample: false,
    fineHistoryMayOverrideCoarseCommitment: false
  });
}

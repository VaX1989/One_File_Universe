import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { createDemographyLedger, applyDemographicStep, demographicSummary, selectLivingMembers, isLivingBirthOrdinal } from '../../src/domains/v1/demography/ledger.js';
import { refinePopulation, retainIndividual, appendHistoryRef, INDIVIDUAL_LIMITS } from '../../src/domains/v1/individuals/runtime.js';
import { refineHouseholds } from '../../src/domains/v1/individuals/households.js';
import { recordKinship } from '../../src/domains/v1/individuals/relationships.js';
import { recordStructuredExposure, LEARNING_LIMITS } from '../../src/domains/v1/individuals/learning.js';
import { reconcileDemography, reconcilePopulationRefinement, reconcileHouseholds } from '../../src/domains/v1/individuals/reconcile.js';

let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };

let ledger = createDemographyLedger({ settlementId: 'delta', population: 100, currentYear: 20 });
ledger = applyDemographicStep(ledger, { year: 21, births: 10, deaths: 5 });
const summary = demographicSummary(ledger);
check(summary.population === 105 && summary.addressableBirths === 110, 'living population is distinct from historical birth address space');
check(summary.representedLiving === summary.population, 'all living population is represented by bounded pools');
check(reconcileDemography({ aggregatePopulation: 105, ledger }).status === 'PASS', 'demography reconciliation proves conservation and address space');
assert.throws(() => applyDemographicStep(ledger, { year: 20, births: 0, deaths: 0 }), /cannot move backwards/, 'demographic time is monotonic'); checks += 1;
assert.throws(() => applyDemographicStep(ledger, { year: 22, deaths: ledger.population + 1 }), /deaths exceed available population/, 'death flow cannot exceed available population'); checks += 1;
assert.throws(() => selectLivingMembers(ledger, { start: -1, count: 1 }), /start must be a safe integer/, 'living selector rejects negative cursors'); checks += 1;

const allLiving = selectLivingMembers(ledger, { count: ledger.population });
check(allLiving.length === 105, 'selector can enumerate every living slot for a small witness');
check(new Set(allLiving.map((member) => member.birthOrdinal)).size === 105, 'living slot selector is collision-free');
check(allLiving.every((member) => isLivingBirthOrdinal(ledger, member.birthOrdinal)), 'selector returns only living birth ordinals');
check(selectLivingMembers(ledger, { count: ledger.population }).map((x) => x.birthOrdinal).join(',') === allLiving.map((x) => x.birthOrdinal).join(','), 'living selection is replay deterministic');

const aggregate = { roles: ['grower', 'builder', 'teacher'], householdSizeEstimate: 5, cultureConventions: ['market-day'], educationTopics: ['water-cycle'] };
const active = refinePopulation({ worldId: 'world-a', ledger, aggregate, start: 3, count: 12, currentYear: 30 });
check(active.length === 12, 'cohort/legacy aggregate refines to bounded active persons');
check(reconcilePopulationRefinement({ ledger, people: active }).status === 'PASS', 'independent refinement reconciliation accepts living persons');
check(active.every((person) => person.householdAuthority === 'MODEL_DERIVED_GROUPING_NOT_KINSHIP'), 'household grouping is not kinship');
check(active.every((person) => person.lineage.status === 'UNKNOWN_UNLESS_RETAINED'), 'lineage remains unknown without retained evidence');
const duplicateRefinement = reconcilePopulationRefinement({ ledger, people: [active[0], active[0]] });
check(duplicateRefinement.status === 'FAIL' && duplicateRefinement.defects.some((defect) => defect.startsWith('duplicate-id:')), 'reconciliation fails closed on duplicate persistent identity');

const households = refineHouseholds(active);
check(households.length > 0 && households.length <= active.length, 'active household groups are bounded and sparse');
check(reconcileHouseholds({ people: active, households }).status === 'PASS', 'household projection independently reconciles');

let person = active[0];
assert.throws(() => recordKinship(person, { relation: 'PARENT', personId: active[1].id }), /provenance/, 'kinship without provenance is rejected'); checks += 1;
assert.throws(() => recordKinship(person, { relation: 'PARENT', personId: person.id, provenance: 'MODEL_DERIVED_SIMULATION', sourceRef: 'self' }), /distinct personId/, 'self-kinship cannot be fabricated'); checks += 1;
assert.throws(() => recordKinship(person, { relation: 'PARENT', personId: active[1].id, provenance: 'UNVERIFIED', sourceRef: 'bad' }), /explicit admitted\/model provenance/, 'unsupported kinship provenance is rejected'); checks += 1;
person = recordKinship(person, { relation: 'PARENT', personId: active[1].id, provenance: 'MODEL_DERIVED_SIMULATION', sourceRef: 'model-event:parentage-7' });
check(person.lineage.parentIds.length === 1 && person.lineage.status === 'RETAINED_STRUCTURED_RELATIONS', 'kinship exists only after explicit retained record');

person = recordStructuredExposure(person, { kind: 'SKILL', topic: 'irrigation', level: 0.6, provenance: 'MODEL_DERIVED_SIMULATION', sourceRef: 'education-cycle:3' });
person = recordStructuredExposure(person, { kind: 'KNOWLEDGE_EXPOSURE', topic: 'river-map', provenance: 'ADMITTED_HISTORY_REF', sourceRef: 'evt:map-1' });
check(person.skills[0].topic === 'irrigation' && person.knowledge[0].topic === 'river-map', 'skills and knowledge are structured provenance-bearing records');
check(LEARNING_LIMITS.semantics.includes('not-private-mental-state'), 'learning semantics do not claim private mental state');

assert.throws(() => appendHistoryRef(person, { eventId: 'evt-missing-provenance' }), /eventId and provenance/, 'history references require provenance'); checks += 1;
for (let i = 0; i < INDIVIDUAL_LIMITS.MAX_MEMORIES + 8; i += 1) person = appendHistoryRef(person, { eventId: `evt-${i}`, provenance: 'MODEL_DERIVED_SIMULATION' });
check(person.memories.length === INDIVIDUAL_LIMITS.MAX_MEMORIES, 'history references remain bounded');
check(person.memories[0].eventId === 'evt-8', 'bounded history retains the most recent references');

const retained = retainIndividual(person);
const retainedById = new Map([[person.id, retained]]);
const revisitIndex = allLiving.findIndex((member) => member.birthOrdinal === person.birthOrdinal);
const revisited = refinePopulation({ worldId: 'world-a', ledger, aggregate, start: revisitIndex, count: 1, retainedById, currentYear: 40 })[0];
check(revisited.id === person.id, 'materialize/evict/rematerialize preserves stable identity');
check(revisited.lineage.parentIds[0] === active[1].id, 'retained kinship survives revisit without regeneration');
check(revisited.skills[0].topic === 'irrigation', 'structured competency survives revisit');

const beforeDeathIds = new Set(selectLivingMembers(ledger, { count: ledger.population }).map((member) => member.birthOrdinal));
ledger = applyDemographicStep(ledger, { year: 22, births: 0, deaths: 4 });
const afterDeathIds = new Set(selectLivingMembers(ledger, { count: ledger.population }).map((member) => member.birthOrdinal));
const retiredOrdinals = [...beforeDeathIds].filter((ordinal) => !afterDeathIds.has(ordinal));
check(afterDeathIds.size === beforeDeathIds.size - 4, 'aggregate deaths retire exactly four implicit person addresses');
check([...afterDeathIds].every((ordinal) => beforeDeathIds.has(ordinal)), 'death transition never renumbers surviving identities');
check(retiredOrdinals.length === 4 && retiredOrdinals.every((ordinal) => !isLivingBirthOrdinal(ledger, ordinal)), 'retired birth ordinals cannot rematerialize as living persons');
const deadWitness = { ...active[0], birthOrdinal: retiredOrdinals[0] };
check(reconcilePopulationRefinement({ ledger, people: [deadWitness] }).defects.some((defect) => defect.startsWith('materialized-nonliving-ordinal:')), 'reconciliation rejects a nonliving birth ordinal');

let huge = createDemographyLedger({ settlementId: 'mega', population: 4_000_000_000, currentYear: 100 });
huge = applyDemographicStep(huge, { year: 101, births: 2_000_000, deaths: 1_000_000 });
const t0 = performance.now();
const tiny = refinePopulation({ worldId: 'world-big', ledger: huge, aggregate, count: INDIVIDUAL_LIMITS.MAX_ACTIVE });
const elapsedMs = performance.now() - t0;
check(tiny.length === INDIVIDUAL_LIMITS.MAX_ACTIVE, 'four-billion aggregate still materializes only active cap');
check(reconcilePopulationRefinement({ ledger: huge, people: tiny }).status === 'PASS', 'huge aggregate tiny refinement reconciles');
check(selectLivingMembers(huge, { start: 3_500_000_000, count: 3 }).length === 3, 'deep selection does not require full-population materialization');
check(Number.isFinite(elapsedMs), 'sparse refinement produces a finite measured runtime observation without claiming a universal performance threshold');

console.log(`V2X-10 continuity/performance: ${checks} checks passed; huge-refine=${elapsedMs.toFixed(3)}ms on Node ${process.version}`);

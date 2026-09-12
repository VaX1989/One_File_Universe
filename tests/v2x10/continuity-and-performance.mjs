import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { createDemographyLedger, applyDemographicStep, demographicSummary, selectLivingMembers, isLivingBirthOrdinal, cohortKey } from '../../src/domains/v1/demography/ledger.js';
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
const pagedLiving = [
  ...selectLivingMembers(ledger, { start: 0, count: 37 }),
  ...selectLivingMembers(ledger, { start: 37, count: 37 }),
  ...selectLivingMembers(ledger, { start: 74, count: 37 })
];
check(pagedLiving.map((x) => x.birthOrdinal).join(',') === allLiving.map((x) => x.birthOrdinal).join(','), 'paged living selection composes to the full deterministic ordering');
check(selectLivingMembers(ledger, { start: ledger.population, count: 1 }).length === 0, 'selection at living-population boundary is empty');

const aggregate = { roles: ['grower', 'builder', 'teacher'], householdSizeEstimate: 5, cultureConventions: ['market-day'], educationTopics: ['water-cycle'] };
const active = refinePopulation({ worldId: 'world-a', ledger, aggregate, start: 3, count: 12, currentYear: 30 });
check(active.length === 12, 'cohort/legacy aggregate refines to bounded active persons');
check(reconcilePopulationRefinement({ ledger, people: active }).status === 'PASS', 'independent refinement reconciliation accepts living persons');
const wrongSettlement = { ...active[0], settlementId: 'other-settlement' };
check(reconcilePopulationRefinement({ ledger, people: [wrongSettlement] }).defects.some((defect) => defect.startsWith('settlement-mismatch:')), 'population reconciliation rejects settlement drift');
check(active.every((person) => person.householdAuthority === 'MODEL_DERIVED_GROUPING_NOT_KINSHIP'), 'household grouping is not kinship');
check(active.every((person) => person.lineage.status === 'UNKNOWN_UNLESS_RETAINED'), 'lineage remains unknown without retained evidence');
const duplicateRefinement = reconcilePopulationRefinement({ ledger, people: [active[0], active[0]] });
check(duplicateRefinement.status === 'FAIL' && duplicateRefinement.defects.some((defect) => defect.startsWith('duplicate-id:')), 'reconciliation fails closed on duplicate persistent identity');

const households = refineHouseholds(active);
check(households.length > 0 && households.length <= active.length, 'active household groups are bounded and sparse');
check(reconcileHouseholds({ people: active, households }).status === 'PASS', 'household projection independently reconciles');
const fabricatedHouseholds = households.map((household, index) => index === 0 ? { ...household, kinshipStatus: 'FABRICATED' } : household);
check(reconcileHouseholds({ people: active, households: fabricatedHouseholds }).defects.some((defect) => defect.startsWith('household-fabricated-kinship:')), 'household reconciliation rejects fabricated kinship status');
const missingMemberHouseholds = households.map((household, index) => index === 0 ? { ...household, activeMemberIds: household.activeMemberIds.slice(1) } : household);
check(reconcileHouseholds({ people: active, households: missingMemberHouseholds }).defects.some((defect) => defect.startsWith('household-membership-mismatch:')), 'household reconciliation rejects membership drift');

let person = active[0];
assert.throws(() => recordKinship(person, { relation: 'PARENT', personId: active[1].id }), /provenance/, 'kinship without provenance is rejected'); checks += 1;
assert.throws(() => recordKinship(person, { relation: 'PARENT', personId: person.id, provenance: 'MODEL_DERIVED_SIMULATION', sourceRef: 'self' }), /distinct personId/, 'self-kinship cannot be fabricated'); checks += 1;
assert.throws(() => recordKinship(person, { relation: 'PARENT', personId: active[1].id, provenance: 'UNVERIFIED', sourceRef: 'bad' }), /explicit admitted\/model provenance/, 'unsupported kinship provenance is rejected'); checks += 1;
person = recordKinship(person, { relation: 'PARENT', personId: active[1].id, provenance: 'MODEL_DERIVED_SIMULATION', sourceRef: 'model-event:parentage-7' });
check(person.lineage.parentIds.length === 1 && person.lineage.status === 'RETAINED_STRUCTURED_RELATIONS', 'kinship exists only after explicit retained record');
const kinshipOnce = person.lineage.relations.length;
person = recordKinship(person, { relation: 'PARENT', personId: active[1].id, provenance: 'MODEL_DERIVED_SIMULATION', sourceRef: 'model-event:parentage-8' });
check(person.lineage.relations.length === kinshipOnce && person.lineage.relations[0].sourceRef === 'model-event:parentage-8', 'kinship upsert is deterministic and does not duplicate the same relation/person tuple');

person = recordStructuredExposure(person, { kind: 'SKILL', topic: 'irrigation', level: 0.6, provenance: 'MODEL_DERIVED_SIMULATION', sourceRef: 'education-cycle:3' });
person = recordStructuredExposure(person, { kind: 'KNOWLEDGE_EXPOSURE', topic: 'river-map', provenance: 'ADMITTED_HISTORY_REF', sourceRef: 'evt:map-1' });
check(person.skills[0].topic === 'irrigation' && person.knowledge[0].topic === 'river-map', 'skills and knowledge are structured provenance-bearing records');
check(LEARNING_LIMITS.semantics.includes('not-private-mental-state'), 'learning semantics do not claim private mental state');
const skillCountBefore = person.skills.length;
person = recordStructuredExposure(person, { kind: 'SKILL', topic: 'irrigation', level: 4, provenance: 'MODEL_DERIVED_SIMULATION', sourceRef: 'education-cycle:3' });
check(person.skills.length === skillCountBefore && person.skills.at(-1).level === 1, 'structured exposure upsert clamps levels and avoids duplicate records');
for (let i = 0; i < LEARNING_LIMITS.MAX_RECORDS_PER_KIND + 9; i += 1) person = recordStructuredExposure(person, { kind: 'EDUCATION', topic: `topic-${i}`, provenance: 'MODEL_DERIVED_SIMULATION', sourceRef: `course-${i}` });
check(person.education.length === LEARNING_LIMITS.MAX_RECORDS_PER_KIND, 'structured education records remain bounded');

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
check([...afterDeathIds].every((ordinal) => isLivingBirthOrdinal(ledger, ordinal)), 'all survivor ordinals remain positively addressable after deaths');
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
const cappedHuge = refinePopulation({ worldId: 'world-big', ledger: huge, aggregate, count: INDIVIDUAL_LIMITS.MAX_ACTIVE + 500 });
check(cappedHuge.length === INDIVIDUAL_LIMITS.MAX_ACTIVE, 'ledger-aware huge refinement enforces active cap under oversized request');

let targeted = createDemographyLedger({ settlementId: 'targeted', population: 0, currentYear: 0, cohortSpan: 1 });
targeted = applyDemographicStep(targeted, { year: 1, births: 5, deaths: 0 });
targeted = applyDemographicStep(targeted, { year: 2, births: 4, deaths: 0 });
const firstCohortKey = cohortKey({ settlementId: 'targeted', birthYear: 1, cohortSpan: 1 });
targeted = applyDemographicStep(targeted, { year: 3, births: 0, deaths: 2, deathCohorts: [{ key: firstCohortKey, count: 2 }] });
const firstCohort = targeted.cohorts.find((entry) => entry.key === firstCohortKey);
check(firstCohort.births === 5 && firstCohort.deaths === 2 && firstCohort.living === 3, 'explicit cohort death allocation targets the requested tracked cohort');
check(demographicSummary(targeted).representedLiving === targeted.population, 'targeted cohort mortality preserves global demographic conservation');

console.log(`V2X-10 continuity/performance: ${checks} checks passed; huge-refine=${elapsedMs.toFixed(3)}ms on Node ${process.version}`);

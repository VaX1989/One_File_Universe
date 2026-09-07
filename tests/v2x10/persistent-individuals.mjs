import assert from 'node:assert/strict';
import { createDemographyLedger, applyDemographicStep, demographicSummary, DEMOGRAPHY_LIMITS } from '../../src/domains/v1/demography/ledger.js';
import { individualId } from '../../src/domains/v1/individuals/identity.js';
import { refineIndividuals, retainIndividual, appendHistoryRef, proposeIndividualAction, INDIVIDUAL_LIMITS } from '../../src/domains/v1/individuals/runtime.js';
import { reconcileIndividuals, reconcileDemography } from '../../src/domains/v1/individuals/reconcile.js';
import { transmitConventions, CULTURE_LIMITS } from '../../src/domains/v1/culture/transmission.js';

let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };

let ledger = createDemographyLedger({ settlementId: 's1', population: 100, currentYear: 20 });
ledger = applyDemographicStep(ledger, { year: 21, births: 7, deaths: 2 });
check(ledger.population === 105, 'birth/death conservation');
check(ledger.nextBirthOrdinal === 107, 'stable birth ordinal allocation');
check(demographicSummary(ledger).population === 105, 'summary matches ledger');
check(reconcileDemography({ aggregatePopulation: 105, ledger }).status === 'PASS', 'demography reconciles with aggregate');
check(reconcileDemography({ aggregatePopulation: 104, ledger }).status === 'FAIL', 'demography reconciliation fails closed on aggregate mismatch');

const idA = individualId({ worldId: 'w', settlementId: 's1', birthOrdinal: 4 });
const idB = individualId({ worldId: 'w', settlementId: 's1', birthOrdinal: 4 });
check(idA === idB, 'identity deterministic');
check(individualId({ worldId: 'e\u0301', settlementId: 's1', birthOrdinal: 4 }) === individualId({ worldId: '\u00e9', settlementId: 's1', birthOrdinal: 4 }), 'identity canonicalizes NFC-equivalent address parts');
check(individualId({ worldId: 'w2', settlementId: 's1', birthOrdinal: 4 }) !== idA, 'world identity domain separation');
check(individualId({ worldId: 'w', settlementId: 's2', birthOrdinal: 4 }) !== idA, 'settlement identity domain separation');
check(individualId({ worldId: 'w', settlementId: 's1', birthOrdinal: 5 }) !== idA, 'birth ordinal identity domain separation');
assert.throws(() => individualId({ worldId: 'w', settlementId: 's1', birthOrdinal: -1 }), /birthOrdinal/, 'negative birth ordinal is rejected'); checks += 1;
assert.throws(() => individualId({ worldId: '', settlementId: 's1', birthOrdinal: 0 }), /worldId is required/, 'empty world identity is rejected'); checks += 1;

const aggregate = { population: 1_000_000_000, roles: ['farmer', 'builder'], cultureConventions: ['market-day'], educationTopics: ['water'] };
const first = refineIndividuals({ worldId: 'w', settlementId: 's1', aggregate, startOrdinal: 4, count: 2, currentYear: 30 });
check(first.length === 2, 'tiny active set from huge aggregate');
check(first[0].id === idA, 'refine uses stable identity');
check(first[0].lineage.status === 'UNKNOWN_UNLESS_RETAINED' && first[0].lineage.parentIds.length === 0, 'no fabricated genealogy');
check(refineIndividuals({ worldId: 'w', settlementId: 's1', aggregate, startOrdinal: 4, count: 0 }).length === 0, 'zero-count refinement is empty');
check(refineIndividuals({ worldId: 'w', settlementId: 's1', aggregate: { population: 2 }, startOrdinal: 2, count: 1 }).length === 0, 'refinement outside addressable aggregate is empty');
assert.throws(() => refineIndividuals({ worldId: 'w', settlementId: 's1', aggregate: { population: -1 }, count: 1 }), /aggregate.population/, 'negative aggregate population is rejected'); checks += 1;

let person = appendHistoryRef(first[0], { eventId: 'evt-1', provenance: 'MODEL_DERIVED_SIMULATION', kind: 'WITNESSED' });
person = { ...person, culture: transmitConventions(person.culture, ['river-festival']) };
const retained = retainIndividual(person);
const retainedMap = new Map([[person.id, retained]]);
const revisited = refineIndividuals({ worldId: 'w', settlementId: 's1', aggregate, startOrdinal: 4, count: 1, retainedById: retainedMap, currentYear: 40 })[0];
check(revisited.id === person.id, 'identity survives eviction/revisit');
check(revisited.memories[0].eventId === 'evt-1', 'bounded admitted/model history ref survives revisit');
check(revisited.culture.conventions.includes('river-festival'), 'structured convention survives revisit');
const mismatchedRetained = { ...retained, id: 'person:not-this-person', role: 'forged-role' };
const mismatchRevisit = refineIndividuals({ worldId: 'w', settlementId: 's1', aggregate, startOrdinal: 4, count: 1, retainedById: new Map([[person.id, mismatchedRetained]]), currentYear: 40 })[0];
check(mismatchRevisit.role !== 'forged-role', 'retained state with a mismatched durable identity is ignored');

const cultureFlood = Array.from({ length: CULTURE_LIMITS.MAX_CONVENTIONS + 20 }, (_, index) => `convention-${String(index).padStart(2, '0')}`);
const saturatedCulture = transmitConventions(revisited.culture, cultureFlood);
check(saturatedCulture.conventions.length === CULTURE_LIMITS.MAX_CONVENTIONS, 'culture transmission remains bounded');
check([...saturatedCulture.conventions].join('|') === [...saturatedCulture.conventions].sort().join('|'), 'culture convention representation is deterministic');
check(saturatedCulture.semantics === 'structured-conventions-not-real-language-or-belief-truth', 'culture does not claim real language or belief truth');
const dedupedCulture = transmitConventions(revisited.culture, ['river-festival', 'river-festival']);
check(dedupedCulture.conventions.filter((value) => value === 'river-festival').length === 1, 'culture convention duplicates collapse deterministically');

const proposal = proposeIndividualAction(revisited, { kind: 'REQUEST_MOVE', targetId: 's2' });
check(proposal.authority === 'PROPOSAL_ONLY_REQUIRES_P4_ADMISSION', 'individual actions cannot self-admit');
check(Object.isFrozen(proposal) && Object.isFrozen(proposal.parameters), 'proposal envelope and top-level parameter record are immutable');

const recon = reconcileIndividuals({ aggregate, people: first, startOrdinal: 4 });
check(recon.status === 'PASS' && recon.projection.materializedCount === 2, 'independent projection/reconcile passes');
const duplicateRecon = reconcileIndividuals({ aggregate, people: [first[0], first[0]], startOrdinal: 4 });
check(duplicateRecon.status === 'FAIL' && duplicateRecon.defects.some((defect) => defect.startsWith('duplicate-id:')), 'aggregate refinement reconciliation rejects duplicate identity');
const duplicateOrdinalRecon = reconcileIndividuals({ aggregate, people: [first[0], { ...first[1], birthOrdinal: first[0].birthOrdinal }], startOrdinal: 4 });
check(duplicateOrdinalRecon.status === 'FAIL' && duplicateOrdinalRecon.defects.some((defect) => defect.startsWith('duplicate-ordinal:')), 'aggregate refinement reconciliation rejects duplicate birth ordinals');
const outOfRangeRecon = reconcileIndividuals({ aggregate: { population: 5, nextBirthOrdinal: 5 }, people: [{ ...first[0], birthOrdinal: 9 }], startOrdinal: 0 });
check(outOfRangeRecon.status === 'FAIL' && outOfRangeRecon.defects.some((defect) => defect.startsWith('ordinal-outside-address-space:')), 'aggregate refinement reconciliation rejects out-of-address-space ordinal');

const capped = refineIndividuals({ worldId: 'w', settlementId: 's1', aggregate, startOrdinal: 0, count: INDIVIDUAL_LIMITS.MAX_ACTIVE + 999 });
check(capped.length === INDIVIDUAL_LIMITS.MAX_ACTIVE, 'active individual working set bounded');

for (let year = 22; year < 22 + DEMOGRAPHY_LIMITS.MAX_COMMITMENTS + 20; year += 1) ledger = applyDemographicStep(ledger, { year, births: 1, deaths: 1 });
check(ledger.commitments.length === DEMOGRAPHY_LIMITS.MAX_COMMITMENTS, 'demography commitment history bounded');
check(ledger.population === 105, 'long-run flow conservation');
check(ledger.commitments.at(-1).population === ledger.population, 'last bounded demographic commitment matches current population');

let fuzz = createDemographyLedger({ settlementId: 'fuzz', population: 200, currentYear: 0, cohortSpan: 10 });
let expectedPopulation = 200;
let expectedBirthAddress = 200;
let prng = 0x6d2b79f5;
for (let year = 1; year <= 120; year += 1) {
  prng = Math.imul(prng ^ (prng >>> 15), 1 | prng); prng ^= prng + Math.imul(prng ^ (prng >>> 7), 61 | prng); prng ^= prng >>> 14;
  const births = (prng >>> 0) % 4;
  const deaths = Math.min(expectedPopulation + births, ((prng >>> 8) >>> 0) % 3);
  fuzz = applyDemographicStep(fuzz, { year, births, deaths });
  expectedPopulation += births - deaths;
  expectedBirthAddress += births;
  const fuzzSummary = demographicSummary(fuzz);
  check(fuzz.population === expectedPopulation, `deterministic demographic sequence conserves population at year ${year}`);
  check(fuzz.nextBirthOrdinal === expectedBirthAddress, `deterministic demographic sequence never reuses birth address at year ${year}`);
  check(fuzzSummary.representedLiving === expectedPopulation, `deterministic demographic sequence preserves represented living at year ${year}`);
  check(reconcileDemography({ aggregatePopulation: expectedPopulation, ledger: fuzz }).status === 'PASS', `deterministic demographic sequence reconciles at year ${year}`);
}

console.log(`V2X-10 persistent-individuals: ${checks} checks passed`);

import assert from 'node:assert/strict';
import { createDemographyLedger, applyDemographicStep, demographicSummary, DEMOGRAPHY_LIMITS } from '../../src/domains/v1/demography/ledger.js';
import { individualId } from '../../src/domains/v1/individuals/identity.js';
import { refineIndividuals, retainIndividual, appendHistoryRef, proposeIndividualAction, INDIVIDUAL_LIMITS } from '../../src/domains/v1/individuals/runtime.js';
import { reconcileIndividuals, reconcileDemography } from '../../src/domains/v1/individuals/reconcile.js';
import { transmitConventions } from '../../src/domains/v1/culture/transmission.js';

let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };

let ledger = createDemographyLedger({ settlementId: 's1', population: 100, currentYear: 20 });
ledger = applyDemographicStep(ledger, { year: 21, births: 7, deaths: 2 });
check(ledger.population === 105, 'birth/death conservation');
check(ledger.nextBirthOrdinal === 107, 'stable birth ordinal allocation');
check(demographicSummary(ledger).population === 105, 'summary matches ledger');
check(reconcileDemography({ aggregatePopulation: 105, ledger }).status === 'PASS', 'demography reconciles with aggregate');

const idA = individualId({ worldId: 'w', settlementId: 's1', birthOrdinal: 4 });
const idB = individualId({ worldId: 'w', settlementId: 's1', birthOrdinal: 4 });
check(idA === idB, 'identity deterministic');

const aggregate = { population: 1_000_000_000, roles: ['farmer', 'builder'], cultureConventions: ['market-day'], educationTopics: ['water'] };
const first = refineIndividuals({ worldId: 'w', settlementId: 's1', aggregate, startOrdinal: 4, count: 2, currentYear: 30 });
check(first.length === 2, 'tiny active set from huge aggregate');
check(first[0].id === idA, 'refine uses stable identity');
check(first[0].lineage.status === 'UNKNOWN_UNLESS_RETAINED' && first[0].lineage.parentIds.length === 0, 'no fabricated genealogy');

let person = appendHistoryRef(first[0], { eventId: 'evt-1', provenance: 'MODEL_DERIVED_SIMULATION', kind: 'WITNESSED' });
person = { ...person, culture: transmitConventions(person.culture, ['river-festival']) };
const retained = retainIndividual(person);
const retainedMap = new Map([[person.id, retained]]);
const revisited = refineIndividuals({ worldId: 'w', settlementId: 's1', aggregate, startOrdinal: 4, count: 1, retainedById: retainedMap, currentYear: 40 })[0];
check(revisited.id === person.id, 'identity survives eviction/revisit');
check(revisited.memories[0].eventId === 'evt-1', 'bounded admitted/model history ref survives revisit');
check(revisited.culture.conventions.includes('river-festival'), 'structured convention survives revisit');

const proposal = proposeIndividualAction(revisited, { kind: 'REQUEST_MOVE', targetId: 's2' });
check(proposal.authority === 'PROPOSAL_ONLY_REQUIRES_P4_ADMISSION', 'individual actions cannot self-admit');

const recon = reconcileIndividuals({ aggregate, people: first, startOrdinal: 4 });
check(recon.status === 'PASS' && recon.projection.materializedCount === 2, 'independent projection/reconcile passes');

const capped = refineIndividuals({ worldId: 'w', settlementId: 's1', aggregate, startOrdinal: 0, count: INDIVIDUAL_LIMITS.MAX_ACTIVE + 999 });
check(capped.length === INDIVIDUAL_LIMITS.MAX_ACTIVE, 'active individual working set bounded');

for (let year = 22; year < 22 + DEMOGRAPHY_LIMITS.MAX_COMMITMENTS + 20; year += 1) ledger = applyDemographicStep(ledger, { year, births: 1, deaths: 1 });
check(ledger.commitments.length === DEMOGRAPHY_LIMITS.MAX_COMMITMENTS, 'demography commitment history bounded');
check(ledger.population === 105, 'long-run flow conservation');

console.log(`V2X-10 persistent-individuals: ${checks} checks passed`);

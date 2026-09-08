import { isLivingBirthOrdinal } from '../demography/ledger.js';
import { individualId } from './identity.js';

const compareText = (a, b) => (String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0);

function expectedIdentity(person) {
  return individualId({ worldId: person.worldId, settlementId: person.settlementId, birthOrdinal: person.birthOrdinal });
}

export function projectIndividuals(people) {
  const roles = new Map();
  for (const person of people) roles.set(person.role, (roles.get(person.role) || 0) + 1);
  return Object.freeze({ materializedCount: people.length, roleCounts: Object.freeze(Object.fromEntries([...roles.entries()].sort(([a], [b]) => compareText(a, b)))) });
}

export function reconcileIndividuals({ aggregate, people, startOrdinal = 0 } = {}) {
  if (!aggregate || !Number.isSafeInteger(aggregate.population) || aggregate.population < 0) throw new TypeError('aggregate.population is required');
  const addressableBirths = Number.isSafeInteger(aggregate.nextBirthOrdinal) ? aggregate.nextBirthOrdinal : aggregate.population;
  if (addressableBirths < aggregate.population) throw new RangeError('aggregate.nextBirthOrdinal cannot be below living population');
  const ids = new Set();
  const ordinals = new Set();
  const defects = [];
  for (const person of people || []) {
    if (ids.has(person.id)) defects.push(`duplicate-id:${person.id}`);
    ids.add(person.id);
    if (ordinals.has(person.birthOrdinal)) defects.push(`duplicate-ordinal:${person.birthOrdinal}`);
    ordinals.add(person.birthOrdinal);
    if (person.birthOrdinal < startOrdinal || person.birthOrdinal >= addressableBirths) defects.push(`ordinal-outside-address-space:${person.birthOrdinal}`);
    try {
      const expected = expectedIdentity(person);
      if (person.id !== expected) defects.push(`identity-address-mismatch:${person.id}:${expected}`);
    } catch (error) {
      defects.push(`invalid-identity-address:${person?.id ?? 'unknown'}:${String(error?.message || error)}`);
    }
  }
  if ((people || []).length > aggregate.population) defects.push('materialized-count-exceeds-living-aggregate');
  return Object.freeze({ status: defects.length ? 'FAIL' : 'PASS', defects: Object.freeze(defects), projection: projectIndividuals(people || []), aggregatePopulation: aggregate.population, addressableBirths });
}

export function reconcileDemography({ aggregatePopulation, ledger }) {
  const defects = [];
  const cohortLiving = ledger.cohorts.reduce((sum, cohort) => sum + cohort.living, 0);
  const representedLiving = ledger.legacyLiving + cohortLiving;
  if (ledger.population !== aggregatePopulation) defects.push(`population-mismatch:${ledger.population}:${aggregatePopulation}`);
  if (ledger.totalBirths < 0 || ledger.totalDeaths < 0) defects.push('negative-flow');
  if (representedLiving !== ledger.population) defects.push(`represented-living-mismatch:${representedLiving}:${ledger.population}`);
  if (ledger.nextBirthOrdinal !== ledger.initialPopulation + ledger.totalBirths) defects.push('birth-address-space-mismatch');
  return Object.freeze({ status: defects.length ? 'FAIL' : 'PASS', defects: Object.freeze(defects) });
}

export function reconcilePopulationRefinement({ ledger, people }) {
  const defects = [];
  const ids = new Set();
  const ordinals = new Set();
  for (const person of people || []) {
    if (ids.has(person.id)) defects.push(`duplicate-id:${person.id}`);
    ids.add(person.id);
    if (ordinals.has(person.birthOrdinal)) defects.push(`duplicate-ordinal:${person.birthOrdinal}`);
    ordinals.add(person.birthOrdinal);
    if (person.settlementId !== ledger.settlementId) defects.push(`settlement-mismatch:${person.id}`);
    try {
      const expected = expectedIdentity(person);
      if (person.id !== expected) defects.push(`identity-address-mismatch:${person.id}:${expected}`);
    } catch (error) {
      defects.push(`invalid-identity-address:${person?.id ?? 'unknown'}:${String(error?.message || error)}`);
    }
    if (!isLivingBirthOrdinal(ledger, person.birthOrdinal)) defects.push(`materialized-nonliving-ordinal:${person.birthOrdinal}`);
  }
  if ((people || []).length > ledger.population) defects.push('materialized-count-exceeds-living-aggregate');
  return Object.freeze({ status: defects.length ? 'FAIL' : 'PASS', defects: Object.freeze(defects) });
}

export function reconcileHouseholds({ people = [], households = [] } = {}) {
  const defects = [];
  const expected = new Map();
  for (const person of people) {
    if (!expected.has(person.householdId)) expected.set(person.householdId, []);
    expected.get(person.householdId).push(person.id);
  }
  const seen = new Set();
  for (const household of households) {
    if (seen.has(household.id)) defects.push(`duplicate-household:${household.id}`);
    seen.add(household.id);
    const expectedMembers = (expected.get(household.id) || []).slice().sort(compareText);
    const actualMembers = [...household.activeMemberIds].sort(compareText);
    if (JSON.stringify(expectedMembers) !== JSON.stringify(actualMembers)) defects.push(`household-membership-mismatch:${household.id}`);
    if (household.kinshipStatus !== 'UNKNOWN_UNLESS_RETAINED') defects.push(`household-fabricated-kinship:${household.id}`);
  }
  if (seen.size !== expected.size) defects.push(`household-count-mismatch:${seen.size}:${expected.size}`);
  return Object.freeze({ status: defects.length ? 'FAIL' : 'PASS', defects: Object.freeze(defects) });
}

export function projectIndividuals(people) {
  const roles = new Map();
  for (const person of people) roles.set(person.role, (roles.get(person.role) || 0) + 1);
  return Object.freeze({
    materializedCount: people.length,
    roleCounts: Object.freeze(Object.fromEntries([...roles.entries()].sort(([a], [b]) => a.localeCompare(b))))
  });
}

export function reconcileIndividuals({ aggregate, people, startOrdinal = 0 } = {}) {
  if (!aggregate || !Number.isInteger(aggregate.population)) throw new TypeError('aggregate.population is required');
  const ids = new Set();
  const ordinals = new Set();
  const defects = [];
  for (const person of people || []) {
    if (ids.has(person.id)) defects.push(`duplicate-id:${person.id}`);
    ids.add(person.id);
    if (ordinals.has(person.birthOrdinal)) defects.push(`duplicate-ordinal:${person.birthOrdinal}`);
    ordinals.add(person.birthOrdinal);
    if (person.birthOrdinal < startOrdinal || person.birthOrdinal >= aggregate.population) defects.push(`ordinal-outside-aggregate:${person.birthOrdinal}`);
  }
  if ((people || []).length > aggregate.population) defects.push('materialized-count-exceeds-aggregate');
  return Object.freeze({
    status: defects.length ? 'FAIL' : 'PASS',
    defects: Object.freeze(defects),
    projection: projectIndividuals(people || []),
    aggregatePopulation: aggregate.population
  });
}

export function reconcileDemography({ aggregatePopulation, ledger }) {
  const defects = [];
  if (ledger.population !== aggregatePopulation) defects.push(`population-mismatch:${ledger.population}:${aggregatePopulation}`);
  if (ledger.totalBirths < 0 || ledger.totalDeaths < 0) defects.push('negative-flow');
  if (ledger.cohorts.reduce((sum, cohort) => sum + cohort.living, 0) > ledger.population) defects.push('cohort-living-exceeds-population');
  return Object.freeze({ status: defects.length ? 'FAIL' : 'PASS', defects: Object.freeze(defects) });
}

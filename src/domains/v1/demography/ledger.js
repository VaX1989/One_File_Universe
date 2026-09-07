const MAX_COHORTS = 64;
const MAX_COMMITMENTS = 512;

function assertFiniteInt(value, name, min = 0) {
  if (!Number.isInteger(value) || value < min) throw new TypeError(`${name} must be an integer >= ${min}`);
  return value;
}

function stableCompare(a, b) {
  return String(a).localeCompare(String(b));
}

export function cohortKey({ settlementId, birthYear, cohortSpan = 5 }) {
  assertFiniteInt(birthYear, 'birthYear');
  assertFiniteInt(cohortSpan, 'cohortSpan', 1);
  const startYear = Math.floor(birthYear / cohortSpan) * cohortSpan;
  return `${settlementId}:cohort:${startYear}-${startYear + cohortSpan - 1}`;
}

export function createDemographyLedger({ settlementId, population = 0, currentYear = 0, cohortSpan = 5 } = {}) {
  if (!settlementId) throw new TypeError('settlementId is required');
  assertFiniteInt(population, 'population');
  assertFiniteInt(currentYear, 'currentYear');
  assertFiniteInt(cohortSpan, 'cohortSpan', 1);
  return Object.freeze({
    schema: 'ofu-demography-ledger-1',
    settlementId: String(settlementId),
    currentYear,
    cohortSpan,
    population,
    totalBirths: 0,
    totalDeaths: 0,
    nextBirthOrdinal: population,
    cohorts: Object.freeze([]),
    commitments: Object.freeze([])
  });
}

function normalizeCohorts(map) {
  return Object.freeze([...map.values()]
    .filter((entry) => entry.living > 0 || entry.births > 0 || entry.deaths > 0)
    .sort((a, b) => a.startYear - b.startYear || stableCompare(a.key, b.key))
    .slice(-MAX_COHORTS)
    .map((entry) => Object.freeze({ ...entry })));
}

function appendCommitment(commitments, commitment) {
  const next = [...commitments, Object.freeze(commitment)];
  return Object.freeze(next.slice(-MAX_COMMITMENTS));
}

export function applyDemographicStep(ledger, { year, births = 0, deaths = 0, deathCohorts = [] } = {}) {
  assertFiniteInt(year, 'year');
  assertFiniteInt(births, 'births');
  assertFiniteInt(deaths, 'deaths');
  if (year < ledger.currentYear) throw new RangeError('demographic time cannot move backwards');
  if (deaths > ledger.population + births) throw new RangeError('deaths exceed available population');

  const cohorts = new Map(ledger.cohorts.map((entry) => [entry.key, { ...entry }]));
  if (births > 0) {
    const key = cohortKey({ settlementId: ledger.settlementId, birthYear: year, cohortSpan: ledger.cohortSpan });
    const startYear = Math.floor(year / ledger.cohortSpan) * ledger.cohortSpan;
    const cohort = cohorts.get(key) || { key, startYear, endYear: startYear + ledger.cohortSpan - 1, births: 0, deaths: 0, living: 0 };
    cohort.births += births;
    cohort.living += births;
    cohorts.set(key, cohort);
  }

  let remainingDeaths = deaths;
  for (const request of deathCohorts) {
    if (remainingDeaths <= 0) break;
    const cohort = cohorts.get(request.key);
    if (!cohort) continue;
    const requested = Math.min(assertFiniteInt(request.count, 'death cohort count'), remainingDeaths, cohort.living);
    cohort.deaths += requested;
    cohort.living -= requested;
    remainingDeaths -= requested;
  }
  if (remainingDeaths > 0) {
    const ordered = [...cohorts.values()].sort((a, b) => a.startYear - b.startYear || stableCompare(a.key, b.key));
    for (const cohort of ordered) {
      if (remainingDeaths <= 0) break;
      const take = Math.min(remainingDeaths, cohort.living);
      cohort.deaths += take;
      cohort.living -= take;
      remainingDeaths -= take;
    }
  }

  const population = ledger.population + births - deaths;
  const commitment = {
    type: 'DEMOGRAPHY_STEP', year, births, deaths, population,
    firstBirthOrdinal: ledger.nextBirthOrdinal,
    nextBirthOrdinal: ledger.nextBirthOrdinal + births
  };

  return Object.freeze({
    ...ledger,
    currentYear: year,
    population,
    totalBirths: ledger.totalBirths + births,
    totalDeaths: ledger.totalDeaths + deaths,
    nextBirthOrdinal: ledger.nextBirthOrdinal + births,
    cohorts: normalizeCohorts(cohorts),
    commitments: appendCommitment(ledger.commitments, commitment)
  });
}

export function demographicSummary(ledger) {
  return Object.freeze({
    settlementId: ledger.settlementId,
    currentYear: ledger.currentYear,
    population: ledger.population,
    totalBirths: ledger.totalBirths,
    totalDeaths: ledger.totalDeaths,
    cohortLiving: ledger.cohorts.reduce((sum, cohort) => sum + cohort.living, 0),
    commitmentCount: ledger.commitments.length
  });
}

export const DEMOGRAPHY_LIMITS = Object.freeze({ MAX_COHORTS, MAX_COMMITMENTS });

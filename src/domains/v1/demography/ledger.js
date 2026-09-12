const MAX_COHORTS = 1024;
const MAX_COMMITMENTS = 512;

function assertFiniteInt(value, name, min = 0) {
  if (!Number.isSafeInteger(value) || value < min) throw new TypeError(`${name} must be a safe integer >= ${min}`);
  return value;
}

function safeAdd(a, b, name) {
  const value = a + b;
  if (!Number.isSafeInteger(value)) throw new RangeError(`${name} exceeds safe integer range`);
  return value;
}

function stableCompare(a, b) {
  a = String(a); b = String(b);
  return a < b ? -1 : a > b ? 1 : 0;
}

function hash32(text) {
  let value = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) value = Math.imul(value ^ text.charCodeAt(i), 16777619) >>> 0;
  return value >>> 0;
}

function rotationFor(pool) {
  if (pool.births <= 0) throw new RangeError('cannot address an empty population pool');
  return Number(BigInt(hash32(pool.key)) % BigInt(pool.births));
}

function rotatedOrdinal(firstBirthOrdinal, births, deaths, survivorOffset, key) {
  if (births <= 0) throw new RangeError('cannot address an empty population pool');
  const n = BigInt(births);
  const rotation = BigInt(hash32(key)) % n;
  const rank = BigInt(deaths + survivorOffset);
  const local = (rank - rotation + n) % n;
  const ordinal = BigInt(firstBirthOrdinal) + local;
  const value = Number(ordinal);
  if (!Number.isSafeInteger(value)) throw new RangeError('birth ordinal exceeds safe integer range');
  return value;
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
    schema: 'ofu-demography-ledger-2',
    settlementId: String(settlementId),
    currentYear,
    cohortSpan,
    population,
    initialPopulation: population,
    legacyLiving: population,
    legacyDeaths: 0,
    totalBirths: 0,
    totalDeaths: 0,
    nextBirthOrdinal: population,
    cohorts: Object.freeze([]),
    commitments: Object.freeze([])
  });
}

function normalizeCohorts(map) {
  const live = [...map.values()]
    .filter((entry) => entry.living > 0 || entry.births > 0 || entry.deaths > 0)
    .sort((a, b) => a.startYear - b.startYear || stableCompare(a.key, b.key));
  if (live.length > MAX_COHORTS) throw new RangeError(`demography cohort horizon exceeds bounded limit ${MAX_COHORTS}`);
  return Object.freeze(live.map((entry) => Object.freeze({ ...entry })));
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
  const available = safeAdd(ledger.population, births, 'population plus births');
  if (deaths > available) throw new RangeError('deaths exceed available population');
  const nextBirthOrdinal = safeAdd(ledger.nextBirthOrdinal, births, 'nextBirthOrdinal');
  const totalBirths = safeAdd(ledger.totalBirths, births, 'totalBirths');
  const totalDeaths = safeAdd(ledger.totalDeaths, deaths, 'totalDeaths');

  const cohorts = new Map(ledger.cohorts.map((entry) => [entry.key, { ...entry }]));
  if (births > 0) {
    const key = cohortKey({ settlementId: ledger.settlementId, birthYear: year, cohortSpan: ledger.cohortSpan });
    const startYear = Math.floor(year / ledger.cohortSpan) * ledger.cohortSpan;
    const cohort = cohorts.get(key) || {
      key,
      startYear,
      endYear: startYear + ledger.cohortSpan - 1,
      firstBirthOrdinal: ledger.nextBirthOrdinal,
      births: 0,
      deaths: 0,
      living: 0
    };
    cohort.births = safeAdd(cohort.births, births, 'cohort births');
    cohort.living = safeAdd(cohort.living, births, 'cohort living');
    cohorts.set(key, cohort);
  }

  let legacyLiving = ledger.legacyLiving;
  let legacyDeaths = ledger.legacyDeaths;
  let remainingDeaths = deaths;
  for (const request of deathCohorts) {
    if (remainingDeaths <= 0) break;
    const cohort = cohorts.get(request.key);
    if (!cohort) continue;
    const requested = Math.min(assertFiniteInt(request.count, 'death cohort count'), remainingDeaths, cohort.living);
    cohort.deaths = safeAdd(cohort.deaths, requested, 'cohort deaths');
    cohort.living -= requested;
    remainingDeaths -= requested;
  }

  if (remainingDeaths > 0 && legacyLiving > 0) {
    const take = Math.min(remainingDeaths, legacyLiving);
    legacyLiving -= take;
    legacyDeaths = safeAdd(legacyDeaths, take, 'legacyDeaths');
    remainingDeaths -= take;
  }

  if (remainingDeaths > 0) {
    const ordered = [...cohorts.values()].sort((a, b) => a.startYear - b.startYear || stableCompare(a.key, b.key));
    for (const cohort of ordered) {
      if (remainingDeaths <= 0) break;
      const take = Math.min(remainingDeaths, cohort.living);
      cohort.deaths = safeAdd(cohort.deaths, take, 'cohort deaths');
      cohort.living -= take;
      remainingDeaths -= take;
    }
  }

  if (remainingDeaths !== 0) throw new Error('internal demographic death allocation mismatch');

  const population = available - deaths;
  if (!Number.isSafeInteger(population)) throw new RangeError('population exceeds safe integer range');
  const commitment = {
    type: 'DEMOGRAPHY_STEP', year, births, deaths, population,
    firstBirthOrdinal: ledger.nextBirthOrdinal,
    nextBirthOrdinal
  };
  const normalizedCohorts = normalizeCohorts(cohorts);
  const representedLiving = legacyLiving + normalizedCohorts.reduce((sum, cohort) => safeAdd(sum, cohort.living, 'represented living'), 0);
  if (representedLiving !== population) throw new Error(`demographic conservation mismatch:${representedLiving}:${population}`);

  return Object.freeze({
    ...ledger,
    schema: 'ofu-demography-ledger-2',
    currentYear: year,
    population,
    legacyLiving,
    legacyDeaths,
    totalBirths,
    totalDeaths,
    nextBirthOrdinal,
    cohorts: normalizedCohorts,
    commitments: appendCommitment(ledger.commitments, commitment)
  });
}

export function demographicPools(ledger) {
  const pools = [];
  if (ledger.initialPopulation > 0) {
    pools.push(Object.freeze({
      key: `${ledger.settlementId}:legacy`,
      firstBirthOrdinal: 0,
      births: ledger.initialPopulation,
      deaths: ledger.legacyDeaths,
      living: ledger.legacyLiving,
      birthYear: null,
      cohortKey: null
    }));
  }
  for (const cohort of ledger.cohorts) {
    pools.push(Object.freeze({
      key: cohort.key,
      firstBirthOrdinal: cohort.firstBirthOrdinal,
      births: cohort.births,
      deaths: cohort.deaths,
      living: cohort.living,
      birthYear: cohort.startYear,
      cohortKey: cohort.key
    }));
  }
  return Object.freeze(pools.sort((a, b) => a.firstBirthOrdinal - b.firstBirthOrdinal));
}

export function selectLivingMembers(ledger, { start = 0, count = 1 } = {}) {
  assertFiniteInt(start, 'start');
  assertFiniteInt(count, 'count');
  if (start >= ledger.population || count === 0) return Object.freeze([]);
  const wanted = Math.min(count, ledger.population - start);
  const result = [];
  let livingCursor = 0;
  for (const pool of demographicPools(ledger)) {
    if (result.length >= wanted) break;
    const poolStart = livingCursor;
    const poolEnd = safeAdd(livingCursor, pool.living, 'living cursor');
    livingCursor = poolEnd;
    if (start >= poolEnd) continue;
    const localStart = Math.max(0, start - poolStart);
    for (let local = localStart; local < pool.living && result.length < wanted; local += 1) {
      result.push(Object.freeze({
        birthOrdinal: rotatedOrdinal(pool.firstBirthOrdinal, pool.births, pool.deaths, local, pool.key),
        birthYear: pool.birthYear,
        cohortKey: pool.cohortKey,
        source: pool.cohortKey ? 'TRACKED_COHORT' : 'LEGACY_AGGREGATE'
      }));
    }
  }
  return Object.freeze(result);
}

export function isLivingBirthOrdinal(ledger, birthOrdinal) {
  assertFiniteInt(birthOrdinal, 'birthOrdinal');
  for (const pool of demographicPools(ledger)) {
    const poolEnd = safeAdd(pool.firstBirthOrdinal, pool.births, 'pool address end');
    if (birthOrdinal < pool.firstBirthOrdinal || birthOrdinal >= poolEnd) continue;
    if (pool.births <= 0) return false;
    const local = birthOrdinal - pool.firstBirthOrdinal;
    const rank = (local + rotationFor(pool)) % pool.births;
    return rank >= pool.deaths;
  }
  return false;
}

export function demographicSummary(ledger) {
  const cohortLiving = ledger.cohorts.reduce((sum, cohort) => safeAdd(sum, cohort.living, 'cohort living summary'), 0);
  return Object.freeze({
    settlementId: ledger.settlementId,
    currentYear: ledger.currentYear,
    population: ledger.population,
    addressableBirths: ledger.nextBirthOrdinal,
    legacyLiving: ledger.legacyLiving,
    totalBirths: ledger.totalBirths,
    totalDeaths: ledger.totalDeaths,
    cohortLiving,
    representedLiving: safeAdd(ledger.legacyLiving, cohortLiving, 'represented living summary'),
    commitmentCount: ledger.commitments.length
  });
}

export const DEMOGRAPHY_LIMITS = Object.freeze({ MAX_COHORTS, MAX_COMMITMENTS });

export const VERSION = 'v1x15-astronomy-depth-research-1';
export const AUTHORITY = 'RESEARCH_ONLY';
export const Q16_ONE = 65536n;
export const Q32_ONE = 1n << 32n;

export const MODEL_CATALOG = Object.freeze({
  morphologyPosterior: Object.freeze({
    modelId: 'rd15-morphology-posterior-1',
    classification: 'CANONICAL_SUCCESSOR_CANDIDATE',
    evidence: 'EMPIRICALLY_INSPIRED',
    fidelity: 'LOW_TO_MODERATE',
    validity: 'Local-universe qualitative mass/environment trends only; not a fitted survey likelihood.',
    assumptions: 'P3 stellar-mass proxy and P3 environment density are usable conditioning variables.',
    limitations: 'Weights are deliberately coarse and are not calibrated to GAMA/Dressler samples.'
  }),
  populationEvolution: Object.freeze({
    modelId: 'rd15-stellar-population-evolution-1',
    classification: 'CANONICAL_SUCCESSOR_CANDIDATE',
    evidence: 'EMPIRICALLY_INSPIRED_PLUS_P3_BASELINE',
    fidelity: 'LOW',
    validity: 'Population mixture summary and phase-progress abstraction only.',
    assumptions: 'P3 age, metallicity, star-formation activity, and stellar lifetime proxies remain the baseline inputs.',
    limitations: 'No isochrone interpolation, remnant-mass relation, rotation, alpha-enhancement, binaries, or detailed photometry.'
  }),
  multiplicityOrbitPrior: Object.freeze({
    modelId: 'rd15-multiplicity-orbit-prior-1',
    classification: 'CANONICAL_SUCCESSOR_CANDIDATE',
    evidence: 'EMPIRICALLY_INSPIRED',
    fidelity: 'LOW_TO_MODERATE',
    validity: 'Main-sequence-like systems; qualitative primary-mass and period/q/e trends.',
    assumptions: 'Frozen P3 remains authoritative for system existence and stellar component count.',
    limitations: 'Not the Moe-Di Stefano fitted joint PDF; no dynamical stability integration or binary evolution.'
  }),
  cosmicWebGradientPrior: Object.freeze({
    modelId: 'rd15-cosmic-gradient-prior-1',
    classification: 'MODEL_DERIVED_ONLY',
    evidence: 'HYPOTHETICAL_BASE_FIELD',
    fidelity: 'STYLIZED',
    validity: 'Synthetic orientation/context prior over the current P3 procedural density field.',
    assumptions: 'Local gradient of the P3 field is useful as a visual/spatial prior.',
    limitations: 'P3 density is not a calibrated cosmological density field; axis is not an observed or physical coordinate.'
  }),
  observabilityProxy: Object.freeze({
    modelId: 'rd15-observability-proxy-1',
    classification: 'MODEL_DERIVED_QUERY_ONLY',
    evidence: 'FORMAL_GEOMETRY_PLUS_STYLIZED_SELECTION',
    fidelity: 'LOW',
    validity: 'Relative inverse-square flux and parallax geometry for externally supplied observer distance.',
    assumptions: 'P3 luminosity proxy is treated as bolometric luminosity relative to solar and distance is supplied by query context.',
    limitations: 'Not a Gaia/TESS/Roman selection function; no bandpass, extinction, scanning law, color, saturation, variability, or crowding calibration.'
  })
});

function bi(value, name) {
  try { return BigInt(value); } catch { throw new TypeError(`${name} must be integer-coercible`); }
}
function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
function abs(x) { return x < 0n ? -x : x; }
function scaleU32(draw, span) { return (bi(draw, 'draw') * span) >> 32n; }
function readU32(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 4) throw new TypeError('derive() must return at least four bytes');
  return BigInt((((bytes[0] * 0x1000000) + (bytes[1] << 16) + (bytes[2] << 8) + bytes[3]) >>> 0));
}
function normalize3L1(x, y, z) {
  const norm = abs(x) + abs(y) + abs(z);
  if (norm === 0n) return { xQ16: 0n, yQ16: 0n, zQ16: 0n, l1Q16: 0n };
  return {
    xQ16: (x * Q16_ONE) / norm,
    yQ16: (y * Q16_ONE) / norm,
    zQ16: (z * Q16_ONE) / norm,
    l1Q16: Q16_ONE
  };
}

export function morphologyWeightsQ16({ massLog10MilliDex, environmentDensityQ16 }) {
  const mass = clamp(bi(massLog10MilliDex, 'massLog10MilliDex'), 7000n, 12000n);
  const density = clamp(bi(environmentDensityQ16, 'environmentDensityQ16'), 0n, 65535n);
  const massTerm = ((mass - 7000n) * 30000n) / 5000n;
  const densityTerm = (density * 18000n) / 65535n;
  const spheroid = clamp(5000n + massTerm + densityTerm, 2000n, 50000n);
  const irregular = clamp(18000n - massTerm / 3n - densityTerm / 4n, 500n, 18000n);
  const disk = Q16_ONE - spheroid - irregular;
  if (disk < 0n) throw new RangeError('morphology weights overflow Q16');
  return Object.freeze({ SPHEROID: spheroid, DISK: disk, IRREGULAR: irregular });
}

export function populationMixtureQ16({ morphology, populationAgeMyr, starFormationActivityQ16 }) {
  const age = clamp(bi(populationAgeMyr, 'populationAgeMyr'), 0n, 13800n);
  const sfa = clamp(bi(starFormationActivityQ16, 'starFormationActivityQ16'), 0n, 65535n);
  const ageQ16 = (age * Q16_ONE) / 13800n;
  const youngRaw = 2000n + sfa;
  const oldRaw = 4000n + ageQ16 + (morphology === 'SPHEROID' ? 20000n : morphology === 'IRREGULAR' ? 0n : 7000n);
  const midRaw = 18000n + (Q16_ONE - abs(ageQ16 - 32768n)) / 2n;
  const total = youngRaw + oldRaw + midRaw;
  const young = (youngRaw * Q16_ONE) / total;
  const old = (oldRaw * Q16_ONE) / total;
  const intermediate = Q16_ONE - young - old;
  return Object.freeze({ YOUNG: young, INTERMEDIATE: intermediate, OLD: old });
}

export function evolutionSummary(starFacts) {
  const age = bi(starFacts.baselineAgeMyr ?? starFacts.ageMyr, 'stellar age');
  const lifetime = bi(starFacts.mainSequenceLifetimeMyr, 'mainSequenceLifetimeMyr');
  const evolutionaryClass = String(starFacts.baselineEvolutionaryClass ?? starFacts.evolutionaryClass ?? 'UNKNOWN');
  const progressQ16 = lifetime > 0n ? clamp((age * Q16_ONE) / lifetime, 0n, Q16_ONE * 4n) : Q16_ONE * 4n;
  const regime = evolutionaryClass === 'MAIN_SEQUENCE'
    ? (progressQ16 < 32768n ? 'EARLY_MAIN_SEQUENCE' : progressQ16 < Q16_ONE ? 'LATE_MAIN_SEQUENCE' : 'POST_BASELINE_LIFETIME')
    : evolutionaryClass === 'EVOLVED' ? 'EVOLVED_PROXY' : evolutionaryClass === 'REMNANT' ? 'REMNANT_PROXY' : 'UNKNOWN_PROXY';
  return Object.freeze({ evolutionaryClass, lifetimeProgressQ16: progressQ16, regime, upgradeTarget: 'MIST_OR_EQUIVALENT_GRID_INTERPOLATION' });
}

export function companionOrbitCandidate({ primaryMassMilliSolar, componentIndex, periodDrawU32, massRatioDrawU32, eccentricityDrawU32, minLogPeriodMilliDex = 0n }) {
  const primary = clamp(bi(primaryMassMilliSolar, 'primaryMassMilliSolar'), 80n, 120000n);
  const index = bi(componentIndex, 'componentIndex');
  if (index < 1n || index > 3n) throw new RangeError('componentIndex must be 1..3');
  const pDraw = clamp(bi(periodDrawU32, 'periodDrawU32'), 0n, Q32_ONE - 1n);
  const qDraw = clamp(bi(massRatioDrawU32, 'massRatioDrawU32'), 0n, Q32_ONE - 1n);
  const eDraw = clamp(bi(eccentricityDrawU32, 'eccentricityDrawU32'), 0n, Q32_ONE - 1n);

  const massive = primary >= 8000n;
  const intermediateMass = primary >= 1500n;
  const closeCut = massive ? (Q32_ONE * 45n) / 100n : intermediateMass ? (Q32_ONE * 30n) / 100n : (Q32_ONE * 20n) / 100n;
  const midCut = massive ? (Q32_ONE * 85n) / 100n : intermediateMass ? (Q32_ONE * 75n) / 100n : (Q32_ONE * 65n) / 100n;
  let regime, lo, hi;
  if (pDraw < closeCut) { regime = 'CLOSE'; lo = 0n; hi = 1300n; }
  else if (pDraw < midCut) { regime = 'INTERMEDIATE'; lo = 1300n; hi = 5000n; }
  else { regime = 'WIDE'; lo = 5000n; hi = 7500n; }
  const localBase = regime === 'CLOSE' ? 0n : regime === 'INTERMEDIATE' ? closeCut : midCut;
  const localSpan = regime === 'CLOSE' ? closeCut : regime === 'INTERMEDIATE' ? (midCut - closeCut) : (Q32_ONE - midCut);
  const local = localSpan > 0n ? ((pDraw - localBase) << 32n) / localSpan : 0n;
  let logPeriodMilliDex = lo + scaleU32(local, hi - lo + 1n);
  logPeriodMilliDex = clamp(logPeriodMilliDex, bi(minLogPeriodMilliDex, 'minLogPeriodMilliDex'), 7500n);
  // A hierarchy floor may push a draw out of its initial bin. Reclassify the final
  // period so q/e bounds never claim a period regime inconsistent with the value.
  const effectiveRegime = logPeriodMilliDex < 1300n ? 'CLOSE' : logPeriodMilliDex < 5000n ? 'INTERMEDIATE' : 'WIDE';

  let qMinQ16 = effectiveRegime === 'CLOSE' ? 19661n : effectiveRegime === 'INTERMEDIATE' ? 9830n : 6554n;
  if (primary < 500n) qMinQ16 = qMinQ16 < 13107n ? 13107n : qMinQ16;
  const massRatioQ16 = qMinQ16 + scaleU32(qDraw, Q16_ONE - qMinQ16);

  const eccentricityMaxQ16 = logPeriodMilliDex < 1000n ? 13107n : effectiveRegime === 'CLOSE' ? 26214n : effectiveRegime === 'INTERMEDIATE' ? 52429n : 62259n;
  const eccentricityQ16 = scaleU32(eDraw, eccentricityMaxQ16 + 1n);
  return Object.freeze({
    componentIndex: index,
    hierarchyRank: index,
    periodRegime: effectiveRegime,
    log10PeriodDaysMilliDex: logPeriodMilliDex,
    massRatioQ16,
    eccentricityQ16,
    hierarchyScreen: 'NOT_DYNAMICALLY_VALIDATED'
  });
}

export function observabilityProxy(starFacts, observer = {}) {
  const distanceMilliPc = bi(observer.distanceMilliPc, 'distanceMilliPc');
  if (distanceMilliPc <= 0n) throw new RangeError('distanceMilliPc must be > 0');
  const crowdingQ16 = clamp(bi(observer.crowdingQ16 ?? 0n, 'crowdingQ16'), 0n, 65535n);
  const referenceFluxPpm = bi(observer.referenceFluxPpm ?? 1000n, 'referenceFluxPpm');
  if (referenceFluxPpm <= 0n) throw new RangeError('referenceFluxPpm must be > 0');
  const luminosityMilliSolar = clamp(bi(starFacts.baselineLuminosityMilliSolar ?? starFacts.luminosityMilliSolar ?? 0n, 'luminosityMilliSolar'), 0n, 1n << 62n);
  const denom = distanceMilliPc * distanceMilliPc;
  const relativeFluxAt10pcPpm = denom > 0n ? (luminosityMilliSolar * 100000000000n) / denom : 0n;
  const fluxScoreQ16 = relativeFluxAt10pcPpm === 0n ? 0n : (relativeFluxAt10pcPpm * Q16_ONE) / (relativeFluxAt10pcPpm + referenceFluxPpm);
  const crowdingTransmissionQ16 = Q16_ONE - (crowdingQ16 * 3n) / 4n;
  const detectabilityScoreQ16 = (fluxScoreQ16 * crowdingTransmissionQ16) / Q16_ONE;
  const parallaxMicroArcsec = 1000000000n / distanceMilliPc;
  return Object.freeze({
    distanceMilliPc,
    relativeFluxAt10pcPpm,
    parallaxMicroArcsec,
    crowdingQ16,
    detectabilityScoreQ16,
    selectionMeaning: 'SURVEY_NEUTRAL_HEURISTIC_NOT_COMPLETENESS_PROBABILITY'
  });
}

export function cosmicWebGradientPrior(p3, ctx, galaxy) {
  if (!galaxy || galaxy.status !== 'PRESENT') return Object.freeze({ status: 'ABSENT', reason: 'GALAXY_NOT_PRESENT' });
  if (!p3 || typeof p3.environmentDensityQ16 !== 'function') throw new TypeError('p3.environmentDensityQ16 required');
  const x = bi(galaxy.key.siteCellX ?? galaxy.key.x, 'galaxy x');
  const y = bi(galaxy.key.siteCellY ?? galaxy.key.y, 'galaxy y');
  const z = bi(galaxy.key.siteCellZ ?? galaxy.key.z, 'galaxy z');
  const xp = bi(p3.environmentDensityQ16(ctx, x + 1n, y, z), 'density xp');
  const xm = bi(p3.environmentDensityQ16(ctx, x - 1n, y, z), 'density xm');
  const yp = bi(p3.environmentDensityQ16(ctx, x, y + 1n, z), 'density yp');
  const ym = bi(p3.environmentDensityQ16(ctx, x, y - 1n, z), 'density ym');
  const zp = bi(p3.environmentDensityQ16(ctx, x, y, z + 1n), 'density zp');
  const zm = bi(p3.environmentDensityQ16(ctx, x, y, z - 1n), 'density zm');
  const dx = xp - xm, dy = yp - ym, dz = zp - zm;
  const axis = normalize3L1(dx, dy, dz);
  const gradientL1 = abs(dx) + abs(dy) + abs(dz);
  const strengthQ16 = clamp((gradientL1 * Q16_ONE) / (3n * 65535n), 0n, Q16_ONE);
  return Object.freeze({
    status: 'PRESENT',
    frame: 'SYNTHETIC_P3_FIELD_GRADIENT',
    axis,
    gradientStrengthQ16: strengthQ16,
    coordinateAuthority: 'NONE',
    physicalTruthClaim: false
  });
}

function makeResearchDeriveU32(p2, ctx, addressBytes, property, counter = 0n) {
  const bytes = p2.derive({
    masterSeed: ctx.masterSeed,
    semanticManifestHash: ctx.semanticManifestHash,
    domain: 'research.v1x15.astronomy-depth.v1',
    addressBytes,
    property,
    counter
  });
  return readU32(bytes);
}

export function createProvider({ p2, p3 }) {
  if (!p2 || typeof p2.derive !== 'function') throw new TypeError('P2 derive API required');
  if (!p3 || typeof p3.resolveGalaxy !== 'function' || typeof p3.resolveSystem !== 'function' || typeof p3.resolveStar !== 'function') throw new TypeError('P3 astronomy API required');

  function resolveGalaxyDepth(ctx, key) {
    const galaxy = p3.resolveGalaxy(ctx, key);
    if (!galaxy || galaxy.status !== 'PRESENT') return Object.freeze({ status: 'ABSENT', canonical: galaxy, authority: AUTHORITY });
    return Object.freeze({
      status: 'PRESENT',
      authority: AUTHORITY,
      sourceEntityId: galaxy.id,
      canonical: galaxy,
      morphologyPosteriorQ16: morphologyWeightsQ16(galaxy.facts),
      populationMixtureQ16: populationMixtureQ16(galaxy.facts),
      spatialPrior: cosmicWebGradientPrior(p3, ctx, galaxy),
      mutationAuthority: false
    });
  }

  function resolveSystemDepth(ctx, key) {
    const system = p3.resolveSystem(ctx, key);
    if (!system || system.status !== 'PRESENT') return Object.freeze({ status: 'ABSENT', canonical: system, authority: AUTHORITY });
    const componentCount = clamp(bi(system.facts.stellarComponentCount, 'stellarComponentCount'), 1n, 4n);
    const stars = [];
    for (let i = 0n; i < componentCount; i++) {
      const star = p3.resolveStar(ctx, { ...key, componentIndex: i });
      stars.push(Object.freeze({ sourceEntityId: star.id, canonical: star, evolution: evolutionSummary(star.facts) }));
    }
    const companions = [];
    let minPeriod = 0n;
    for (let i = 1n; i < componentCount; i++) {
      const orbit = companionOrbitCandidate({
        primaryMassMilliSolar: system.facts.baselinePrimaryMassMilliSolar ?? system.facts.primaryMassMilliSolar,
        componentIndex: i,
        periodDrawU32: makeResearchDeriveU32(p2, ctx, system.address, 'companion-period', i),
        massRatioDrawU32: makeResearchDeriveU32(p2, ctx, system.address, 'companion-q', i),
        eccentricityDrawU32: makeResearchDeriveU32(p2, ctx, system.address, 'companion-e', i),
        minLogPeriodMilliDex: minPeriod
      });
      companions.push(orbit);
      minPeriod = clamp(orbit.log10PeriodDaysMilliDex + 300n, 0n, 7500n);
    }
    const architectureClass = componentCount === 1n ? 'SINGLE' : componentCount === 2n ? 'BINARY' : componentCount === 3n ? 'HIERARCHICAL_TRIPLE_CANDIDATE' : 'HIERARCHICAL_QUADRUPLE_CANDIDATE';
    return Object.freeze({
      status: 'PRESENT',
      authority: AUTHORITY,
      sourceEntityId: system.id,
      canonical: system,
      architectureClass,
      companions: Object.freeze(companions),
      stars: Object.freeze(stars),
      mutationAuthority: false
    });
  }

  function observeStar(ctx, key, observer) {
    const star = p3.resolveStar(ctx, key);
    if (!star || star.status !== 'PRESENT') return Object.freeze({ status: 'ABSENT', canonical: star, authority: AUTHORITY });
    return Object.freeze({
      status: 'PRESENT',
      authority: AUTHORITY,
      sourceEntityId: star.id,
      canonical: star,
      observability: observabilityProxy(star.facts, observer),
      observerAffectsIdentity: false,
      mutationAuthority: false
    });
  }

  return Object.freeze({ VERSION, AUTHORITY, MODEL_CATALOG, resolveGalaxyDepth, resolveSystemDepth, observeStar });
}

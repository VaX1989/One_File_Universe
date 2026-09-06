import { createHash } from 'node:crypto';
import {
  Q, assertBigInt, assertRange, clampBig, divRoundHalfEven,
  fourthRootRatioHalfEven, normalizePpm, sumBig
} from './fixed.mjs';

export const LANE_ID = 'PROMPT 16 / R&D-16';
export const VERSION = 'ofu-rd16-planetary-causality-1';
export const AUTHORITY = 'RESEARCH_ONLY_MODEL_DERIVED_SIMULATION';
export const P4_TARGET = 'ofu-p4-temporal-v1';
export const BASELINE_EPOCH = 'P4_T0';

const EARTH_MASS_KG = 5_972_200_000_000_000_000_000_000n;
const G_NUM = 667430n;
const G_DEN = 10_000_000_000_000_000n;
const PI_NUM = 355n;
const PI_DEN = 113n;
const SECONDS_PER_KYR = 31_557_600_000n;
const KG_PER_TG = 1_000_000_000n;

function freeze(v) {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    for (const x of Object.values(v)) freeze(x);
    Object.freeze(v);
  }
  return v;
}

export const MODEL_CATALOG = freeze({
  rockyInterior: {
    modelId: 'rd16-rocky-interior-fixed-1',
    relationClass: 'APPROXIMATE_EMPIRICAL_PROXY',
    fidelity: 'LOW_TO_MODERATE_BULK',
    validity: '0.5-8 Earth masses; cold predominantly rocky bodies; not an EOS solver',
    sources: ['SEAGER_2007', 'OFU_P5_FROZEN_ROCKY_BASELINE']
  },
  volatileEscape: {
    modelId: 'rd16-energy-limited-escape-fixed-1',
    relationClass: 'APPROXIMATE_PHYSICAL',
    fidelity: 'ORDER_OF_MAGNITUDE_ONLY',
    validity: 'energy-limited hydrodynamic escape scenario with prescribed XUV history/efficiency/Roche factor',
    sources: ['ERKAEV_2007', 'TIAN_2015']
  },
  greyGreenhouse: {
    modelId: 'rd16-grey-atmosphere-fixed-1',
    relationClass: 'FORMAL_WITHIN_IDEALIZED_MODEL',
    fidelity: 'LOW_CLIMATE',
    validity: 'grey radiative equilibrium optical-depth experiment; no clouds, spectral absorption, convection or humidity closure',
    sources: ['PIERREHUMBERT_2010']
  },
  geodynamics: {
    modelId: 'rd16-thermal-ledger-regime-1',
    relationClass: 'FORMAL_LEDGER_PLUS_STYLIZED_REGIME',
    fidelity: 'LOW_GEODYNAMICS',
    validity: 'global heat reservoir bookkeeping; regime classifier is not a mantle convection solver',
    sources: ['SOLOMATOV_1995', 'ELKINS_TANTON_2012']
  },
  climateTransport: {
    modelId: 'rd16-zonal-energy-transport-fixed-1',
    relationClass: 'REDUCED_ORDER_ENERGY_BALANCE',
    fidelity: 'LOW_CLIMATE_TRANSPORT',
    validity: 'bounded zonal energy anomalies with nearest-neighbor diffusive transport; not weather/GCM',
    sources: ['NORTH_CAHALAN_COAKLEY_1981']
  },
  hydrology: {
    modelId: 'rd16-water-reservoir-ledger-1',
    relationClass: 'FORMAL_CONSERVATION_PLUS_STYLIZED_PHASE_PROPOSAL',
    fidelity: 'LOW_HYDROLOGY',
    validity: 'reservoir bookkeeping only; no EOS, salinity, high-pressure ice or dynamic ocean circulation',
    sources: ['COWAN_ABBOT_2014', 'KASTING_POLLACK_ACKERMAN_1984']
  },
  crossScale: {
    modelId: 'rd16-planet-region-budget-seam-1',
    relationClass: 'FORMAL_CONSERVATION',
    fidelity: 'FORMAL_SEAM_NOT_PHYSICAL_FIELD',
    validity: 'finite active region partitions whose declared weights exactly close at planet scope',
    sources: ['OFU_PX_CROSS_SCALE_1']
  },
  giantFamily: {
    modelId: 'rd16-giant-family-envelope-1',
    relationClass: 'EMPIRICAL_DOMAIN_CLASSIFIER',
    fidelity: 'LOW_FAMILY_LEVEL',
    validity: '20 Earth masses through 20 Jupiter masses; no radius or atmospheric-composition prediction',
    sources: ['FORTNEY_2007', 'THORNGREN_2016', 'THORNGREN_MARLEY_FORTNEY_2019']
  },
  p4Adapter: {
    modelId: 'rd16-p4-transition-proposal-1',
    relationClass: 'FORMAL_GOVERNANCE_ADAPTER',
    fidelity: 'FORMAL_NON_CANONICAL_HANDOFF',
    validity: 'proposal serialization only; never admits or orders canonical P4 events',
    sources: ['OFU_P4_TEMPORAL_V1']
  }
});

function planetMassKg(massMilliEarth) {
  assertRange(massMilliEarth, 1n, 100_000_000n, 'massMilliEarth');
  return divRoundHalfEven(EARTH_MASS_KG * massMilliEarth, 1000n);
}

function rockyRadiusMeters(massMilliEarth, coreMassFractionPermille) {
  assertRange(massMilliEarth, 500n, 8000n, 'massMilliEarth');
  assertRange(coreMassFractionPermille, 0n, 400n, 'coreMassFractionPermille');
  // Research baseline intentionally mirrors the frozen P5 fixed-point exponent and
  // bounded core correction; it is not promoted as a new EOS relationship.
  const scale = 1_000_000n;
  const pow = (a, e) => { let r = 1n; for (let i = 0; i < e; i++) r *= a; return r; };
  const rootFloor = (n, k) => {
    let lo = 0n, hi = 1n;
    while (pow(hi, k) <= n) hi <<= 1n;
    while (lo + 1n < hi) { const m = (lo + hi) >> 1n; if (pow(m, k) <= n) lo = m; else hi = m; }
    return lo;
  };
  const x = massMilliEarth * scale / 1000n;
  const massPowerQ = rootFloor(pow(x, 10) * pow(scale, 27), 37);
  const compositionFactorQ = 1_070_000n - 210n * coreMassFractionPermille;
  return divRoundHalfEven(6_371_000n * massPowerQ * compositionFactorQ, scale * scale);
}

export function deriveRockyInterior(input) {
  const massMilliEarth = assertRange(input.massMilliEarth, 500n, 8000n, 'massMilliEarth');
  const [corePpm, mantlePpm, waterPpm] = normalizePpm(
    [input.corePpm, input.mantlePpm, input.waterPpm],
    ['corePpm', 'mantlePpm', 'waterPpm']
  );
  const corePermille = divRoundHalfEven(corePpm, 1000n);
  if (corePermille > 400n) throw new RangeError('rocky proxy core fraction exceeds 0.4 domain');
  const radiusM = rockyRadiusMeters(massMilliEarth, corePermille);
  const massKg = planetMassKg(massMilliEarth);
  const gravityMicroMs2 = divRoundHalfEven(G_NUM * massKg * 1_000_000n, G_DEN * radiusM * radiusM);
  const densityKgM3 = divRoundHalfEven(3n * massKg * PI_DEN, 4n * PI_NUM * radiusM * radiusM * radiusM);
  return freeze({
    modelId: MODEL_CATALOG.rockyInterior.modelId,
    authority: AUTHORITY,
    status: 'RESEARCH_HYPOTHESIS',
    massMilliEarth,
    composition: { corePpm, mantlePpm, waterPpm, sumPpm: corePpm + mantlePpm + waterPpm },
    meanRadiusM: radiusM,
    surfaceGravityMicroMs2: gravityMicroMs2,
    meanDensityKgM3: densityKgM3,
    canonicalClaim: false
  });
}

export function validateVolatileState(state) {
  const keys = ['atmosphereTg', 'condensedTg', 'interiorTg', 'lostTg'];
  for (const k of keys) assertRange(state[k], 0n, (1n << 96n) - 1n, k);
  const total = assertRange(state.totalVolatileTg, 0n, (1n << 96n) - 1n, 'totalVolatileTg');
  if (sumBig(keys.map(k => state[k])) !== total) throw new Error('volatile mass conservation failure');
  return state;
}

export function energyLimitedEscapeTg(input) {
  const etaPpm = assertRange(input.efficiencyPpm, 0n, Q, 'efficiencyPpm');
  const xuvMilliWm2 = assertRange(input.xuvFluxMilliWm2, 0n, 1_000_000_000n, 'xuvFluxMilliWm2');
  const radiusM = assertRange(input.xuvRadiusM, 1n, 100_000_000n, 'xuvRadiusM');
  const massKg = planetMassKg(input.massMilliEarth);
  const rocheFactorPpm = assertRange(input.rocheFactorPpm ?? Q, 100_000n, Q, 'rocheFactorPpm');
  const dtKyr = assertRange(input.dtKyr, 0n, 1_000_000n, 'dtKyr');
  if (etaPpm === 0n || xuvMilliWm2 === 0n || dtKyr === 0n) return 0n;
  // Delta M = eta*pi*F_XUV*R_XUV^3*dt/(G*M*K_tide).
  // eta and K are ppm, F is milli-W/m2, dt is kyr. Ppm factors cancel.
  const n = etaPpm * PI_NUM * xuvMilliWm2 * radiusM ** 3n * dtKyr * SECONDS_PER_KYR * G_DEN;
  const d = PI_DEN * 1000n * G_NUM * massKg * rocheFactorPpm * KG_PER_TG;
  return divRoundHalfEven(n, d);
}

export function applyEnergyLimitedEscape(state, forcing) {
  validateVolatileState(state);
  const potential = energyLimitedEscapeTg(forcing);
  const escaped = potential > state.atmosphereTg ? state.atmosphereTg : potential;
  const next = {
    totalVolatileTg: state.totalVolatileTg,
    atmosphereTg: state.atmosphereTg - escaped,
    condensedTg: state.condensedTg,
    interiorTg: state.interiorTg,
    lostTg: state.lostTg + escaped
  };
  validateVolatileState(next);
  return freeze({
    modelId: MODEL_CATALOG.volatileEscape.modelId,
    authority: AUTHORITY,
    potentialEscapeTg: potential,
    appliedEscapeTg: escaped,
    limitedByAvailableAtmosphere: escaped < potential,
    next,
    canonicalClaim: false
  });
}

export function greyAtmosphereTemperatureMilliK(effectiveTemperatureMilliK, opticalDepthPpm) {
  const teff = assertRange(effectiveTemperatureMilliK, 0n, 10_000_000n, 'effectiveTemperatureMilliK');
  const tau = assertRange(opticalDepthPpm, 0n, 100_000_000n, 'opticalDepthPpm');
  if (teff === 0n) return 0n;
  // Eddington grey relation: T^4 = (3/4) Teff^4 (tau + 2/3)
  // = Teff^4 * (3*tau + 2) / 4, with tau represented in Q units.
  const n = teff ** 4n * (3n * tau + 2n * Q);
  const d = 4n * Q;
  return fourthRootRatioHalfEven(n, d);
}

export function thermalBudgetStep(state, flux) {
  const stored = assertRange(state.mantleHeatTJ, 0n, (1n << 96n) - 1n, 'mantleHeatTJ');
  const radiogenic = assertRange(flux.radiogenicInputTJ, 0n, (1n << 80n) - 1n, 'radiogenicInputTJ');
  const tidal = assertRange(flux.tidalInputTJ, 0n, (1n << 80n) - 1n, 'tidalInputTJ');
  const secular = assertRange(flux.secularInputTJ ?? 0n, 0n, (1n << 80n) - 1n, 'secularInputTJ');
  const convective = assertRange(flux.convectiveLossTJ, 0n, (1n << 80n) - 1n, 'convectiveLossTJ');
  const volcanic = assertRange(flux.volcanicLossTJ, 0n, (1n << 80n) - 1n, 'volcanicLossTJ');
  const incoming = radiogenic + tidal + secular;
  const outgoing = convective + volcanic;
  if (outgoing > stored + incoming) throw new RangeError('thermal step would create negative reservoir');
  const next = stored + incoming - outgoing;
  return freeze({
    modelId: MODEL_CATALOG.geodynamics.modelId,
    authority: AUTHORITY,
    previousHeatTJ: stored,
    incomingTJ: incoming,
    outgoingTJ: outgoing,
    nextHeatTJ: next,
    conservationResidualTJ: next - (stored + incoming - outgoing),
    canonicalClaim: false
  });
}

export function rayleighNumberPpm(input) {
  const densityKgM3 = assertRange(input.densityKgM3, 1n, 100_000n, 'densityKgM3');
  const gravityMicroMs2 = assertRange(input.gravityMicroMs2, 1n, 100_000_000n, 'gravityMicroMs2');
  const expansivityNanoPerK = assertRange(input.expansivityNanoPerK, 1n, 10_000_000n, 'expansivityNanoPerK');
  const deltaTemperatureMilliK = assertRange(input.deltaTemperatureMilliK, 1n, 10_000_000n, 'deltaTemperatureMilliK');
  const layerThicknessM = assertRange(input.layerThicknessM, 1n, 100_000_000n, 'layerThicknessM');
  const diffusivityNanoM2s = assertRange(input.diffusivityNanoM2s, 1n, 1_000_000_000n, 'diffusivityNanoM2s');
  const viscosityPaS = assertRange(input.viscosityPaS, 1n, 10n ** 40n, 'viscosityPaS');
  // Ra = rho*g*alpha*DeltaT*d^3/(kappa*eta). Unit scalings collapse
  // to 1e9 in the denominator before the requested ppm output scale.
  const numerator = densityKgM3 * gravityMicroMs2 * expansivityNanoPerK * deltaTemperatureMilliK * layerThicknessM ** 3n * Q;
  const denominator = 1_000_000_000n * diffusivityNanoM2s * viscosityPaS;
  return divRoundHalfEven(numerator, denominator);
}

export function classifyLidRegime(input) {
  const vigorPpm = assertRange(input.convectiveVigorPpm, 0n, 10_000_000n, 'convectiveVigorPpm');
  const viscosityContrastPpm = assertRange(input.viscosityContrastPpm, Q, 1_000_000_000_000n, 'viscosityContrastPpm');
  // Thresholds are explicitly stylized research bins, not Solomatov scaling-law solutions.
  let regime;
  if (vigorPpm < 150_000n) regime = 'CONDUCTION_DOMINATED_CANDIDATE';
  else if (viscosityContrastPpm >= 100_000_000n) regime = 'STAGNANT_LID_CANDIDATE';
  else if (viscosityContrastPpm >= 10_000_000n) regime = 'TRANSITIONAL_LID_CANDIDATE';
  else regime = 'LOW_CONTRAST_CONVECTION_CANDIDATE';
  return freeze({ modelId: MODEL_CATALOG.geodynamics.modelId, regime, authority: AUTHORITY, canonicalClaim: false });
}

export function zonalEnergyStep(state, forcingUnits, transportPpm) {
  if (!Array.isArray(state.bands) || state.bands.length < 2 || state.bands.length > 64) throw new RangeError('2..64 climate bands required');
  if (!Array.isArray(forcingUnits) || forcingUnits.length !== state.bands.length) throw new RangeError('forcing length mismatch');
  assertRange(transportPpm, 0n, Q, 'transportPpm');
  const energy = state.bands.map((b, i) => assertBigInt(b.energyUnits, `bands[${i}].energyUnits`));
  const capacity = state.bands.map((b, i) => assertRange(b.capacityUnitsPerMilliK, 1n, 1_000_000_000_000n, `bands[${i}].capacityUnitsPerMilliK`));
  const forcing = forcingUnits.map((v, i) => assertBigInt(v, `forcing[${i}]`));
  const transport = Array(energy.length).fill(0n);
  const edgeFluxes = [];
  for (let i = 0; i < energy.length - 1; i++) {
    const ti = divRoundHalfEven(energy[i], capacity[i]);
    const tj = divRoundHalfEven(energy[i + 1], capacity[i + 1]);
    const flux = divRoundHalfEven((ti - tj) * transportPpm, Q);
    transport[i] -= flux;
    transport[i + 1] += flux;
    edgeFluxes.push(flux);
  }
  const previousTotal = sumBig(energy);
  const forcingTotal = sumBig(forcing);
  const transportTotal = sumBig(transport);
  const nextEnergy = energy.map((v, i) => v + forcing[i] + transport[i]);
  const nextTotal = sumBig(nextEnergy);
  if (transportTotal !== 0n) throw new Error('internal transport failed conservation');
  if (nextTotal !== previousTotal + forcingTotal) throw new Error('zonal energy conservation failure');
  return freeze({
    modelId: MODEL_CATALOG.climateTransport.modelId,
    authority: AUTHORITY,
    bands: nextEnergy.map((v, i) => ({ energyUnits: v, capacityUnitsPerMilliK: capacity[i], temperatureMilliK: divRoundHalfEven(v, capacity[i]) })),
    edgeFluxUnits: edgeFluxes,
    ledger: { previousTotal, forcingTotal, transportResidual: transportTotal, nextTotal },
    canonicalClaim: false
  });
}

const WATER_RESERVOIRS = ['oceanTg', 'iceTg', 'atmosphereTg', 'interiorTg', 'lostTg'];
export function validateWaterState(state) {
  for (const k of WATER_RESERVOIRS) assertRange(state[k], 0n, (1n << 96n) - 1n, k);
  const total = assertRange(state.totalWaterTg, 0n, (1n << 96n) - 1n, 'totalWaterTg');
  if (sumBig(WATER_RESERVOIRS.map(k => state[k])) !== total) throw new Error('water mass conservation failure');
  return state;
}

export function transferWater(state, transfers) {
  validateWaterState(state);
  const next = Object.fromEntries(WATER_RESERVOIRS.map(k => [k, state[k]]));
  next.totalWaterTg = state.totalWaterTg;
  for (const [i, t] of transfers.entries()) {
    if (!WATER_RESERVOIRS.includes(t.from) || !WATER_RESERVOIRS.includes(t.to) || t.from === t.to) throw new RangeError(`invalid water transfer ${i}`);
    const mass = assertRange(t.massTg, 0n, (1n << 80n) - 1n, `transfer[${i}].massTg`);
    if (next[t.from] < mass) throw new RangeError(`water transfer ${i} overdrafts ${t.from}`);
    next[t.from] -= mass;
    next[t.to] += mass;
  }
  validateWaterState(next);
  return freeze({ modelId: MODEL_CATALOG.hydrology.modelId, authority: AUTHORITY, next, canonicalClaim: false });
}

export function climatePhaseProposal(meanSurfaceTemperatureMilliK, mobileWaterTg) {
  const t = assertRange(meanSurfaceTemperatureMilliK, 50_000n, 2_000_000n, 'meanSurfaceTemperatureMilliK');
  assertRange(mobileWaterTg, 0n, (1n << 96n) - 1n, 'mobileWaterTg');
  let phase, suggestedFractionPpm;
  if (t <= 250_000n) { phase = 'ICE_FAVORED'; suggestedFractionPpm = 100_000n; }
  else if (t >= 373_150n) { phase = 'VAPOR_FAVORED'; suggestedFractionPpm = 100_000n; }
  else { phase = 'LIQUID_WINDOW_CANDIDATE'; suggestedFractionPpm = 25_000n; }
  return freeze({
    modelId: MODEL_CATALOG.hydrology.modelId,
    phase,
    suggestedTransferTg: divRoundHalfEven(mobileWaterTg * suggestedFractionPpm, Q),
    authority: AUTHORITY,
    proposalOnly: true,
    limitation: 'Temperature-only phase heuristic; pressure, composition, salinity and high-pressure ice omitted.'
  });
}

export function refinePlanetBudget(totalUnits, regions) {
  const total = assertRange(totalUnits, 0n, (1n << 96n) - 1n, 'totalUnits');
  if (!Array.isArray(regions) || regions.length < 1 || regions.length > 4096) throw new RangeError('1..4096 active regions required');
  const weights = regions.map((r, i) => assertRange(r.weightPpm, 0n, Q, `regions[${i}].weightPpm`));
  if (sumBig(weights) !== Q) throw new Error('region weights must sum to exactly 1,000,000 ppm');
  const allocations = weights.map(w => total * w / Q);
  let residual = total - sumBig(allocations);
  for (let i = 0; residual > 0n; i = (i + 1) % allocations.length, residual -= 1n) allocations[i] += 1n;
  const out = regions.map((r, i) => freeze({ address: String(r.address), weightPpm: weights[i], allocatedUnits: allocations[i] }));
  if (sumBig(out.map(r => r.allocatedUnits)) !== total) throw new Error('refine allocation failed closure');
  return freeze({
    modelId: MODEL_CATALOG.crossScale.modelId,
    operation: 'REFINE',
    authority: AUTHORITY,
    planetTotalUnits: total,
    activeRegionCount: out.length,
    regions: out,
    boundedWorkingSet: true,
    canonicalClaim: false
  });
}

export function projectPlanetBudget(refined) {
  const projected = sumBig(refined.regions.map(r => r.allocatedUnits));
  return freeze({ modelId: MODEL_CATALOG.crossScale.modelId, operation: 'PROJECT', projectedUnits: projected, authority: AUTHORITY, canonicalClaim: false });
}

export function reconcilePlanetBudget(expectedTotalUnits, regions) {
  const expected = assertBigInt(expectedTotalUnits, 'expectedTotalUnits');
  const actual = sumBig(regions.map(r => assertBigInt(r.allocatedUnits, 'allocatedUnits')));
  const residual = actual - expected;
  return freeze({
    modelId: MODEL_CATALOG.crossScale.modelId,
    operation: 'RECONCILE',
    expectedUnits: expected,
    actualUnits: actual,
    residualUnits: residual,
    status: residual === 0n ? 'EXACT' : 'REJECT',
    authority: AUTHORITY,
    canonicalClaim: false
  });
}

export function deterministicTerrainEnvelope(address, reliefLimitM) {
  const limit = assertRange(reliefLimitM, 0n, 100_000n, 'reliefLimitM');
  const bytes = createHash('sha256').update(`${VERSION}|terrain-envelope|${String(address)}`).digest();
  const u = BigInt(bytes.readUInt32BE(0));
  const signed = u - 2_147_483_648n;
  const elevationM = divRoundHalfEven(signed * limit, 2_147_483_648n);
  return freeze({
    modelId: 'rd16-stylized-terrain-envelope-1',
    address: String(address), elevationM, reliefLimitM: limit,
    authority: AUTHORITY, physicalTruth: false,
    limitation: 'Deterministic bounded texture only; not physical hypsometry or geological reconstruction.'
  });
}

export function classifyGiantPlanet(input) {
  const mass = assertRange(input.massMilliEarth, 20_000n, 6_356_000n, 'massMilliEarth');
  const heavy = assertRange(input.heavyElementMassMilliEarth, 0n, mass, 'heavyElementMassMilliEarth');
  const irradiationPpm = assertRange(input.irradiationPpm, 0n, 1_000_000_000n, 'irradiationPpm');
  const heavyFractionPpm = divRoundHalfEven(heavy * Q, mass);
  let family;
  if (mass < 60_000n) family = 'NEPTUNE_MASS_GIANT_CANDIDATE';
  else if (mass < 150_000n) family = 'SUB_SATURN_CANDIDATE';
  else if (mass < 700_000n) family = 'JOVIAN_CANDIDATE';
  else family = 'SUPER_JOVIAN_CANDIDATE';
  return freeze({
    modelId: MODEL_CATALOG.giantFamily.modelId,
    authority: AUTHORITY,
    family,
    massMilliEarth: mass,
    heavyElementMassMilliEarth: heavy,
    heavyElementFractionPpm: heavyFractionPpm,
    irradiationPpm,
    radiusPrediction: null,
    atmospherePrediction: null,
    canonicalClaim: false,
    limitation: 'Family bins are research taxonomy; empirical giant-planet relations carry large population scatter and irradiation/age dependence.'
  });
}

export function makeP4TransitionProposal(input) {
  const operation = String(input.operation);
  if (!['REFINE', 'PROJECT', 'RECONCILE', 'EVOLVE'].includes(operation)) throw new RangeError('unsupported proposal operation');
  const descriptor = {
    proposalSchema: 'ofu-rd16-p4-transition-proposal-1',
    authority: AUTHORITY,
    canonicalAdmission: 'REQUIRED_AND_NOT_PERFORMED',
    privateClock: false,
    p4TargetContract: P4_TARGET,
    baselineEpoch: BASELINE_EPOCH,
    modelId: String(input.modelId),
    modelVersion: VERSION,
    operation,
    targetEntityId: String(input.targetEntityId),
    requestedTime: { seconds: String(input.timeSeconds), micros: String(input.timeMicros) },
    previousStateDigest: String(input.previousStateDigest),
    nextStateDigest: String(input.nextStateDigest),
    conservationLedgerDigest: String(input.conservationLedgerDigest),
    payloadDigest: String(input.payloadDigest),
    canonicalEventId: null,
    canonicalOrder: null,
    p4CommitResult: null
  };
  const proposalDigest = createHash('sha256').update(JSON.stringify(descriptor)).digest('hex');
  return freeze({ ...descriptor, proposalDigest });
}

export function causalGraph() {
  return freeze({
    version: VERSION,
    nodes: [
      'stellar_orbital_forcing', 'formation_inventory', 'bulk_composition', 'interior_structure',
      'thermal_budget', 'lid_regime', 'outgassing', 'xuv_escape', 'volatile_reservoirs',
      'atmospheric_optical_depth', 'radiative_temperature', 'zonal_transport', 'water_partition',
      'terrain_envelope', 'region_budget', 'giant_family'
    ],
    edges: [
      ['formation_inventory', 'bulk_composition'], ['bulk_composition', 'interior_structure'],
      ['interior_structure', 'thermal_budget'], ['thermal_budget', 'lid_regime'],
      ['thermal_budget', 'outgassing'], ['outgassing', 'volatile_reservoirs'],
      ['stellar_orbital_forcing', 'xuv_escape'], ['interior_structure', 'xuv_escape'],
      ['xuv_escape', 'volatile_reservoirs'], ['volatile_reservoirs', 'atmospheric_optical_depth'],
      ['stellar_orbital_forcing', 'radiative_temperature'], ['atmospheric_optical_depth', 'radiative_temperature'],
      ['radiative_temperature', 'zonal_transport'], ['zonal_transport', 'water_partition'],
      ['water_partition', 'region_budget'], ['terrain_envelope', 'region_budget']
    ],
    governance: 'All mutable evolution is proposal-only until admitted by a future explicit P4 domain transition contract.'
  });
}

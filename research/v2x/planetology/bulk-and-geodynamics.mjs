export const AUTHORITY = 'RESEARCH_ONLY';

const SUB_NEPTUNE_SOURCE_DOMAIN = Object.freeze({ massEarth: [1, 20], envelopeFraction: [0.0001, 0.20], irradiationEarth: [0.1, 1000], ageGyr: [0.1, 10] });
const MAX_EOS_CELLS = 262144;
const MAX_SUB_NEPTUNE_CELLS = 262144;

function finite(name, value) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}

function strictlyIncreasing(axis) {
  return Array.isArray(axis) && axis.length >= 2 && axis.every((value, index) => Number.isFinite(value) && (index === 0 || value > axis[index - 1]));
}

function bracket(axis, value) {
  if (value < axis[0] || value > axis[axis.length - 1]) return null;
  if (value === axis[axis.length - 1]) return { lo: axis.length - 2, hi: axis.length - 1, t: 1 };
  let lo = 0;
  let hi = axis.length - 1;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (axis[mid] <= value) lo = mid;
    else hi = mid;
  }
  return { lo, hi, t: (value - axis[lo]) / (axis[hi] - axis[lo]) };
}

function inRange(value, range) {
  return value >= range[0] && value <= range[1];
}

function validPtEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object') return null;
  const keys = ['pressureMinPa', 'pressureMaxPa', 'temperatureMinK', 'temperatureMaxK'];
  if (keys.some((key) => !Number.isFinite(envelope[key]))) return null;
  if (!(envelope.pressureMinPa >= 0 && envelope.pressureMinPa < envelope.pressureMaxPa && envelope.temperatureMinK > 0 && envelope.temperatureMinK < envelope.temperatureMaxK)) return null;
  return Object.freeze({ pressureMinPa: envelope.pressureMinPa, pressureMaxPa: envelope.pressureMaxPa, temperatureMinK: envelope.temperatureMinK, temperatureMaxK: envelope.temperatureMaxK });
}

export function compositionRegimeContract({ massEarth, radiusEarth, ageGyr = null, irradiationEarth = null, hHeEnvelopeFraction = null, waterMassFraction = null }) {
  const m = finite('massEarth', massEarth);
  const r = finite('radiusEarth', radiusEarth);
  if (m <= 0 || r <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_POSITIVE_BULK_INPUT' });
  const supplied = [hHeEnvelopeFraction != null, waterMassFraction != null].filter(Boolean).length;
  if (supplied > 1) return Object.freeze({ status: 'UNSUPPORTED', reason: 'MUTUALLY_EXCLUSIVE_SCENARIO_HINTS' });
  if (hHeEnvelopeFraction != null) {
    const f = finite('hHeEnvelopeFraction', hHeEnvelopeFraction);
    const age = finite('ageGyr', ageGyr);
    const irr = finite('irradiationEarth', irradiationEarth);
    if (!inRange(m, SUB_NEPTUNE_SOURCE_DOMAIN.massEarth) || !inRange(f, SUB_NEPTUNE_SOURCE_DOMAIN.envelopeFraction) || !inRange(age, SUB_NEPTUNE_SOURCE_DOMAIN.ageGyr) || !inRange(irr, SUB_NEPTUNE_SOURCE_DOMAIN.irradiationEarth)) {
      return Object.freeze({ status: 'UNSUPPORTED', reason: 'OUTSIDE_LOPEZ_FORTNEY_2014_GRID_ENVELOPE' });
    }
    return Object.freeze({ status: 'SUB_NEPTUNE_SCENARIO_COORDINATE', family: 'H_HE_ENVELOPE', sourceFamily: 'LOPEZ_FORTNEY_2014', uniqueCompositionInference: false, requiresEvolutionGrid: true });
  }
  if (waterMassFraction != null) {
    const f = finite('waterMassFraction', waterMassFraction);
    if (f < 0 || f > 1) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_WATER_MASS_FRACTION' });
    return Object.freeze({ status: 'WATER_RICH_SCENARIO_COORDINATE', family: 'WATER_RICH_HIGH_PRESSURE_EOS_REQUIRED', uniqueCompositionInference: false, requiresHighPressureEos: true });
  }
  return Object.freeze({ status: 'DEGENERATE_BULK_OBSERVABLES', reason: 'MASS_RADIUS_ALONE_DO_NOT_UNIQUELY_IDENTIFY_COMPOSITION', candidateFamilies: Object.freeze(['ROCKY', 'WATER_RICH', 'H_HE_ENVELOPE', 'MIXED']), uniqueCompositionInference: false });
}

export function waterEosApplicabilityContract({ eosId, eosHash, pressurePa, temperatureK, phaseDiagramId = null, phaseBoundarySourceId = null, validityEnvelope = null, extrapolationDeclared = false }) {
  const pressure = finite('pressurePa', pressurePa);
  const temperature = finite('temperatureK', temperatureK);
  if (!eosId || !eosHash) return Object.freeze({ status: 'UNSUPPORTED', reason: 'EOS_ID_AND_HASH_REQUIRED' });
  if (pressure < 0 || temperature <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_PRESSURE_OR_TEMPERATURE' });
  const envelope = validPtEnvelope(validityEnvelope);
  if (!phaseDiagramId || !phaseBoundarySourceId || !envelope) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'PHASE_DIAGRAM_SOURCE_AND_EXACT_PT_VALIDITY_ENVELOPE_REQUIRED', radiusPredictionAuthorized: false, compositionTruthClaim: false });
  const inside = pressure >= envelope.pressureMinPa && pressure <= envelope.pressureMaxPa && temperature >= envelope.temperatureMinK && temperature <= envelope.temperatureMaxK;
  if (!inside && !extrapolationDeclared) return Object.freeze({ status: 'UNSUPPORTED', reason: 'QUERY_OUTSIDE_DECLARED_EOS_PT_VALIDITY_ENVELOPE', validityEnvelope: envelope, radiusPredictionAuthorized: false, compositionTruthClaim: false });
  return Object.freeze({
    status: inside && !extrapolationDeclared ? 'EOS_COORDINATE_READY' : 'RESEARCH_REQUIRED',
    eosId,
    eosHash,
    pressurePa: pressure,
    temperatureK: temperature,
    phaseDiagramId,
    phaseBoundarySourceId,
    validityEnvelope: envelope,
    phaseContext: 'PHASE_MUST_BE_RESOLVED_FROM_VERSIONED_PT_PHASE_DATA_NOT_PRESSURE_ALONE',
    extrapolationDeclared: Boolean(extrapolationDeclared),
    densityLookupAuthorized: inside && !extrapolationDeclared,
    radiusPredictionAuthorized: false,
    compositionTruthClaim: false,
    requiredEvidence: Object.freeze(['EOS_VERSION', 'EOS_HASH', 'P_T_VALIDITY', 'PHASE_BOUNDARY_SOURCE', 'EXTRAPOLATION_POLICY'])
  });
}

export function interpolateVersionedWaterEos({ eosId, eosHash, phaseDiagramId, phaseBoundarySourceId, pressureAxisPa, temperatureAxisK, densityKgM3, pressurePa, temperatureK }) {
  if (!eosId || !eosHash || !phaseDiagramId || !phaseBoundarySourceId) return Object.freeze({ status: 'UNSUPPORTED', reason: 'EOS_PHASE_VERSION_PROVENANCE_REQUIRED' });
  if (!strictlyIncreasing(pressureAxisPa) || !strictlyIncreasing(temperatureAxisK)) return Object.freeze({ status: 'UNSUPPORTED', reason: 'STRICTLY_INCREASING_EOS_AXES_REQUIRED' });
  const cellCount = pressureAxisPa.length * temperatureAxisK.length;
  if (pressureAxisPa.length > 4096 || temperatureAxisK.length > 4096 || cellCount > MAX_EOS_CELLS) return Object.freeze({ status: 'UNSUPPORTED', reason: 'EOS_RESOURCE_BOUND_EXCEEDED', maxCells: MAX_EOS_CELLS });
  if (!Array.isArray(densityKgM3) || densityKgM3.length !== pressureAxisPa.length || densityKgM3.some((row) => !Array.isArray(row) || row.length !== temperatureAxisK.length || row.some((x) => !Number.isFinite(x) || x <= 0))) {
    return Object.freeze({ status: 'UNSUPPORTED', reason: 'RECTANGULAR_POSITIVE_EOS_DENSITY_GRID_REQUIRED' });
  }
  const applicability = waterEosApplicabilityContract({
    eosId,
    eosHash,
    phaseDiagramId,
    phaseBoundarySourceId,
    pressurePa,
    temperatureK,
    validityEnvelope: {
      pressureMinPa: pressureAxisPa[0],
      pressureMaxPa: pressureAxisPa[pressureAxisPa.length - 1],
      temperatureMinK: temperatureAxisK[0],
      temperatureMaxK: temperatureAxisK[temperatureAxisK.length - 1]
    }
  });
  if (applicability.status !== 'EOS_COORDINATE_READY') return applicability;
  const p = bracket(pressureAxisPa, pressurePa);
  const t = bracket(temperatureAxisK, temperatureK);
  if (!p || !t) return Object.freeze({ status: 'UNSUPPORTED', reason: 'EOS_QUERY_OUTSIDE_VERSIONED_TABLE' });
  const d00 = densityKgM3[p.lo][t.lo];
  const d01 = densityKgM3[p.lo][t.hi];
  const d10 = densityKgM3[p.hi][t.lo];
  const d11 = densityKgM3[p.hi][t.hi];
  const lower = d00 + (d01 - d00) * t.t;
  const upper = d10 + (d11 - d10) * t.t;
  const density = lower + (upper - lower) * p.t;
  return Object.freeze({
    status: 'MODEL_DERIVED_EOS_INTERPOLATION',
    eosId,
    eosHash,
    phaseDiagramId,
    phaseBoundarySourceId,
    densityKgM3: density,
    interpolationRule: 'BILINEAR_P_T',
    extrapolated: false,
    phaseContext: applicability.phaseContext,
    cell: Object.freeze({ pressureLo: p.lo, pressureHi: p.hi, temperatureLo: t.lo, temperatureHi: t.hi }),
    densityLookupAuthorized: true,
    radiusPredictionAuthorized: false,
    compositionTruthClaim: false
  });
}

export function interpolateVersionedSubNeptuneGrid({ gridId, gridHash, modelFamilyId, massAxisEarth, envelopeFractionAxis, irradiationAxisEarth, ageAxisGyr, radiusEarthFlat, massEarth, envelopeFraction, irradiationEarth, ageGyr }) {
  if (!gridId || !gridHash || !modelFamilyId) return Object.freeze({ status: 'UNSUPPORTED', reason: 'GRID_ID_HASH_AND_MODEL_FAMILY_REQUIRED' });
  if (modelFamilyId !== 'LOPEZ_FORTNEY_2014') return Object.freeze({ status: 'UNSUPPORTED', reason: 'UNSUPPORTED_SUB_NEPTUNE_MODEL_FAMILY' });
  const axes = [massAxisEarth, envelopeFractionAxis, irradiationAxisEarth, ageAxisGyr];
  if (axes.some((axis) => !strictlyIncreasing(axis))) return Object.freeze({ status: 'UNSUPPORTED', reason: 'STRICTLY_INCREASING_4D_AXES_REQUIRED' });
  const domainChecks = [
    [massAxisEarth, SUB_NEPTUNE_SOURCE_DOMAIN.massEarth],
    [envelopeFractionAxis, SUB_NEPTUNE_SOURCE_DOMAIN.envelopeFraction],
    [irradiationAxisEarth, SUB_NEPTUNE_SOURCE_DOMAIN.irradiationEarth],
    [ageAxisGyr, SUB_NEPTUNE_SOURCE_DOMAIN.ageGyr]
  ];
  if (domainChecks.some(([axis, range]) => axis[0] < range[0] || axis[axis.length - 1] > range[1])) return Object.freeze({ status: 'UNSUPPORTED', reason: 'GRID_AXES_EXCEED_DECLARED_SOURCE_FAMILY_DOMAIN' });
  const product = axes.reduce((acc, axis) => acc * axis.length, 1);
  if (product > MAX_SUB_NEPTUNE_CELLS) return Object.freeze({ status: 'UNSUPPORTED', reason: '4D_GRID_RESOURCE_BOUND_EXCEEDED', maxCells: MAX_SUB_NEPTUNE_CELLS });
  if (!Array.isArray(radiusEarthFlat) || radiusEarthFlat.length !== product || radiusEarthFlat.some((x) => !Number.isFinite(x) || x <= 0)) return Object.freeze({ status: 'UNSUPPORTED', reason: 'POSITIVE_FLAT_RADIUS_GRID_REQUIRED' });
  const query = [finite('massEarth', massEarth), finite('envelopeFraction', envelopeFraction), finite('irradiationEarth', irradiationEarth), finite('ageGyr', ageGyr)];
  const scenario = compositionRegimeContract({ massEarth: query[0], radiusEarth: 1, hHeEnvelopeFraction: query[1], irradiationEarth: query[2], ageGyr: query[3] });
  if (scenario.status !== 'SUB_NEPTUNE_SCENARIO_COORDINATE') return scenario;
  const brackets = axes.map((axis, i) => bracket(axis, query[i]));
  if (brackets.some((b) => !b)) return Object.freeze({ status: 'UNSUPPORTED', reason: 'QUERY_OUTSIDE_VERSIONED_4D_GRID' });
  const dims = axes.map((axis) => axis.length);
  const flatIndex = (i0, i1, i2, i3) => (((i0 * dims[1] + i1) * dims[2] + i2) * dims[3] + i3);
  let radiusEarth = 0;
  for (let mask = 0; mask < 16; mask += 1) {
    const idx = [];
    let weight = 1;
    for (let d = 0; d < 4; d += 1) {
      const upper = Boolean(mask & (1 << d));
      idx[d] = upper ? brackets[d].hi : brackets[d].lo;
      weight *= upper ? brackets[d].t : (1 - brackets[d].t);
    }
    radiusEarth += radiusEarthFlat[flatIndex(idx[0], idx[1], idx[2], idx[3])] * weight;
  }
  return Object.freeze({
    status: 'MODEL_DERIVED_SUB_NEPTUNE_GRID_INTERPOLATION',
    gridId,
    gridHash,
    modelFamilyId,
    radiusEarth,
    interpolationRule: '4D_MULTILINEAR_MASS_ENVELOPE_IRRADIATION_AGE',
    extrapolated: false,
    coordinates: Object.freeze({ massEarth: query[0], envelopeFraction: query[1], irradiationEarth: query[2], ageGyr: query[3] }),
    uniqueCompositionInference: false
  });
}

export function thermalLedgerStep({ mantleEnergyJ, radiogenicPowerW, corePowerW, surfaceHeatLossW, durationSeconds }) {
  const e0 = finite('mantleEnergyJ', mantleEnergyJ);
  const hr = finite('radiogenicPowerW', radiogenicPowerW);
  const hc = finite('corePowerW', corePowerW);
  const q = finite('surfaceHeatLossW', surfaceHeatLossW);
  const dt = finite('durationSeconds', durationSeconds);
  if (e0 < 0 || hr < 0 || hc < 0 || q < 0 || dt < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NEGATIVE_ENERGY_POWER_OR_TIME' });
  const sourceJ = (hr + hc) * dt;
  const sinkJ = q * dt;
  const deltaJ = sourceJ - sinkJ;
  const e1 = e0 + deltaJ;
  if (![sourceJ, sinkJ, deltaJ, e1].every(Number.isFinite)) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_FINITE_THERMAL_LEDGER_DERIVED_TERM' });
  if (e1 < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'STEP_DRAINS_MORE_ENERGY_THAN_AVAILABLE' });
  const residualJ = e1 - (e0 + sourceJ - sinkJ);
  if (!Number.isFinite(residualJ)) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_FINITE_THERMAL_LEDGER_RESIDUAL' });
  return Object.freeze({ status: 'CONSERVED', beforeJ: e0, afterJ: e1, sourceJ, sinkJ, residualJ });
}

export function nusseltRayleighScenario({ rayleighNumber, regime }) {
  const ra = finite('rayleighNumber', rayleighNumber);
  if (ra <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_POSITIVE_RAYLEIGH_NUMBER' });
  const beta = regime === 'MOBILE_LID_LIKE' ? 0.26 : regime === 'STAGNANT_LID_LIKE' ? 0.12 : null;
  if (beta == null) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'REGIME_SPECIFIC_SCALING_REQUIRED' });
  return Object.freeze({ status: 'MODEL_DERIVED_SCENARIO', nusseltProportionalTo: Math.pow(ra, beta), exponentBeta: beta, normalizationSpecified: false, plateTectonicsTruthClaim: false, interpretation: 'SCALING_SHAPE_ONLY_UNTIL_NORMALIZATION_AND_RHEOLOGY_ARE_BOUND' });
}

export function laggedNusseltRayleighScenario({ rayleighNumberNow, rayleighNumberPast, lagMyr, regime, contextId, contextHash }) {
  const raNow = finite('rayleighNumberNow', rayleighNumberNow);
  const raPast = finite('rayleighNumberPast', rayleighNumberPast);
  const lag = finite('lagMyr', lagMyr);
  if (!contextId || !contextHash) return Object.freeze({ status: 'UNSUPPORTED', reason: 'LAG_CONTEXT_ID_AND_HASH_REQUIRED' });
  if (raNow <= 0 || raPast <= 0 || lag < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_LAGGED_RA_INPUT' });
  if (lag < 200 || lag > 300) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'OUTSIDE_ONEILL_REPORTED_LAG_CONTEXT' });
  const now = nusseltRayleighScenario({ rayleighNumber: raNow, regime });
  const past = nusseltRayleighScenario({ rayleighNumber: raPast, regime });
  if (now.status !== 'MODEL_DERIVED_SCENARIO' || past.status !== 'MODEL_DERIVED_SCENARIO') return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'REGIME_SCALING_UNAVAILABLE' });
  return Object.freeze({ status: 'MODEL_DERIVED_SCENARIO', instantaneousProxy: now.nusseltProportionalTo, laggedSurfaceProxy: past.nusseltProportionalTo, lagMyr: lag, exponentBeta: now.exponentBeta, contextId, contextHash, interpretation: 'RESEARCH_LAG_SENSITIVITY_BRACKET_NOT_HISTORY_RECONSTRUCTION_OR_UNIVERSAL_PLANETARY_LAG', tectonicHistoryTruthClaim: false });
}

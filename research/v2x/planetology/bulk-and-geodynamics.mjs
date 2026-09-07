export const AUTHORITY = 'RESEARCH_ONLY';

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
    if (m < 1 || m > 20 || f < 0.0001 || f > 0.20 || age < 0.1 || age > 10 || irr < 0.1 || irr > 1000) return Object.freeze({ status: 'UNSUPPORTED', reason: 'OUTSIDE_LOPEZ_FORTNEY_GRID_ENVELOPE' });
    return Object.freeze({ status: 'SUB_NEPTUNE_SCENARIO_COORDINATE', family: 'H_HE_ENVELOPE', uniqueCompositionInference: false, requiresEvolutionGrid: true });
  }
  if (waterMassFraction != null) {
    const f = finite('waterMassFraction', waterMassFraction);
    if (f < 0 || f > 1) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_WATER_MASS_FRACTION' });
    return Object.freeze({ status: 'WATER_RICH_SCENARIO_COORDINATE', family: 'WATER_RICH_HIGH_PRESSURE_EOS_REQUIRED', uniqueCompositionInference: false, requiresHighPressureEos: true });
  }
  return Object.freeze({ status: 'DEGENERATE_BULK_OBSERVABLES', reason: 'MASS_RADIUS_ALONE_DO_NOT_UNIQUELY_IDENTIFY_COMPOSITION', candidateFamilies: Object.freeze(['ROCKY', 'WATER_RICH', 'H_HE_ENVELOPE', 'MIXED']), uniqueCompositionInference: false });
}

export function waterEosApplicabilityContract({ eosId, eosHash, pressurePa, temperatureK, phaseDiagramId = null, extrapolationDeclared = false }) {
  const pressure = finite('pressurePa', pressurePa);
  const temperature = finite('temperatureK', temperatureK);
  if (!eosId || !eosHash) return Object.freeze({ status: 'UNSUPPORTED', reason: 'EOS_ID_AND_HASH_REQUIRED' });
  if (pressure < 0 || temperature <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_PRESSURE_OR_TEMPERATURE' });
  const phaseContext = pressure >= 30e9 ? 'ICE_X_OR_IONIC_BONDING_RELEVANT' : pressure >= 2.1e9 ? 'HIGH_PRESSURE_ICE_VII_FAMILY_RELEVANT' : 'LOWER_PRESSURE_WATER_ICE_LIQUID_REGIME';
  return Object.freeze({
    status: phaseDiagramId ? 'EOS_COORDINATE_READY' : 'RESEARCH_REQUIRED', eosId, eosHash, pressurePa: pressure, temperatureK: temperature, phaseDiagramId, phaseContext,
    extrapolationDeclared: Boolean(extrapolationDeclared), radiusPredictionAuthorized: Boolean(phaseDiagramId) && !extrapolationDeclared, compositionTruthClaim: false,
    requiredEvidence: Object.freeze(['EOS_VERSION', 'EOS_HASH', 'P_T_VALIDITY', 'PHASE_BOUNDARY_SOURCE', 'EXTRAPOLATION_POLICY'])
  });
}

export function interpolateVersionedWaterEos({ eosId, eosHash, phaseDiagramId, pressureAxisPa, temperatureAxisK, densityKgM3, pressurePa, temperatureK }) {
  const applicability = waterEosApplicabilityContract({ eosId, eosHash, phaseDiagramId, pressurePa, temperatureK });
  if (applicability.status !== 'EOS_COORDINATE_READY') return applicability;
  if (!strictlyIncreasing(pressureAxisPa) || !strictlyIncreasing(temperatureAxisK)) return Object.freeze({ status: 'UNSUPPORTED', reason: 'STRICTLY_INCREASING_EOS_AXES_REQUIRED' });
  if (pressureAxisPa.length > 4096 || temperatureAxisK.length > 4096) return Object.freeze({ status: 'UNSUPPORTED', reason: 'EOS_AXIS_RESOURCE_BOUND_EXCEEDED' });
  if (!Array.isArray(densityKgM3) || densityKgM3.length !== pressureAxisPa.length || densityKgM3.some((row) => !Array.isArray(row) || row.length !== temperatureAxisK.length || row.some((x) => !Number.isFinite(x) || x <= 0))) {
    return Object.freeze({ status: 'UNSUPPORTED', reason: 'RECTANGULAR_POSITIVE_EOS_DENSITY_GRID_REQUIRED' });
  }
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
    status: 'MODEL_DERIVED_EOS_INTERPOLATION', eosId, eosHash, phaseDiagramId, densityKgM3: density, interpolationRule: 'BILINEAR_P_T', extrapolated: false,
    cell: Object.freeze({ pressureLo: p.lo, pressureHi: p.hi, temperatureLo: t.lo, temperatureHi: t.hi }), compositionTruthClaim: false
  });
}

export function interpolateVersionedSubNeptuneGrid({ gridId, gridHash, massAxisEarth, envelopeFractionAxis, irradiationAxisEarth, ageAxisGyr, radiusEarthFlat, massEarth, envelopeFraction, irradiationEarth, ageGyr }) {
  if (!gridId || !gridHash) return Object.freeze({ status: 'UNSUPPORTED', reason: 'GRID_ID_AND_HASH_REQUIRED' });
  const axes = [massAxisEarth, envelopeFractionAxis, irradiationAxisEarth, ageAxisGyr];
  if (axes.some((axis) => !strictlyIncreasing(axis))) return Object.freeze({ status: 'UNSUPPORTED', reason: 'STRICTLY_INCREASING_4D_AXES_REQUIRED' });
  const product = axes.reduce((acc, axis) => acc * axis.length, 1);
  if (product > 262144) return Object.freeze({ status: 'UNSUPPORTED', reason: '4D_GRID_RESOURCE_BOUND_EXCEEDED' });
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
    status: 'MODEL_DERIVED_SUB_NEPTUNE_GRID_INTERPOLATION', gridId, gridHash, radiusEarth, interpolationRule: '4D_MULTILINEAR_MASS_ENVELOPE_IRRADIATION_AGE', extrapolated: false,
    coordinates: Object.freeze({ massEarth: query[0], envelopeFraction: query[1], irradiationEarth: query[2], ageGyr: query[3] }), uniqueCompositionInference: false
  });
}

export function thermalLedgerStep({ mantleEnergyJ, radiogenicPowerW, corePowerW, surfaceHeatLossW, durationSeconds }) {
  const e0 = finite('mantleEnergyJ', mantleEnergyJ);
  const hr = finite('radiogenicPowerW', radiogenicPowerW);
  const hc = finite('corePowerW', corePowerW);
  const q = finite('surfaceHeatLossW', surfaceHeatLossW);
  const dt = finite('durationSeconds', durationSeconds);
  if (e0 < 0 || hr < 0 || hc < 0 || q < 0 || dt < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NEGATIVE_ENERGY_POWER_OR_TIME' });
  const deltaJ = (hr + hc - q) * dt;
  const e1 = e0 + deltaJ;
  if (e1 < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'STEP_DRAINS_MORE_ENERGY_THAN_AVAILABLE' });
  return Object.freeze({ status: 'CONSERVED', beforeJ: e0, afterJ: e1, sourceJ: (hr + hc) * dt, sinkJ: q * dt, residualJ: e1 - (e0 + (hr + hc - q) * dt) });
}

export function nusseltRayleighScenario({ rayleighNumber, regime }) {
  const ra = finite('rayleighNumber', rayleighNumber);
  if (ra <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_POSITIVE_RAYLEIGH_NUMBER' });
  const beta = regime === 'MOBILE_LID_LIKE' ? 0.26 : regime === 'STAGNANT_LID_LIKE' ? 0.12 : null;
  if (beta == null) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'REGIME_SPECIFIC_SCALING_REQUIRED' });
  return Object.freeze({ status: 'MODEL_DERIVED_SCENARIO', nusseltProportionalTo: Math.pow(ra, beta), exponentBeta: beta, normalizationSpecified: false, plateTectonicsTruthClaim: false, interpretation: 'SCALING_SHAPE_ONLY_UNTIL_NORMALIZATION_AND_RHEOLOGY_ARE_BOUND' });
}

export function laggedNusseltRayleighScenario({ rayleighNumberNow, rayleighNumberPast, lagMyr, regime }) {
  const raNow = finite('rayleighNumberNow', rayleighNumberNow);
  const raPast = finite('rayleighNumberPast', rayleighNumberPast);
  const lag = finite('lagMyr', lagMyr);
  if (raNow <= 0 || raPast <= 0 || lag < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_LAGGED_RA_INPUT' });
  if (lag < 200 || lag > 300) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'OUTSIDE_ONEILL_REPORTED_LAG_CONTEXT' });
  const now = nusseltRayleighScenario({ rayleighNumber: raNow, regime });
  const past = nusseltRayleighScenario({ rayleighNumber: raPast, regime });
  if (now.status !== 'MODEL_DERIVED_SCENARIO' || past.status !== 'MODEL_DERIVED_SCENARIO') return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'REGIME_SCALING_UNAVAILABLE' });
  return Object.freeze({ status: 'MODEL_DERIVED_SCENARIO', instantaneousProxy: now.nusseltProportionalTo, laggedSurfaceProxy: past.nusseltProportionalTo, lagMyr: lag, exponentBeta: now.exponentBeta, interpretation: 'RESEARCH_LAG_SENSITIVITY_BRACKET_NOT_HISTORY_RECONSTRUCTION', tectonicHistoryTruthClaim: false });
}

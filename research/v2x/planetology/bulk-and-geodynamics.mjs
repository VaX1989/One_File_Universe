export const AUTHORITY = 'RESEARCH_ONLY';

function finite(name, value) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
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
    if (m < 1 || m > 20 || f < 0.0001 || f > 0.20 || age < 0.1 || age > 10 || irr < 0.1 || irr > 1000) {
      return Object.freeze({ status: 'UNSUPPORTED', reason: 'OUTSIDE_LOPEZ_FORTNEY_GRID_ENVELOPE' });
    }
    return Object.freeze({
      status: 'SUB_NEPTUNE_SCENARIO_COORDINATE',
      family: 'H_HE_ENVELOPE',
      uniqueCompositionInference: false,
      requiresEvolutionGrid: true
    });
  }

  if (waterMassFraction != null) {
    const f = finite('waterMassFraction', waterMassFraction);
    if (f < 0 || f > 1) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_WATER_MASS_FRACTION' });
    return Object.freeze({
      status: 'WATER_RICH_SCENARIO_COORDINATE',
      family: 'WATER_RICH_HIGH_PRESSURE_EOS_REQUIRED',
      uniqueCompositionInference: false,
      requiresHighPressureEos: true
    });
  }

  return Object.freeze({
    status: 'DEGENERATE_BULK_OBSERVABLES',
    reason: 'MASS_RADIUS_ALONE_DO_NOT_UNIQUELY_IDENTIFY_COMPOSITION',
    candidateFamilies: Object.freeze(['ROCKY', 'WATER_RICH', 'H_HE_ENVELOPE', 'MIXED']),
    uniqueCompositionInference: false
  });
}

export function waterEosApplicabilityContract({ eosId, eosHash, pressurePa, temperatureK, phaseDiagramId = null, extrapolationDeclared = false }) {
  const pressure = finite('pressurePa', pressurePa);
  const temperature = finite('temperatureK', temperatureK);
  if (!eosId || !eosHash) return Object.freeze({ status: 'UNSUPPORTED', reason: 'EOS_ID_AND_HASH_REQUIRED' });
  if (pressure < 0 || temperature <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_PRESSURE_OR_TEMPERATURE' });
  const phaseContext = pressure >= 30e9 ? 'ICE_X_OR_IONIC_BONDING_RELEVANT' : pressure >= 2.1e9 ? 'HIGH_PRESSURE_ICE_VII_FAMILY_RELEVANT' : 'LOWER_PRESSURE_WATER_ICE_LIQUID_REGIME';
  return Object.freeze({
    status: phaseDiagramId ? 'EOS_COORDINATE_READY' : 'RESEARCH_REQUIRED',
    eosId,
    eosHash,
    pressurePa: pressure,
    temperatureK: temperature,
    phaseDiagramId,
    phaseContext,
    extrapolationDeclared: Boolean(extrapolationDeclared),
    radiusPredictionAuthorized: Boolean(phaseDiagramId) && !extrapolationDeclared,
    compositionTruthClaim: false,
    requiredEvidence: Object.freeze(['EOS_VERSION', 'EOS_HASH', 'P_T_VALIDITY', 'PHASE_BOUNDARY_SOURCE', 'EXTRAPOLATION_POLICY'])
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
  return Object.freeze({
    status: 'CONSERVED',
    beforeJ: e0,
    afterJ: e1,
    sourceJ: (hr + hc) * dt,
    sinkJ: q * dt,
    residualJ: e1 - (e0 + (hr + hc - q) * dt)
  });
}

export function nusseltRayleighScenario({ rayleighNumber, regime }) {
  const ra = finite('rayleighNumber', rayleighNumber);
  if (ra <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_POSITIVE_RAYLEIGH_NUMBER' });
  const beta = regime === 'MOBILE_LID_LIKE' ? 0.26 : regime === 'STAGNANT_LID_LIKE' ? 0.12 : null;
  if (beta == null) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'REGIME_SPECIFIC_SCALING_REQUIRED' });
  return Object.freeze({
    status: 'MODEL_DERIVED_SCENARIO',
    nusseltProportionalTo: Math.pow(ra, beta),
    exponentBeta: beta,
    normalizationSpecified: false,
    plateTectonicsTruthClaim: false,
    interpretation: 'SCALING_SHAPE_ONLY_UNTIL_NORMALIZATION_AND_RHEOLOGY_ARE_BOUND'
  });
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
  return Object.freeze({
    status: 'MODEL_DERIVED_SCENARIO',
    instantaneousProxy: now.nusseltProportionalTo,
    laggedSurfaceProxy: past.nusseltProportionalTo,
    lagMyr: lag,
    exponentBeta: now.exponentBeta,
    interpretation: 'RESEARCH_LAG_SENSITIVITY_BRACKET_NOT_HISTORY_RECONSTRUCTION',
    tectonicHistoryTruthClaim: false
  });
}

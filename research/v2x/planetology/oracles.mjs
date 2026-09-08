export const AUTHORITY = 'RESEARCH_ONLY';

const SIGMA = 5.670374419e-8;
const SYNTHETIC_ESCAPE_THRESHOLD_SET = Object.freeze({
  thresholdSetId: 'research-jeans-threshold-test',
  thresholdSetHash: 'sha256:research-jeans-threshold-test',
  hydrodynamicJeansMax: 3,
  jeansLikeMin: 30,
  boilOffJeansMax: 20
});

function finite(name, value) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}

export function greyAtmosphereSurfaceTemperature({ effectiveTemperatureK, infraredOpticalDepth }) {
  const teff = finite('effectiveTemperatureK', effectiveTemperatureK);
  const tau = finite('infraredOpticalDepth', infraredOpticalDepth);
  if (teff <= 0 || tau < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_PHYSICAL_INPUT' });
  const factor = Math.pow((3 / 4) * (tau + 2 / 3), 0.25);
  return Object.freeze({ status: 'PRESENT', temperatureK: teff * factor, assumptions: 'PLANE_PARALLEL_GREY_RADIATIVE_EQUILIBRIUM_REFERENCE', climateTruthClaim: false });
}

export function classifyEscapeRegime({ jeansParameter, hydrogenSupplyLimited = false, xuvInputsAvailable = false, postDiskBoilOffPossible = false, thresholdSetId, thresholdSetHash, hydrodynamicJeansMax = null, jeansLikeMin = null, boilOffJeansMax = null }) {
  const lambda = finite('jeansParameter', jeansParameter);
  if (!thresholdSetId || !thresholdSetHash) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'ESCAPE_THRESHOLD_SET_ID_AND_HASH_REQUIRED', rateModelAuthorized: false });
  const explicitThresholds = hydrodynamicJeansMax != null && jeansLikeMin != null && boilOffJeansMax != null;
  const syntheticFallbackAuthorized = !explicitThresholds
    && thresholdSetId === SYNTHETIC_ESCAPE_THRESHOLD_SET.thresholdSetId
    && thresholdSetHash === SYNTHETIC_ESCAPE_THRESHOLD_SET.thresholdSetHash;
  if (!explicitThresholds && !syntheticFallbackAuthorized) {
    return Object.freeze({
      status: 'RESEARCH_REQUIRED',
      reason: 'EXPLICIT_ESCAPE_THRESHOLDS_REQUIRED_FOR_NON_SYNTHETIC_THRESHOLD_SET',
      thresholdSetId,
      thresholdSetHash,
      rateModelAuthorized: false,
      universalThresholdClaim: false
    });
  }
  const hydroMax = finite('hydrodynamicJeansMax', explicitThresholds ? hydrodynamicJeansMax : SYNTHETIC_ESCAPE_THRESHOLD_SET.hydrodynamicJeansMax);
  const jeansMin = finite('jeansLikeMin', explicitThresholds ? jeansLikeMin : SYNTHETIC_ESCAPE_THRESHOLD_SET.jeansLikeMin);
  const boilMax = finite('boilOffJeansMax', explicitThresholds ? boilOffJeansMax : SYNTHETIC_ESCAPE_THRESHOLD_SET.boilOffJeansMax);
  if (lambda <= 0 || hydroMax <= 0 || jeansMin <= hydroMax || boilMax <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_JEANS_PARAMETER_OR_THRESHOLD_SET' });
  const thresholdSemantics = Object.freeze({ hydrodynamicJeansMax: hydroMax, jeansLikeMin: jeansMin, boilOffJeansMax: boilMax, universalThresholdClaim: false, syntheticFallbackUsed: syntheticFallbackAuthorized });
  if (hydrogenSupplyLimited) return Object.freeze({ status: 'PRESENT', regime: 'DIFFUSION_LIMITED_CANDIDATE', thresholdSetId, thresholdSetHash, thresholdSemantics, rateModelAuthorized: false });
  if (postDiskBoilOffPossible && lambda < boilMax) return Object.freeze({ status: 'PRESENT', regime: 'BOIL_OFF_OR_HYDRODYNAMIC_CANDIDATE', thresholdSetId, thresholdSetHash, thresholdSemantics, rateModelAuthorized: false });
  if (lambda < hydroMax) return Object.freeze({ status: 'PRESENT', regime: 'HYDRODYNAMIC_ESCAPE_CANDIDATE', thresholdSetId, thresholdSetHash, thresholdSemantics, rateModelAuthorized: false });
  if (lambda > jeansMin) return Object.freeze({ status: 'PRESENT', regime: 'JEANS_LIKE_CANDIDATE', thresholdSetId, thresholdSetHash, thresholdSemantics, rateModelAuthorized: false });
  if (xuvInputsAvailable) return Object.freeze({ status: 'PRESENT', regime: 'ENERGY_LIMITED_EVALUATION_CANDIDATE', thresholdSetId, thresholdSetHash, thresholdSemantics, rateModelAuthorized: false });
  return Object.freeze({ status: 'RESEARCH_REQUIRED', regime: 'AMBIGUOUS_ESCAPE_REGIME', thresholdSetId, thresholdSetHash, thresholdSemantics, rateModelAuthorized: false });
}

export function convectionDiagnostic({ rayleighNumber, nusseltNumber, viscosityContrast, criticalRayleighNumber, parameterSetId, parameterSetHash, smallContrastMax = 1e2, stagnantContrastMin = 1e5 }) {
  const ra = finite('rayleighNumber', rayleighNumber);
  const nu = finite('nusseltNumber', nusseltNumber);
  const contrast = finite('viscosityContrast', viscosityContrast);
  const raCritical = finite('criticalRayleighNumber', criticalRayleighNumber);
  const smallMax = finite('smallContrastMax', smallContrastMax);
  const stagnantMin = finite('stagnantContrastMin', stagnantContrastMin);
  if (!parameterSetId || !parameterSetHash) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'CONVECTION_REGIME_PARAMETER_SET_REQUIRED', plateTectonicsTruthClaim: false });
  if (ra <= 0 || nu <= 0 || contrast <= 0 || raCritical <= 0 || smallMax <= 0 || stagnantMin <= smallMax) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_POSITIVE_OR_INVALID_DIMENSIONLESS_INPUT' });
  if (ra <= raCritical) {
    return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'AT_OR_BELOW_DECLARED_CONVECTION_ONSET', rayleighNumber: ra, criticalRayleighNumber: raCritical, nusseltNumber: nu, parameterSetId, parameterSetHash, regime: 'CONDUCTION_OR_ONSET_CONTEXT', plateTectonicsTruthClaim: false });
  }
  const regime = contrast < smallMax ? 'SMALL_VISCOSITY_CONTRAST' : contrast < stagnantMin ? 'TRANSITIONAL' : 'STAGNANT_LID_LIKE';
  return Object.freeze({ status: 'PRESENT', rayleighNumber: ra, criticalRayleighNumber: raCritical, supercriticality: ra / raCritical, nusseltNumber: nu, viscosityContrast: contrast, regime, parameterSetId, parameterSetHash, thresholds: Object.freeze({ smallContrastMax: smallMax, stagnantContrastMin: stagnantMin, universalThresholdClaim: false, criticalRayleighUniversalClaim: false }), plateTectonicsTruthClaim: false });
}

export function volatileLedger({ surfaceKg, atmosphereKg, interiorKg, deltaSurfaceKg = 0, deltaAtmosphereKg = 0, deltaInteriorKg = 0, externalSourceKg = 0, externalSinkKg = 0 }) {
  const values = { surfaceKg, atmosphereKg, interiorKg, deltaSurfaceKg, deltaAtmosphereKg, deltaInteriorKg, externalSourceKg, externalSinkKg };
  for (const [name, value] of Object.entries(values)) finite(name, value);
  if (surfaceKg < 0 || atmosphereKg < 0 || interiorKg < 0 || externalSourceKg < 0 || externalSinkKg < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NEGATIVE_RESERVOIR_OR_EXTERNAL_FLUX' });
  const afterSurfaceKg = surfaceKg + deltaSurfaceKg;
  const afterAtmosphereKg = atmosphereKg + deltaAtmosphereKg;
  const afterInteriorKg = interiorKg + deltaInteriorKg;
  if (afterSurfaceKg < 0 || afterAtmosphereKg < 0 || afterInteriorKg < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NEGATIVE_POST_STEP_RESERVOIR', afterSurfaceKg, afterAtmosphereKg, afterInteriorKg });
  const before = surfaceKg + atmosphereKg + interiorKg;
  const after = afterSurfaceKg + afterAtmosphereKg + afterInteriorKg;
  const expectedAfter = before + externalSourceKg - externalSinkKg;
  return Object.freeze({
    status: Math.abs(after - expectedAfter) <= Math.max(1e-9 * Math.max(before, expectedAfter, 1), 1e-6) ? 'CONSERVED' : 'NON_CONSERVING',
    beforeKg: before,
    afterKg: after,
    expectedAfterKg: expectedAfter,
    residualKg: after - expectedAfter,
    reservoirsAfterKg: Object.freeze({ surface: afterSurfaceKg, atmosphere: afterAtmosphereKg, interior: afterInteriorKg })
  });
}

export function schlichtingIsothermalImpactLoss({ momentumRatioX }) {
  const x = finite('momentumRatioX', momentumRatioX);
  if (x < 0 || x > 1) return Object.freeze({ status: 'UNSUPPORTED', reason: 'SCENARIO_DOMAIN_X_0_TO_1' });
  const lossFraction = 0.4 * x + 1.4 * x * x - 0.8 * x * x * x;
  return Object.freeze({ status: 'PRESENT', lossFraction: Math.max(0, Math.min(1, lossFraction)), assumptions: 'SCHLICHTING_SARI_YALINEWICH_2015_ISOTHERMAL_SCENARIO', universalImpactHistoryClaim: false });
}

export function streamPowerIncisionScenario({ erodibilityK, drainageAreaM2, slope, areaExponentM, slopeExponentN, parameterSetId, parameterSetHash, timeUnitId }) {
  const K = finite('erodibilityK', erodibilityK);
  const area = finite('drainageAreaM2', drainageAreaM2);
  const s = finite('slope', slope);
  const m = finite('areaExponentM', areaExponentM);
  const n = finite('slopeExponentN', slopeExponentN);
  if (!parameterSetId || !parameterSetHash || !timeUnitId) return Object.freeze({ status: 'UNSUPPORTED', reason: 'PARAMETER_SET_ID_HASH_AND_TIME_UNIT_REQUIRED' });
  if (K < 0 || area < 0 || s < 0 || m < 0 || n <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_STREAM_POWER_PARAMETER' });
  const incisionRateMPerTimeUnit = K * Math.pow(area, m) * Math.pow(s, n);
  if (!Number.isFinite(incisionRateMPerTimeUnit)) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_FINITE_INCISION_RATE' });
  return Object.freeze({
    status: 'MODEL_DERIVED_SCENARIO',
    incisionRateMPerTimeUnit,
    timeUnitId,
    parameterSetId,
    parameterSetHash,
    exponents: Object.freeze({ m, n }),
    assumptions: 'DETACHMENT_LIMITED_STREAM_POWER_E_EQUALS_K_A_POW_M_S_POW_N',
    coefficientUnitsDependOnExponents: true,
    lithologyClimateCalibrationClaim: false,
    universalErosionTruthClaim: false
  });
}

export function upliftIncisionElevationStep({ elevationM, upliftRateMPerTimeUnit, incisionRateMPerTimeUnit, durationTimeUnits, timeUnitId, maxAbsoluteElevationStepM = 1000 }) {
  const z0 = finite('elevationM', elevationM);
  const uplift = finite('upliftRateMPerTimeUnit', upliftRateMPerTimeUnit);
  const incision = finite('incisionRateMPerTimeUnit', incisionRateMPerTimeUnit);
  const dt = finite('durationTimeUnits', durationTimeUnits);
  const maxStep = finite('maxAbsoluteElevationStepM', maxAbsoluteElevationStepM);
  if (!timeUnitId) return Object.freeze({ status: 'UNSUPPORTED', reason: 'TIME_UNIT_ID_REQUIRED' });
  if (uplift < 0 || incision < 0 || dt < 0 || maxStep <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NEGATIVE_RATE_TIME_OR_INVALID_STEP_BOUND' });
  const upliftM = uplift * dt;
  const incisionM = incision * dt;
  const deltaM = upliftM - incisionM;
  if (!Number.isFinite(deltaM) || Math.abs(deltaM) > maxStep) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'ELEVATION_STEP_BOUND_EXCEEDED' });
  return Object.freeze({
    status: 'MODEL_DERIVED_SCENARIO',
    beforeElevationM: z0,
    afterElevationM: z0 + deltaM,
    upliftM,
    incisionM,
    deltaM,
    timeUnitId,
    terrainHistoryTruthClaim: false
  });
}

export function equilibriumFluxFromTemperature({ effectiveTemperatureK }) {
  const t = finite('effectiveTemperatureK', effectiveTemperatureK);
  if (t <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_POSITIVE_TEMPERATURE' });
  return Object.freeze({ status: 'PRESENT', outgoingFluxWm2: SIGMA * Math.pow(t, 4), assumptions: 'BLACKBODY_REFERENCE' });
}

export const researchOracleMetadata = Object.freeze({ syntheticEscapeThresholdSet: SYNTHETIC_ESCAPE_THRESHOLD_SET });

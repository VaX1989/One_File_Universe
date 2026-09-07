export const AUTHORITY = 'RESEARCH_ONLY';

const SIGMA = 5.670374419e-8;

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

export function classifyEscapeRegime({ jeansParameter, hydrogenSupplyLimited = false, xuvInputsAvailable = false, postDiskBoilOffPossible = false }) {
  const lambda = finite('jeansParameter', jeansParameter);
  if (lambda <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_JEANS_PARAMETER' });
  if (hydrogenSupplyLimited) return Object.freeze({ status: 'PRESENT', regime: 'DIFFUSION_LIMITED_CANDIDATE', rateModelAuthorized: false });
  if (postDiskBoilOffPossible && lambda < 20) return Object.freeze({ status: 'PRESENT', regime: 'BOIL_OFF_OR_HYDRODYNAMIC_CANDIDATE', rateModelAuthorized: false });
  if (lambda < 3) return Object.freeze({ status: 'PRESENT', regime: 'HYDRODYNAMIC_ESCAPE_CANDIDATE', rateModelAuthorized: false });
  if (lambda > 30) return Object.freeze({ status: 'PRESENT', regime: 'JEANS_LIKE_CANDIDATE', rateModelAuthorized: false });
  if (xuvInputsAvailable) return Object.freeze({ status: 'PRESENT', regime: 'ENERGY_LIMITED_EVALUATION_CANDIDATE', rateModelAuthorized: false });
  return Object.freeze({ status: 'RESEARCH_REQUIRED', regime: 'AMBIGUOUS_ESCAPE_REGIME', rateModelAuthorized: false });
}

export function convectionDiagnostic({ rayleighNumber, nusseltNumber, viscosityContrast }) {
  const ra = finite('rayleighNumber', rayleighNumber);
  const nu = finite('nusseltNumber', nusseltNumber);
  const contrast = finite('viscosityContrast', viscosityContrast);
  if (ra <= 0 || nu <= 0 || contrast <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_POSITIVE_DIMENSIONLESS_INPUT' });
  const regime = contrast < 1e2 ? 'SMALL_VISCOSITY_CONTRAST' : contrast < 1e5 ? 'TRANSITIONAL' : 'STAGNANT_LID_LIKE';
  return Object.freeze({ status: 'PRESENT', rayleighNumber: ra, nusseltNumber: nu, viscosityContrast: contrast, regime, plateTectonicsTruthClaim: false });
}

export function volatileLedger({ surfaceKg, atmosphereKg, interiorKg, deltaSurfaceKg = 0, deltaAtmosphereKg = 0, deltaInteriorKg = 0, externalSourceKg = 0, externalSinkKg = 0 }) {
  const values = { surfaceKg, atmosphereKg, interiorKg, deltaSurfaceKg, deltaAtmosphereKg, deltaInteriorKg, externalSourceKg, externalSinkKg };
  for (const [name, value] of Object.entries(values)) finite(name, value);
  if (surfaceKg < 0 || atmosphereKg < 0 || interiorKg < 0 || externalSourceKg < 0 || externalSinkKg < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NEGATIVE_RESERVOIR_OR_EXTERNAL_FLUX' });
  const before = surfaceKg + atmosphereKg + interiorKg;
  const after = before + deltaSurfaceKg + deltaAtmosphereKg + deltaInteriorKg;
  const expectedAfter = before + externalSourceKg - externalSinkKg;
  return Object.freeze({ status: Math.abs(after - expectedAfter) <= Math.max(1e-9 * Math.max(before, expectedAfter, 1), 1e-6) ? 'CONSERVED' : 'NON_CONSERVING', beforeKg: before, afterKg: after, expectedAfterKg: expectedAfter, residualKg: after - expectedAfter });
}

export function schlichtingIsothermalImpactLoss({ momentumRatioX }) {
  const x = finite('momentumRatioX', momentumRatioX);
  if (x < 0 || x > 1) return Object.freeze({ status: 'UNSUPPORTED', reason: 'SCENARIO_DOMAIN_X_0_TO_1' });
  const lossFraction = 0.4 * x + 1.4 * x * x - 0.8 * x * x * x;
  return Object.freeze({ status: 'PRESENT', lossFraction: Math.max(0, Math.min(1, lossFraction)), assumptions: 'SCHLICHTING_SARI_YALINEWICH_2015_ISOTHERMAL_SCENARIO', universalImpactHistoryClaim: false });
}

export function equilibriumFluxFromTemperature({ effectiveTemperatureK }) {
  const t = finite('effectiveTemperatureK', effectiveTemperatureK);
  if (t <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_POSITIVE_TEMPERATURE' });
  return Object.freeze({ status: 'PRESENT', outgoingFluxWm2: SIGMA * Math.pow(t, 4), assumptions: 'BLACKBODY_REFERENCE' });
}

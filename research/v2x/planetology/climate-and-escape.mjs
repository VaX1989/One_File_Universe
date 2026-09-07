export const AUTHORITY = 'RESEARCH_ONLY';

const SIGMA = 5.670374419e-8;
const G = 6.67430e-11;
const M_EARTH = 5.9722e24;
const R_EARTH = 6_371_000;

function finite(name, value) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}

export function zeroDimensionalEbm({ stellarFluxWm2, bondAlbedo, outgoingLongwaveA = 210, outgoingLongwaveB = 2, referenceTemperatureK = 273.15 }) {
  const s = finite('stellarFluxWm2', stellarFluxWm2);
  const a = finite('bondAlbedo', bondAlbedo);
  const A = finite('outgoingLongwaveA', outgoingLongwaveA);
  const B = finite('outgoingLongwaveB', outgoingLongwaveB);
  const tref = finite('referenceTemperatureK', referenceTemperatureK);
  if (s <= 0 || a < 0 || a >= 1 || B <= 0 || tref <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_EBM_INPUT' });
  const absorbed = s * (1 - a) / 4;
  const temperatureK = tref + (absorbed - A) / B;
  return Object.freeze({
    status: Number.isFinite(temperatureK) && temperatureK > 0 ? 'PRESENT' : 'UNSUPPORTED',
    temperatureK,
    absorbedShortwaveWm2: absorbed,
    outgoingLongwaveAtSolutionWm2: A + B * (temperatureK - tref),
    assumptions: 'ZERO_DIMENSIONAL_LINEAR_OLR_ENERGY_BALANCE',
    weatherTruthClaim: false,
    gcmTruthClaim: false
  });
}

export function orbitalMeanFluxFactor({ eccentricity }) {
  const e = finite('eccentricity', eccentricity);
  if (e < 0 || e >= 1) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_ECCENTRICITY' });
  return Object.freeze({ status: 'PRESENT', factor: 1 / Math.sqrt(1 - e * e), interpretation: 'ORBIT_MEAN_INVERSE_SQUARE_FLUX_FACTOR' });
}

export function energyLimitedEscapeApplicability({ planetMassEarth, planetRadiusEarth, xuvFluxWm2, efficiency, absorptionRadiusEarth = null, rocheCorrection = null, diffusionLimited = false, boilOffCandidate = false }) {
  const m = finite('planetMassEarth', planetMassEarth);
  const r = finite('planetRadiusEarth', planetRadiusEarth);
  const fxuv = finite('xuvFluxWm2', xuvFluxWm2);
  const eta = finite('efficiency', efficiency);
  if (m <= 0 || r <= 0 || fxuv < 0 || eta <= 0 || eta > 1) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_ESCAPE_INPUT' });
  if (diffusionLimited) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'DIFFUSION_LIMIT_CAN_DOMINATE', rateAuthorized: false });
  if (boilOffCandidate) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'BOIL_OFF_REGIME_REQUIRES_DISTINCT_MODEL', rateAuthorized: false });
  if (absorptionRadiusEarth == null || rocheCorrection == null) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'R_XUV_AND_ROCHE_CORRECTION_REQUIRED', rateAuthorized: false });
  const rxuv = finite('absorptionRadiusEarth', absorptionRadiusEarth);
  const K = finite('rocheCorrection', rocheCorrection);
  if (rxuv <= 0 || K <= 0 || K > 1) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_ESCAPE_GEOMETRY' });
  const rateKgPerS = eta * Math.PI * Math.pow(rxuv * R_EARTH, 3) * fxuv / (G * (m * M_EARTH) * K);
  return Object.freeze({
    status: 'MODEL_DERIVED_RATE_CANDIDATE',
    rateKgPerS,
    rateAuthorized: true,
    assumptions: 'ENERGY_LIMITED_ESCAPE_WITH_EXPLICIT_EFFICIENCY_RXUV_AND_ROCHE_CORRECTION',
    universalEscapeTruthClaim: false
  });
}

export function blackbodyEmission({ temperatureK }) {
  const t = finite('temperatureK', temperatureK);
  if (t <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_POSITIVE_TEMPERATURE' });
  return Object.freeze({ status: 'PRESENT', fluxWm2: SIGMA * Math.pow(t, 4) });
}

export const AUTHORITY = 'RESEARCH_ONLY';

const G_SI = 6.67430e-11;
const M_EARTH_KG = 5.9722e24;
const M_SUN_KG = 1.98847e30;
const R_EARTH_M = 6_371_000;
const R_GAS = 8.31446261815324;
const HILL_CIRCULAR_EPSILON = 1e-12;
const HILL_LOW_MASS_RATIO_MAX = 1e-3;
const ARCSEC_PER_RADIAN = 648000 / Math.PI;
const AU_PER_PARSEC = ARCSEC_PER_RADIAN;

function finite(name, value) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}

function hillMassRatio({ starMassSolar, innerMassEarth, outerMassEarth }) {
  return ((innerMassEarth + outerMassEarth) * M_EARTH_KG) / (starMassSolar * M_SUN_KG);
}

export function pairwiseHillScreen({ starMassSolar, innerMassEarth, outerMassEarth, innerSemiMajorAxisAu, outerSemiMajorAxisAu, eccentricityInner = 0, eccentricityOuter = 0, mutualInclinationDeg = 0 }) {
  const mStar = finite('starMassSolar', starMassSolar);
  const m1 = finite('innerMassEarth', innerMassEarth);
  const m2 = finite('outerMassEarth', outerMassEarth);
  const a1 = finite('innerSemiMajorAxisAu', innerSemiMajorAxisAu);
  const a2 = finite('outerSemiMajorAxisAu', outerSemiMajorAxisAu);
  const e1 = finite('eccentricityInner', eccentricityInner);
  const e2 = finite('eccentricityOuter', eccentricityOuter);
  const inc = finite('mutualInclinationDeg', mutualInclinationDeg);
  if (mStar <= 0 || m1 <= 0 || m2 <= 0 || a1 <= 0 || a2 <= a1) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_POSITIVE_OR_UNORDERED_INPUT' });
  if (e1 < 0 || e2 < 0 || e1 >= 1 || e2 >= 1 || inc < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_ORBIT_ELEMENT' });
  if (Math.abs(e1) > HILL_CIRCULAR_EPSILON || Math.abs(e2) > HILL_CIRCULAR_EPSILON || Math.abs(inc) > HILL_CIRCULAR_EPSILON) {
    return Object.freeze({ status: 'DYNAMICAL_ANALYSIS_REQUIRED', reason: 'GLADMAN_2SQRT3_SCREEN_REQUIRES_INITIALLY_CIRCULAR_COPLANAR_ORBITS', nBodyTruthClaim: false });
  }
  const planetToStarMassRatio = hillMassRatio({ starMassSolar: mStar, innerMassEarth: m1, outerMassEarth: m2 });
  if (planetToStarMassRatio > HILL_LOW_MASS_RATIO_MAX) {
    return Object.freeze({ status: 'DYNAMICAL_ANALYSIS_REQUIRED', reason: 'OUTSIDE_CONSERVATIVE_LOW_MASS_HILL_APPROXIMATION_GUARD', planetToStarMassRatio, lowMassRatioGuard: HILL_LOW_MASS_RATIO_MAX, nBodyTruthClaim: false });
  }
  const mutualHillRadiusAu = ((a1 + a2) / 2) * Math.cbrt(planetToStarMassRatio / 3);
  const delta = (a2 - a1) / mutualHillRadiusAu;
  const threshold = 2 * Math.sqrt(3);
  return Object.freeze({
    status: delta > threshold ? 'SCREENED_HILL_STABLE' : 'DYNAMICAL_ANALYSIS_REQUIRED',
    deltaMutualHill: delta,
    threshold,
    mutualHillRadiusAu,
    planetToStarMassRatio,
    lowMassRatioGuard: HILL_LOW_MASS_RATIO_MAX,
    claim: 'PAIRWISE_INITIALLY_CIRCULAR_COPLANAR_LOW_MASS_HILL_SCREEN_ONLY',
    lagrangeStabilityTruthClaim: false,
    resonanceSafetyTruthClaim: false,
    nBodyTruthClaim: false
  });
}

export function minimumOuterAxisForCircularHillScreen({ starMassSolar, innerMassEarth, outerMassEarth, innerSemiMajorAxisAu }) {
  const mStar = finite('starMassSolar', starMassSolar);
  const m1 = finite('innerMassEarth', innerMassEarth);
  const m2 = finite('outerMassEarth', outerMassEarth);
  const a1 = finite('innerSemiMajorAxisAu', innerSemiMajorAxisAu);
  if (mStar <= 0 || m1 <= 0 || m2 <= 0 || a1 <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_POSITIVE_INPUT' });
  const massRatio = hillMassRatio({ starMassSolar: mStar, innerMassEarth: m1, outerMassEarth: m2 });
  if (massRatio > HILL_LOW_MASS_RATIO_MAX) return Object.freeze({ status: 'DYNAMICAL_ANALYSIS_REQUIRED', reason: 'OUTSIDE_CONSERVATIVE_LOW_MASS_HILL_APPROXIMATION_GUARD', planetToStarMassRatio: massRatio, lowMassRatioGuard: HILL_LOW_MASS_RATIO_MAX });
  const muThird = Math.cbrt(massRatio / 3);
  const k = Math.sqrt(3) * muThird;
  if (k >= 1) return Object.freeze({ status: 'UNSUPPORTED', reason: 'LOW_MASS_HILL_APPROXIMATION_BREAKDOWN' });
  const minimumAxisRatio = (1 + k) / (1 - k);
  return Object.freeze({
    status: 'PRESENT',
    minimumOuterSemiMajorAxisAu: a1 * minimumAxisRatio,
    minimumAxisRatio,
    threshold: 2 * Math.sqrt(3),
    planetToStarMassRatio: massRatio,
    lowMassRatioGuard: HILL_LOW_MASS_RATIO_MAX,
    claim: 'ALGEBRAIC_INVERSION_OF_CIRCULAR_COPLANAR_MUTUAL_HILL_SCREEN',
    lagrangeStabilityTruthClaim: false,
    nBodyTruthClaim: false
  });
}

export function rockyRadiusPrem({ massEarth, coreMassFraction }) {
  const mass = finite('massEarth', massEarth);
  const cmf = finite('coreMassFraction', coreMassFraction);
  if (mass < 1 || mass > 8) return Object.freeze({ status: 'UNSUPPORTED', reason: 'SOURCE_DOMAIN_MASS_1_TO_8_EARTH' });
  if (cmf < 0 || cmf > 0.4) return Object.freeze({ status: 'UNSUPPORTED', reason: 'SOURCE_DOMAIN_CMF_0_TO_0_4' });
  const radiusEarth = (1.07 - 0.21 * cmf) * Math.pow(mass, 1 / 3.7);
  return Object.freeze({ status: 'PRESENT', radiusEarth, radiusMeters: radiusEarth * R_EARTH_M, relation: 'PREM_STYLE_ROCKY_REFERENCE', uniqueCompositionInference: false });
}

export function rockyRadiusPremInterval({ massEarthMin, massEarthMax, coreMassFractionMin, coreMassFractionMax }) {
  const mLo = finite('massEarthMin', massEarthMin);
  const mHi = finite('massEarthMax', massEarthMax);
  const cLo = finite('coreMassFractionMin', coreMassFractionMin);
  const cHi = finite('coreMassFractionMax', coreMassFractionMax);
  if (mLo > mHi || cLo > cHi) return Object.freeze({ status: 'UNSUPPORTED', reason: 'REVERSED_INTERVAL' });
  if (mLo < 1 || mHi > 8 || cLo < 0 || cHi > 0.4) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INTERVAL_EXCEEDS_SOURCE_DOMAIN' });
  const lower = rockyRadiusPrem({ massEarth: mLo, coreMassFraction: cHi });
  const upper = rockyRadiusPrem({ massEarth: mHi, coreMassFraction: cLo });
  return Object.freeze({ status: 'PRESENT', radiusEarthMin: lower.radiusEarth, radiusEarthMax: upper.radiusEarth, propagation: 'MONOTONIC_ENDPOINT_ENVELOPE_NO_PROBABILISTIC_POSTERIOR', uniqueCompositionInference: false });
}

export function hydrostaticScaleHeight({ temperatureK, molarMassKgPerMol, gravityMps2 }) {
  const t = finite('temperatureK', temperatureK);
  const mu = finite('molarMassKgPerMol', molarMassKgPerMol);
  const g = finite('gravityMps2', gravityMps2);
  if (t <= 0 || mu <= 0 || g <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_POSITIVE_THERMODYNAMIC_INPUT' });
  const scaleHeightMeters = (R_GAS * t) / (mu * g);
  if (!Number.isFinite(scaleHeightMeters) || scaleHeightMeters <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_FINITE_SCALE_HEIGHT' });
  return Object.freeze({ status: 'PRESENT', scaleHeightMeters, assumptions: 'IDEAL_GAS_ISOTHERMAL_HYDROSTATIC_REFERENCE' });
}

export function bandpassDistanceModulus({ absoluteMagnitude, distancePc, extinctionMagnitude, bandpassId, magnitudeSystem }) {
  const M = finite('absoluteMagnitude', absoluteMagnitude);
  const d = finite('distancePc', distancePc);
  const extinction = finite('extinctionMagnitude', extinctionMagnitude);
  if (!bandpassId || !magnitudeSystem || magnitudeSystem === 'UNSPECIFIED') return Object.freeze({ status: 'UNSUPPORTED', reason: 'EXPLICIT_BANDPASS_AND_MAGNITUDE_SYSTEM_REQUIRED' });
  if (d <= 0 || extinction < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_DISTANCE_OR_EXTINCTION' });
  const distanceModulus = 5 * Math.log10(d) - 5;
  const apparentMagnitude = M + distanceModulus + extinction;
  if (!Number.isFinite(distanceModulus) || !Number.isFinite(apparentMagnitude)) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_FINITE_PHOTOMETRIC_TRANSFORM' });
  return Object.freeze({
    status: 'PRESENT',
    bandpassId,
    magnitudeSystem,
    absoluteMagnitude: M,
    distancePc: d,
    extinctionMagnitude: extinction,
    distanceModulus,
    apparentMagnitude,
    assumptions: 'DISTANCE_MODULUS_WITH_EXPLICIT_BANDPASS_MAGNITUDE_SYSTEM_EXTINCTION_AND_CALLER_SUPPLIED_DISTANCE_DEFINITION',
    surveyCompletenessClaim: false,
    extinctionModelClaim: false,
    cosmologyClaim: false
  });
}

export function angularObservabilityGeometry({ distancePc, projectedSeparationAu }) {
  const d = finite('distancePc', distancePc);
  const separation = finite('projectedSeparationAu', projectedSeparationAu);
  if (d <= 0 || separation < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_GEOMETRY_INPUT' });
  const lineOfSightDistanceAu = d * AU_PER_PARSEC;
  if (!Number.isFinite(lineOfSightDistanceAu) || lineOfSightDistanceAu <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'GEOMETRY_SCALE_OVERFLOW' });
  const exactProjectedAngularSeparationArcsec = Math.atan2(separation, lineOfSightDistanceAu) * ARCSEC_PER_RADIAN;
  const smallAngleApproxArcsec = separation / d;
  const approximationAbsoluteErrorArcsec = smallAngleApproxArcsec - exactProjectedAngularSeparationArcsec;
  const approximationRelativeError = exactProjectedAngularSeparationArcsec > 0 ? approximationAbsoluteErrorArcsec / exactProjectedAngularSeparationArcsec : 0;
  const parallaxArcsec = Math.atan2(1, lineOfSightDistanceAu) * ARCSEC_PER_RADIAN;
  const inverseDistanceParallaxApproxArcsec = 1 / d;
  const parallaxApproximationAbsoluteErrorArcsec = inverseDistanceParallaxApproxArcsec - parallaxArcsec;
  const parallaxApproximationRelativeError = parallaxArcsec > 0 ? parallaxApproximationAbsoluteErrorArcsec / parallaxArcsec : 0;
  if (![exactProjectedAngularSeparationArcsec, smallAngleApproxArcsec, approximationAbsoluteErrorArcsec, approximationRelativeError, parallaxArcsec, inverseDistanceParallaxApproxArcsec, parallaxApproximationAbsoluteErrorArcsec, parallaxApproximationRelativeError].every(Number.isFinite)) {
    return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_FINITE_ANGULAR_GEOMETRY' });
  }
  return Object.freeze({
    status: 'PRESENT',
    parallaxArcsec,
    inverseDistanceParallaxApproxArcsec,
    parallaxApproximationAbsoluteErrorArcsec,
    parallaxApproximationRelativeError,
    projectedAngularSeparationArcsec: exactProjectedAngularSeparationArcsec,
    smallAngleApproxArcsec,
    smallAngleApproximationAbsoluteErrorArcsec: approximationAbsoluteErrorArcsec,
    smallAngleApproximationRelativeError: approximationRelativeError,
    assumptions: 'EXACT_ATAN2_GEOMETRY_WITH_IAU_PARSEC_AU_CONVERSION; INVERSE_DISTANCE_AND_SMALL_ANGLE_VALUES_RETAINED_ONLY_AS_APPROXIMATION_DIAGNOSTICS',
    instrumentResolutionClaim: false,
    detectionProbabilityClaim: false
  });
}

export const constants = Object.freeze({ G_SI, M_EARTH_KG, M_SUN_KG, R_EARTH_M, R_GAS, HILL_LOW_MASS_RATIO_MAX, ARCSEC_PER_RADIAN, AU_PER_PARSEC });

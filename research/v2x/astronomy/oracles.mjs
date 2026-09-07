export const AUTHORITY = 'RESEARCH_ONLY';

const G_SI = 6.67430e-11;
const M_EARTH_KG = 5.9722e24;
const M_SUN_KG = 1.98847e30;
const R_EARTH_M = 6_371_000;
const R_GAS = 8.31446261815324;

function finite(name, value) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
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
  if (e1 > 0.05 || e2 > 0.05 || inc > 2) return Object.freeze({ status: 'DYNAMICAL_ANALYSIS_REQUIRED', reason: 'OUTSIDE_CIRCULAR_COPLANAR_SCREEN_DOMAIN' });

  const planetToStarMassRatio = ((m1 + m2) * M_EARTH_KG) / (mStar * M_SUN_KG);
  const mutualHillRadiusAu = ((a1 + a2) / 2) * Math.cbrt(planetToStarMassRatio / 3);
  const delta = (a2 - a1) / mutualHillRadiusAu;
  const threshold = 2 * Math.sqrt(3);
  return Object.freeze({
    status: delta > threshold ? 'SCREENED_HILL_STABLE' : 'DYNAMICAL_ANALYSIS_REQUIRED',
    deltaMutualHill: delta,
    threshold,
    mutualHillRadiusAu,
    claim: 'PAIRWISE_LOW_E_LOW_I_HILL_SCREEN_ONLY',
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

export function hydrostaticScaleHeight({ temperatureK, molarMassKgPerMol, gravityMps2 }) {
  const t = finite('temperatureK', temperatureK);
  const mu = finite('molarMassKgPerMol', molarMassKgPerMol);
  const g = finite('gravityMps2', gravityMps2);
  if (t <= 0 || mu <= 0 || g <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_POSITIVE_THERMODYNAMIC_INPUT' });
  return Object.freeze({ status: 'PRESENT', scaleHeightMeters: (R_GAS * t) / (mu * g), assumptions: 'IDEAL_GAS_ISOTHERMAL_HYDROSTATIC_REFERENCE' });
}

export const constants = Object.freeze({ G_SI, M_EARTH_KG, M_SUN_KG, R_EARTH_M, R_GAS });

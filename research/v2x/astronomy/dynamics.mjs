export const AUTHORITY = 'RESEARCH_ONLY';

const G_SI = 6.67430e-11;
const M_EARTH_KG = 5.9722e24;
const M_SUN_KG = 1.98847e30;
const AU_M = 149_597_870_700;

function finite(name, value) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}

function radians(deg) {
  return deg * Math.PI / 180;
}

export function angularMomentumDeficit({ starMassSolar, planets }) {
  const mStar = finite('starMassSolar', starMassSolar);
  if (mStar <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_POSITIVE_STELLAR_MASS' });
  if (!Array.isArray(planets) || planets.length < 1) return Object.freeze({ status: 'UNSUPPORTED', reason: 'PLANET_ARRAY_REQUIRED' });

  let circularAngularMomentumSI = 0;
  let amdSI = 0;
  const terms = [];
  for (let i = 0; i < planets.length; i += 1) {
    const p = planets[i] ?? {};
    const massEarth = finite(`planets[${i}].massEarth`, p.massEarth);
    const semiMajorAxisAu = finite(`planets[${i}].semiMajorAxisAu`, p.semiMajorAxisAu);
    const eccentricity = finite(`planets[${i}].eccentricity`, p.eccentricity ?? 0);
    const inclinationDeg = finite(`planets[${i}].inclinationDeg`, p.inclinationDeg ?? 0);
    if (massEarth <= 0 || semiMajorAxisAu <= 0 || eccentricity < 0 || eccentricity >= 1 || inclinationDeg < 0 || inclinationDeg > 180) {
      return Object.freeze({ status: 'UNSUPPORTED', reason: `INVALID_PLANET_${i}_ELEMENT` });
    }
    const lambdaSI = (massEarth * M_EARTH_KG) * Math.sqrt(G_SI * (mStar * M_SUN_KG) * (semiMajorAxisAu * AU_M));
    const deficitFactor = 1 - Math.sqrt(1 - eccentricity * eccentricity) * Math.cos(radians(inclinationDeg));
    const termSI = lambdaSI * deficitFactor;
    circularAngularMomentumSI += lambdaSI;
    amdSI += termSI;
    terms.push(Object.freeze({ index: i, lambdaSI, deficitFactor, amdTermSI: termSI }));
  }
  return Object.freeze({
    status: 'PRESENT',
    amdSI,
    circularAngularMomentumSI,
    normalizedAmd: circularAngularMomentumSI > 0 ? amdSI / circularAngularMomentumSI : 0,
    terms: Object.freeze(terms),
    interpretation: 'AMD_DEFINITION_DIAGNOSTIC_ONLY',
    amdStabilityThresholdApplied: false,
    nBodyTruthClaim: false
  });
}

export function radialOrbitOverlapScreen({ innerSemiMajorAxisAu, innerEccentricity, outerSemiMajorAxisAu, outerEccentricity }) {
  const a1 = finite('innerSemiMajorAxisAu', innerSemiMajorAxisAu);
  const e1 = finite('innerEccentricity', innerEccentricity);
  const a2 = finite('outerSemiMajorAxisAu', outerSemiMajorAxisAu);
  const e2 = finite('outerEccentricity', outerEccentricity);
  if (a1 <= 0 || a2 <= a1 || e1 < 0 || e1 >= 1 || e2 < 0 || e2 >= 1) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_OR_UNORDERED_ORBITS' });
  const innerApoapsisAu = a1 * (1 + e1);
  const outerPeriapsisAu = a2 * (1 - e2);
  return Object.freeze({
    status: innerApoapsisAu < outerPeriapsisAu ? 'NO_CURRENT_RADIAL_OVERLAP' : 'RADIAL_OVERLAP_OR_TOUCH',
    innerApoapsisAu,
    outerPeriapsisAu,
    claim: 'OSCULATING_GEOMETRY_SCREEN_ONLY',
    stabilityTruthClaim: false
  });
}

export function dynamicsEscalation({ hillScreenStatus, radialOverlapStatus, amdDiagnostic }) {
  if (!amdDiagnostic || amdDiagnostic.status !== 'PRESENT') return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'AMD_DIAGNOSTIC_REQUIRED' });
  if (radialOverlapStatus === 'RADIAL_OVERLAP_OR_TOUCH') return Object.freeze({ status: 'DYNAMICAL_ANALYSIS_REQUIRED', reason: 'OSCULATING_RADIAL_OVERLAP' });
  if (hillScreenStatus !== 'SCREENED_HILL_STABLE') return Object.freeze({ status: 'DYNAMICAL_ANALYSIS_REQUIRED', reason: 'PAIRWISE_HILL_SCREEN_NOT_PASSED' });
  return Object.freeze({
    status: 'LOW_COST_SCREENS_PASSED',
    reason: 'PAIRWISE_HILL_AND_CURRENT_RADIAL_GEOMETRY_PASS',
    residualRisk: 'RESONANCES_SECULAR_CHAOS_MULTI_BODY_AND_LONG_TERM_EVOLUTION_UNRESOLVED',
    nBodyTruthClaim: false
  });
}

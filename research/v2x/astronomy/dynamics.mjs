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

export function collisionCriticalAmd({ alpha, gamma, maxIterations = 96 }) {
  const a = finite('alpha', alpha);
  const g = finite('gamma', gamma);
  if (!(a > 0 && a < 1) || g <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'REQUIRE_0_LT_ALPHA_LT_1_AND_GAMMA_GT_0' });
  if (!Number.isInteger(maxIterations) || maxIterations < 16 || maxIterations > 256) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_ITERATION_BOUND' });

  const F = (e1) => a * e1 + (g * e1) / Math.sqrt(a * (1 - e1 * e1) + g * g * e1 * e1) - 1 + a;
  let lo = 0;
  let hi = 1 - Number.EPSILON;
  let flo = F(lo);
  let fhi = F(hi);
  if (!(flo <= 0 && fhi >= 0)) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'CRITICAL_ROOT_NOT_BRACKETED' });
  for (let i = 0; i < maxIterations; i += 1) {
    const mid = (lo + hi) / 2;
    const fm = F(mid);
    if (fm > 0) {
      hi = mid;
      fhi = fm;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  const criticalInnerEccentricity = (lo + hi) / 2;
  const criticalOuterEccentricity = 1 - a - a * criticalInnerEccentricity;
  if (!(criticalOuterEccentricity >= 0 && criticalOuterEccentricity < 1)) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'CRITICAL_OUTER_ECCENTRICITY_OUT_OF_DOMAIN' });
  const relativeCriticalAmd = g * Math.sqrt(a) * (1 - Math.sqrt(1 - criticalInnerEccentricity ** 2))
    + (1 - Math.sqrt(1 - criticalOuterEccentricity ** 2));
  return Object.freeze({
    status: 'PRESENT',
    alpha: a,
    gamma: g,
    criticalInnerEccentricity,
    criticalOuterEccentricity,
    relativeCriticalAmd,
    rootResidual: F(criticalInnerEccentricity),
    bracketWidth: hi - lo,
    iterations: maxIterations,
    normalization: 'OUTER_CIRCULAR_ANGULAR_MOMENTUM',
    claim: 'LASKAR_PETIT_PAIRWISE_COPLANAR_COLLISION_CRITICAL_AMD',
    meanMotionResonanceTruthClaim: false,
    hillStabilityTruthClaim: false,
    nBodyTruthClaim: false
  });
}

export function pairwiseCollisionAmdScreen({ innerMassEarth, outerMassEarth, innerSemiMajorAxisAu, outerSemiMajorAxisAu, innerEccentricity, outerEccentricity }) {
  const m1 = finite('innerMassEarth', innerMassEarth);
  const m2 = finite('outerMassEarth', outerMassEarth);
  const a1 = finite('innerSemiMajorAxisAu', innerSemiMajorAxisAu);
  const a2 = finite('outerSemiMajorAxisAu', outerSemiMajorAxisAu);
  const e1 = finite('innerEccentricity', innerEccentricity);
  const e2 = finite('outerEccentricity', outerEccentricity);
  if (m1 <= 0 || m2 <= 0 || a1 <= 0 || a2 <= a1 || e1 < 0 || e1 >= 1 || e2 < 0 || e2 >= 1) {
    return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_PAIRWISE_AMD_INPUT' });
  }
  const alpha = a1 / a2;
  const gamma = m1 / m2;
  const critical = collisionCriticalAmd({ alpha, gamma });
  if (critical.status !== 'PRESENT') return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'CRITICAL_AMD_UNAVAILABLE' });
  const relativeAmd = gamma * Math.sqrt(alpha) * (1 - Math.sqrt(1 - e1 * e1)) + (1 - Math.sqrt(1 - e2 * e2));
  const margin = critical.relativeCriticalAmd - relativeAmd;
  return Object.freeze({
    status: margin > 0 ? 'AMD_COLLISION_STABLE_SCREEN' : 'DYNAMICAL_ANALYSIS_REQUIRED',
    relativeAmd,
    relativeCriticalAmd: critical.relativeCriticalAmd,
    margin,
    alpha,
    gamma,
    scope: 'PAIRWISE_COPLANAR_COLLISION_AMD_ONLY',
    meanMotionResonanceTruthClaim: false,
    hillStabilityTruthClaim: false,
    lagrangeStabilityTruthClaim: false,
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

export function dynamicsEscalation({ hillScreenStatus, radialOverlapStatus, amdDiagnostic, collisionAmdScreenStatus = null }) {
  if (!amdDiagnostic || amdDiagnostic.status !== 'PRESENT') return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'AMD_DIAGNOSTIC_REQUIRED' });
  if (radialOverlapStatus === 'RADIAL_OVERLAP_OR_TOUCH') return Object.freeze({ status: 'DYNAMICAL_ANALYSIS_REQUIRED', reason: 'OSCULATING_RADIAL_OVERLAP' });
  if (collisionAmdScreenStatus === 'DYNAMICAL_ANALYSIS_REQUIRED') return Object.freeze({ status: 'DYNAMICAL_ANALYSIS_REQUIRED', reason: 'PAIRWISE_COLLISION_AMD_SCREEN_NOT_PASSED' });
  if (hillScreenStatus !== 'SCREENED_HILL_STABLE') return Object.freeze({ status: 'DYNAMICAL_ANALYSIS_REQUIRED', reason: 'PAIRWISE_HILL_SCREEN_NOT_PASSED' });
  return Object.freeze({
    status: 'LOW_COST_SCREENS_PASSED',
    reason: collisionAmdScreenStatus === 'AMD_COLLISION_STABLE_SCREEN'
      ? 'PAIRWISE_HILL_COLLISION_AMD_AND_CURRENT_RADIAL_GEOMETRY_PASS'
      : 'PAIRWISE_HILL_AND_CURRENT_RADIAL_GEOMETRY_PASS',
    residualRisk: 'RESONANCES_SECULAR_CHAOS_MULTI_BODY_AND_LONG_TERM_EVOLUTION_UNRESOLVED',
    nBodyTruthClaim: false
  });
}

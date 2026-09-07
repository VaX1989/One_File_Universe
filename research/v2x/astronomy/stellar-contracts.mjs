export const AUTHORITY = 'RESEARCH_ONLY';

const ALPHA_GRID = Object.freeze([-0.2, 0, 0.2, 0.4, 0.6]);

function finite(name, value) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}

export function mistInterpolationContract({ releaseId, ageLog10Years, initialMassSolar, feh, alphaFe, rotationFraction = 0, gridHash }) {
  const age = finite('ageLog10Years', ageLog10Years);
  const mass = finite('initialMassSolar', initialMassSolar);
  const metallicity = finite('feh', feh);
  const alpha = finite('alphaFe', alphaFe);
  const rotation = finite('rotationFraction', rotationFraction);
  if (!releaseId || !gridHash) return Object.freeze({ status: 'UNSUPPORTED', reason: 'VERSIONED_RELEASE_AND_GRID_HASH_REQUIRED' });
  if (age < 5 || age > 10.3 || mass <= 0 || metallicity < -3 || metallicity > 0.5 || rotation < 0 || rotation > 1) {
    return Object.freeze({ status: 'UNSUPPORTED', reason: 'OUTSIDE_RESEARCH_CONTRACT_DOMAIN' });
  }
  const alphaExact = ALPHA_GRID.some((x) => Math.abs(x - alpha) < 1e-12);
  return Object.freeze({
    status: alphaExact ? 'INTERPOLATION_CONTRACT_READY' : 'RESEARCH_REQUIRED',
    releaseId,
    gridHash,
    coordinates: Object.freeze({ ageLog10Years: age, initialMassSolar: mass, feh: metallicity, alphaFe: alpha, rotationFraction: rotation }),
    alphaGridSupported: ALPHA_GRID,
    interpolationAuthorized: alphaExact,
    requiredEvidence: Object.freeze(['EXACT_GRID_VERSION', 'GRID_HASH', 'INTERPOLATION_RULE', 'BOUNDARY_POLICY', 'NUMERICAL_ERROR_WITNESSES']),
    stellarTruthClaim: false
  });
}

export function multiplicityPopulationContract({ primaryMassSolar, periodLog10Days, massRatio, eccentricity, populationId, selectionFunctionId = null }) {
  const primary = finite('primaryMassSolar', primaryMassSolar);
  const logP = finite('periodLog10Days', periodLog10Days);
  const q = finite('massRatio', massRatio);
  const e = finite('eccentricity', eccentricity);
  if (primary <= 0 || q <= 0 || q > 1 || e < 0 || e >= 1) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_MULTIPLICITY_COORDINATE' });
  if (!populationId) return Object.freeze({ status: 'UNSUPPORTED', reason: 'POPULATION_ID_REQUIRED' });
  return Object.freeze({
    status: 'CONDITIONAL_PRIOR_COORDINATE',
    populationId,
    selectionFunctionId,
    coordinates: Object.freeze({ primaryMassSolar: primary, periodLog10Days: logP, massRatio: q, eccentricity: e }),
    couplingRequired: true,
    independentFactorizationAuthorized: false,
    surveyTruthClaim: false
  });
}

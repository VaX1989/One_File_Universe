export const AUTHORITY = 'RESEARCH_ONLY';

const ALPHA_GRID = Object.freeze([-0.2, 0, 0.2, 0.4, 0.6]);

function finite(name, value) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}

function strictlyIncreasing(values) {
  return Array.isArray(values) && values.length >= 2 && values.every((value, index) => Number.isFinite(value) && (index === 0 || value > values[index - 1]));
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

export function interpolateVersionedStellarSlice({ releaseId, gridHash, ageAxisLog10Years, massAxisSolar, values, ageLog10Years, initialMassSolar, quantityId, interpolationRule = 'BILINEAR' }) {
  if (!releaseId || !gridHash || !quantityId) return Object.freeze({ status: 'UNSUPPORTED', reason: 'VERSION_HASH_AND_QUANTITY_REQUIRED' });
  if (interpolationRule !== 'BILINEAR') return Object.freeze({ status: 'UNSUPPORTED', reason: 'ONLY_EXPLICIT_BILINEAR_RULE_IMPLEMENTED' });
  if (!strictlyIncreasing(ageAxisLog10Years) || !strictlyIncreasing(massAxisSolar)) return Object.freeze({ status: 'UNSUPPORTED', reason: 'STRICTLY_INCREASING_AXES_REQUIRED' });
  if (ageAxisLog10Years.length > 4096 || massAxisSolar.length > 4096) return Object.freeze({ status: 'UNSUPPORTED', reason: 'GRID_AXIS_RESOURCE_BOUND_EXCEEDED' });
  if (!Array.isArray(values) || values.length !== ageAxisLog10Years.length || values.some((row) => !Array.isArray(row) || row.length !== massAxisSolar.length || row.some((x) => !Number.isFinite(x)))) {
    return Object.freeze({ status: 'UNSUPPORTED', reason: 'RECTANGULAR_FINITE_VALUE_GRID_REQUIRED' });
  }
  const age = finite('ageLog10Years', ageLog10Years);
  const mass = finite('initialMassSolar', initialMassSolar);
  const ageBracket = bracket(ageAxisLog10Years, age);
  const massBracket = bracket(massAxisSolar, mass);
  if (!ageBracket || !massBracket) return Object.freeze({ status: 'UNSUPPORTED', reason: 'QUERY_OUTSIDE_VERSIONED_SLICE' });
  const v00 = values[ageBracket.lo][massBracket.lo];
  const v01 = values[ageBracket.lo][massBracket.hi];
  const v10 = values[ageBracket.hi][massBracket.lo];
  const v11 = values[ageBracket.hi][massBracket.hi];
  const lower = v00 + (v01 - v00) * massBracket.t;
  const upper = v10 + (v11 - v10) * massBracket.t;
  const value = lower + (upper - lower) * ageBracket.t;
  return Object.freeze({
    status: 'MODEL_DERIVED_INTERPOLATED_SLICE',
    releaseId,
    gridHash,
    quantityId,
    value,
    interpolationRule,
    cell: Object.freeze({ ageLo: ageBracket.lo, ageHi: ageBracket.hi, massLo: massBracket.lo, massHi: massBracket.hi }),
    interpolationFractions: Object.freeze({ age: ageBracket.t, mass: massBracket.t }),
    extrapolated: false,
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

export function evaluateVersionedMultiplicityCells({ populationId, tableHash, cells, primaryMassSolar, periodLog10Days, massRatio, eccentricity }) {
  if (!populationId || !tableHash) return Object.freeze({ status: 'UNSUPPORTED', reason: 'POPULATION_ID_AND_TABLE_HASH_REQUIRED' });
  const coordinate = multiplicityPopulationContract({ primaryMassSolar, periodLog10Days, massRatio, eccentricity, populationId });
  if (coordinate.status !== 'CONDITIONAL_PRIOR_COORDINATE') return coordinate;
  if (!Array.isArray(cells) || cells.length === 0 || cells.length > 100000) return Object.freeze({ status: 'UNSUPPORTED', reason: 'BOUNDED_CELL_TABLE_REQUIRED' });
  const matches = [];
  for (let index = 0; index < cells.length; index += 1) {
    const cell = cells[index] ?? {};
    const bounds = ['primaryMassMin', 'primaryMassMax', 'periodMin', 'periodMax', 'qMin', 'qMax', 'eMin', 'eMax'];
    if (bounds.some((key) => !Number.isFinite(cell[key])) || !Number.isFinite(cell.weight) || cell.weight < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: `INVALID_CELL_${index}` });
    if (!(cell.primaryMassMin < cell.primaryMassMax && cell.periodMin < cell.periodMax && cell.qMin < cell.qMax && cell.eMin < cell.eMax)) return Object.freeze({ status: 'UNSUPPORTED', reason: `INVALID_CELL_BOUNDS_${index}` });
    if (primaryMassSolar >= cell.primaryMassMin && primaryMassSolar < cell.primaryMassMax && periodLog10Days >= cell.periodMin && periodLog10Days < cell.periodMax && massRatio >= cell.qMin && massRatio < cell.qMax && eccentricity >= cell.eMin && eccentricity < cell.eMax) {
      matches.push({ index, weight: cell.weight });
    }
  }
  if (matches.length === 0) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'NO_CONDITIONAL_CELL_COVERS_COORDINATE' });
  if (matches.length > 1) return Object.freeze({ status: 'UNSUPPORTED', reason: 'OVERLAPPING_CONDITIONAL_CELLS' });
  return Object.freeze({
    status: 'VERSIONED_CONDITIONAL_CELL',
    populationId,
    tableHash,
    cellIndex: matches[0].index,
    weight: matches[0].weight,
    couplingRequired: true,
    selectionCorrected: false,
    surveyTruthClaim: false
  });
}

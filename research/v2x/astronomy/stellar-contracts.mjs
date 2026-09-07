export const AUTHORITY = 'RESEARCH_ONLY';

const ALPHA_GRID = Object.freeze([-0.2, 0, 0.2, 0.4, 0.6]);
const ROTATION_GRID = Object.freeze([0, 0.4]);
const MAX_STELLAR_GRID_CELLS = 262144;
const MAX_MULTIPLICITY_CELLS = 100000;
const WEIGHT_SEMANTICS = Object.freeze(['RELATIVE_WEIGHT', 'PROBABILITY_MASS', 'DENSITY_PROXY']);

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

function exactGridValue(value, grid) {
  return grid.some((candidate) => Math.abs(candidate - value) < 1e-12);
}

function validateGridDomain(gridDomain) {
  if (!gridDomain || typeof gridDomain !== 'object') return null;
  const keys = ['ageMinLog10Years', 'ageMaxLog10Years', 'massMinSolar', 'massMaxSolar', 'fehMin', 'fehMax'];
  if (keys.some((key) => !Number.isFinite(gridDomain[key]))) return null;
  if (!(gridDomain.ageMinLog10Years < gridDomain.ageMaxLog10Years && gridDomain.massMinSolar > 0 && gridDomain.massMinSolar < gridDomain.massMaxSolar && gridDomain.fehMin < gridDomain.fehMax)) return null;
  return Object.freeze({
    ageMinLog10Years: gridDomain.ageMinLog10Years,
    ageMaxLog10Years: gridDomain.ageMaxLog10Years,
    massMinSolar: gridDomain.massMinSolar,
    massMaxSolar: gridDomain.massMaxSolar,
    fehMin: gridDomain.fehMin,
    fehMax: gridDomain.fehMax
  });
}

export function mistInterpolationContract({ releaseId, ageLog10Years, initialMassSolar, feh, alphaFe, rotationFraction = 0, gridHash, gridDomain }) {
  const age = finite('ageLog10Years', ageLog10Years);
  const mass = finite('initialMassSolar', initialMassSolar);
  const metallicity = finite('feh', feh);
  const alpha = finite('alphaFe', alphaFe);
  const rotation = finite('rotationFraction', rotationFraction);
  if (!releaseId || !gridHash) return Object.freeze({ status: 'UNSUPPORTED', reason: 'VERSIONED_RELEASE_AND_GRID_HASH_REQUIRED' });
  const domain = validateGridDomain(gridDomain);
  if (!domain) return Object.freeze({ status: 'UNSUPPORTED', reason: 'EXACT_GRID_DOMAIN_METADATA_REQUIRED' });
  if (mass <= 0 || metallicity < -3 || metallicity > 0.5) return Object.freeze({ status: 'UNSUPPORTED', reason: 'OUTSIDE_MIST_II_PUBLISHED_CHEMISTRY_OR_POSITIVE_MASS_DOMAIN' });
  if (!exactGridValue(alpha, ALPHA_GRID)) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'ALPHA_FE_NOT_ON_PUBLISHED_MIST_II_GRID', alphaGridSupported: ALPHA_GRID });
  if (!exactGridValue(rotation, ROTATION_GRID)) return Object.freeze({ status: 'RESEARCH_REQUIRED', reason: 'ROTATION_NOT_ON_CURRENT_MIST_GRID', rotationGridSupported: ROTATION_GRID });
  if (Math.abs(metallicity - 0.5) < 1e-12 && Math.abs(alpha - 0.6) < 1e-12) return Object.freeze({ status: 'UNSUPPORTED', reason: 'MIST_II_FEH_PLUS_0_5_ALPHA_PLUS_0_6_COMBINATION_NOT_PUBLISHED' });
  if (age < domain.ageMinLog10Years || age > domain.ageMaxLog10Years || mass < domain.massMinSolar || mass > domain.massMaxSolar || metallicity < domain.fehMin || metallicity > domain.fehMax) {
    return Object.freeze({ status: 'UNSUPPORTED', reason: 'QUERY_OUTSIDE_DECLARED_EXACT_GRID_DOMAIN', gridDomain: domain });
  }
  return Object.freeze({
    status: 'INTERPOLATION_CONTRACT_READY',
    releaseId,
    gridHash,
    gridDomain: domain,
    coordinates: Object.freeze({ ageLog10Years: age, initialMassSolar: mass, feh: metallicity, alphaFe: alpha, rotationFraction: rotation }),
    alphaGridSupported: ALPHA_GRID,
    rotationGridSupported: ROTATION_GRID,
    interpolationAuthorized: true,
    requiredEvidence: Object.freeze(['EXACT_GRID_VERSION', 'GRID_HASH', 'EXACT_GRID_DOMAIN', 'INTERPOLATION_RULE', 'BOUNDARY_POLICY', 'QUANTITY_UNITS', 'NUMERICAL_ERROR_WITNESSES']),
    stellarTruthClaim: false
  });
}

export function interpolateVersionedStellarSlice({ releaseId, gridHash, ageAxisLog10Years, massAxisSolar, values, ageLog10Years, initialMassSolar, quantityId, quantityUnits, interpolationRule = 'BILINEAR' }) {
  if (!releaseId || !gridHash || !quantityId || !quantityUnits) return Object.freeze({ status: 'UNSUPPORTED', reason: 'VERSION_HASH_QUANTITY_AND_UNITS_REQUIRED' });
  if (interpolationRule !== 'BILINEAR') return Object.freeze({ status: 'UNSUPPORTED', reason: 'ONLY_EXPLICIT_BILINEAR_RULE_IMPLEMENTED' });
  if (!strictlyIncreasing(ageAxisLog10Years) || !strictlyIncreasing(massAxisSolar)) return Object.freeze({ status: 'UNSUPPORTED', reason: 'STRICTLY_INCREASING_AXES_REQUIRED' });
  const cellCount = ageAxisLog10Years.length * massAxisSolar.length;
  if (ageAxisLog10Years.length > 4096 || massAxisSolar.length > 4096 || cellCount > MAX_STELLAR_GRID_CELLS) return Object.freeze({ status: 'UNSUPPORTED', reason: 'GRID_RESOURCE_BOUND_EXCEEDED', maxCells: MAX_STELLAR_GRID_CELLS });
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
    quantityUnits,
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

function insideBound(value, min, max, closedPhysicalUpper = null) {
  if (value < min) return false;
  if (closedPhysicalUpper != null && Math.abs(max - closedPhysicalUpper) < 1e-12) return value <= max;
  return value < max;
}

export function evaluateVersionedMultiplicityCells({ populationId, tableHash, cells, primaryMassSolar, periodLog10Days, massRatio, eccentricity, weightSemantics }) {
  if (!populationId || !tableHash) return Object.freeze({ status: 'UNSUPPORTED', reason: 'POPULATION_ID_AND_TABLE_HASH_REQUIRED' });
  if (!WEIGHT_SEMANTICS.includes(weightSemantics)) return Object.freeze({ status: 'UNSUPPORTED', reason: 'EXPLICIT_WEIGHT_SEMANTICS_REQUIRED', allowedWeightSemantics: WEIGHT_SEMANTICS });
  const coordinate = multiplicityPopulationContract({ primaryMassSolar, periodLog10Days, massRatio, eccentricity, populationId });
  if (coordinate.status !== 'CONDITIONAL_PRIOR_COORDINATE') return coordinate;
  if (!Array.isArray(cells) || cells.length === 0 || cells.length > MAX_MULTIPLICITY_CELLS) return Object.freeze({ status: 'UNSUPPORTED', reason: 'BOUNDED_CELL_TABLE_REQUIRED' });
  const matches = [];
  for (let index = 0; index < cells.length; index += 1) {
    const cell = cells[index] ?? {};
    const bounds = ['primaryMassMin', 'primaryMassMax', 'periodMin', 'periodMax', 'qMin', 'qMax', 'eMin', 'eMax'];
    if (bounds.some((key) => !Number.isFinite(cell[key])) || !Number.isFinite(cell.weight) || cell.weight < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: `INVALID_CELL_${index}` });
    if (!(cell.primaryMassMin > 0 && cell.primaryMassMin < cell.primaryMassMax && cell.periodMin < cell.periodMax && cell.qMin > 0 && cell.qMin < cell.qMax && cell.qMax <= 1 && cell.eMin >= 0 && cell.eMin < cell.eMax && cell.eMax <= 1)) {
      return Object.freeze({ status: 'UNSUPPORTED', reason: `INVALID_OR_NONPHYSICAL_CELL_BOUNDS_${index}` });
    }
    if (insideBound(primaryMassSolar, cell.primaryMassMin, cell.primaryMassMax) && insideBound(periodLog10Days, cell.periodMin, cell.periodMax) && insideBound(massRatio, cell.qMin, cell.qMax, 1) && insideBound(eccentricity, cell.eMin, cell.eMax, 1)) {
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
    weightSemantics,
    couplingRequired: true,
    selectionCorrected: false,
    surveyTruthClaim: false
  });
}

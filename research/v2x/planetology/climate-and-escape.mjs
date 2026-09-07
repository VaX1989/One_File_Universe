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
  return Object.freeze({ status: Number.isFinite(temperatureK) && temperatureK > 0 ? 'PRESENT' : 'UNSUPPORTED', temperatureK, absorbedShortwaveWm2: absorbed, outgoingLongwaveAtSolutionWm2: A + B * (temperatureK - tref), assumptions: 'ZERO_DIMENSIONAL_LINEAR_OLR_ENERGY_BALANCE', weatherTruthClaim: false, gcmTruthClaim: false });
}

export function transientZeroDimensionalEbmStep({ temperatureK, heatCapacityJm2K, stellarFluxWm2, bondAlbedo, durationSeconds, outgoingLongwaveA = 210, outgoingLongwaveB = 2, referenceTemperatureK = 273.15, maxTemperatureStepK = 1 }) {
  let temperature = finite('temperatureK', temperatureK);
  const heatCapacity = finite('heatCapacityJm2K', heatCapacityJm2K);
  const stellarFlux = finite('stellarFluxWm2', stellarFluxWm2);
  const albedo = finite('bondAlbedo', bondAlbedo);
  const duration = finite('durationSeconds', durationSeconds);
  const A = finite('outgoingLongwaveA', outgoingLongwaveA);
  const B = finite('outgoingLongwaveB', outgoingLongwaveB);
  const tref = finite('referenceTemperatureK', referenceTemperatureK);
  const maxStep = finite('maxTemperatureStepK', maxTemperatureStepK);
  if (temperature <= 0 || heatCapacity <= 0 || stellarFlux <= 0 || albedo < 0 || albedo >= 1 || duration < 0 || B <= 0 || tref <= 0 || maxStep <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_TRANSIENT_EBM_INPUT' });
  const absorbed = stellarFlux * (1 - albedo) / 4;
  const initialNet = absorbed - (A + B * (temperature - tref));
  const estimatedDelta = duration === 0 ? 0 : initialNet * duration / heatCapacity;
  const substeps = Math.max(1, Math.ceil(Math.abs(estimatedDelta) / maxStep));
  if (substeps > 10000) return Object.freeze({ status: 'UNSUPPORTED', reason: 'SUBSTEP_RESOURCE_BOUND_EXCEEDED' });
  const dt = duration / substeps;
  const initialTemperatureK = temperature;
  let absorbedEnergyJm2 = 0;
  let outgoingEnergyJm2 = 0;
  for (let i = 0; i < substeps; i += 1) {
    const outgoing = A + B * (temperature - tref);
    const net = absorbed - outgoing;
    const delta = net * dt / heatCapacity;
    if (!Number.isFinite(delta) || Math.abs(delta) > maxStep * 1.0000001) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NUMERICAL_STEP_BOUND_VIOLATED' });
    temperature += delta;
    if (temperature <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_PHYSICAL_TEMPERATURE_REACHED' });
    absorbedEnergyJm2 += absorbed * dt;
    outgoingEnergyJm2 += outgoing * dt;
  }
  const storageChangeJm2 = heatCapacity * (temperature - initialTemperatureK);
  const expectedStorageChangeJm2 = absorbedEnergyJm2 - outgoingEnergyJm2;
  return Object.freeze({ status: 'PRESENT', initialTemperatureK, temperatureK: temperature, substeps, absorbedEnergyJm2, outgoingEnergyJm2, storageChangeJm2, energyResidualJm2: storageChangeJm2 - expectedStorageChangeJm2, assumptions: 'TRANSIENT_ZERO_DIMENSIONAL_LINEAR_OLR_EBM_EXPLICIT_BOUNDED_STEP', weatherTruthClaim: false, gcmTruthClaim: false });
}

export function zonalEbmStep({ temperaturesK, heatCapacitiesJm2K, insolationFactors, bondAlbedos, stellarFluxWm2, durationSeconds, meridionalTransportWm2K = 0.6, outgoingLongwaveA = 210, outgoingLongwaveB = 2, referenceTemperatureK = 273.15, maxTemperatureStepK = 0.5 }) {
  const n = Array.isArray(temperaturesK) ? temperaturesK.length : 0;
  if (n < 2 || n > 256 || !Array.isArray(heatCapacitiesJm2K) || !Array.isArray(insolationFactors) || !Array.isArray(bondAlbedos) || heatCapacitiesJm2K.length !== n || insolationFactors.length !== n || bondAlbedos.length !== n) {
    return Object.freeze({ status: 'UNSUPPORTED', reason: 'EQUAL_LENGTH_2_TO_256_ZONAL_ARRAYS_REQUIRED' });
  }
  const temperatures = temperaturesK.map((x, i) => finite(`temperaturesK[${i}]`, x));
  const capacities = heatCapacitiesJm2K.map((x, i) => finite(`heatCapacitiesJm2K[${i}]`, x));
  const insolation = insolationFactors.map((x, i) => finite(`insolationFactors[${i}]`, x));
  const albedos = bondAlbedos.map((x, i) => finite(`bondAlbedos[${i}]`, x));
  const stellarFlux = finite('stellarFluxWm2', stellarFluxWm2);
  const duration = finite('durationSeconds', durationSeconds);
  const D = finite('meridionalTransportWm2K', meridionalTransportWm2K);
  const A = finite('outgoingLongwaveA', outgoingLongwaveA);
  const B = finite('outgoingLongwaveB', outgoingLongwaveB);
  const tref = finite('referenceTemperatureK', referenceTemperatureK);
  const maxStep = finite('maxTemperatureStepK', maxTemperatureStepK);
  if (temperatures.some((x) => x <= 0) || capacities.some((x) => x <= 0) || insolation.some((x) => x < 0) || albedos.some((x) => x < 0 || x >= 1) || stellarFlux <= 0 || duration < 0 || D < 0 || B <= 0 || tref <= 0 || maxStep <= 0) {
    return Object.freeze({ status: 'UNSUPPORTED', reason: 'INVALID_ZONAL_EBM_INPUT' });
  }
  const meanInsolationFactor = insolation.reduce((sum, x) => sum + x, 0) / n;
  if (!(meanInsolationFactor > 0)) return Object.freeze({ status: 'UNSUPPORTED', reason: 'POSITIVE_MEAN_INSOLATION_REQUIRED' });
  const normalizedInsolation = insolation.map((x) => x / meanInsolationFactor);
  const initialTemperatures = [...temperatures];
  const computeTendency = () => {
    const absorbed = normalizedInsolation.map((factor, i) => stellarFlux * factor * (1 - albedos[i]) / 4);
    const outgoing = temperatures.map((temperature) => A + B * (temperature - tref));
    const transport = Array(n).fill(0);
    for (let i = 0; i < n - 1; i += 1) {
      const flux = D * (temperatures[i + 1] - temperatures[i]);
      transport[i] += flux;
      transport[i + 1] -= flux;
    }
    return { absorbed, outgoing, transport, net: absorbed.map((value, i) => value - outgoing[i] + transport[i]) };
  };
  const first = computeTendency();
  let estimatedMaxDelta = 0;
  for (let i = 0; i < n; i += 1) estimatedMaxDelta = Math.max(estimatedMaxDelta, Math.abs(first.net[i] * duration / capacities[i]));
  const substeps = Math.max(1, Math.ceil(estimatedMaxDelta / maxStep));
  if (substeps > 10000) return Object.freeze({ status: 'UNSUPPORTED', reason: 'ZONAL_SUBSTEP_RESOURCE_BOUND_EXCEEDED' });
  const dt = duration / substeps;
  let absorbedEnergyMeanJm2 = 0;
  let outgoingEnergyMeanJm2 = 0;
  let transportResidualEnergyMeanJm2 = 0;
  for (let step = 0; step < substeps; step += 1) {
    const tendency = computeTendency();
    let transportSum = 0;
    for (let i = 0; i < n; i += 1) {
      const delta = tendency.net[i] * dt / capacities[i];
      if (!Number.isFinite(delta) || Math.abs(delta) > maxStep * 1.0000001) return Object.freeze({ status: 'UNSUPPORTED', reason: 'ZONAL_NUMERICAL_STEP_BOUND_VIOLATED' });
      temperatures[i] += delta;
      if (temperatures[i] <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_PHYSICAL_ZONAL_TEMPERATURE_REACHED' });
      transportSum += tendency.transport[i];
    }
    absorbedEnergyMeanJm2 += tendency.absorbed.reduce((sum, x) => sum + x, 0) * dt / n;
    outgoingEnergyMeanJm2 += tendency.outgoing.reduce((sum, x) => sum + x, 0) * dt / n;
    transportResidualEnergyMeanJm2 += transportSum * dt / n;
  }
  const storageChangeMeanJm2 = temperatures.reduce((sum, temperature, i) => sum + capacities[i] * (temperature - initialTemperatures[i]), 0) / n;
  const expectedStorageChangeMeanJm2 = absorbedEnergyMeanJm2 - outgoingEnergyMeanJm2 + transportResidualEnergyMeanJm2;
  return Object.freeze({
    status: 'PRESENT',
    temperaturesK: Object.freeze([...temperatures]),
    initialTemperaturesK: Object.freeze(initialTemperatures),
    substeps,
    meanInsolationFactorBeforeNormalization: meanInsolationFactor,
    absorbedEnergyMeanJm2,
    outgoingEnergyMeanJm2,
    storageChangeMeanJm2,
    transportResidualEnergyMeanJm2,
    energyResidualMeanJm2: storageChangeMeanJm2 - expectedStorageChangeMeanJm2,
    assumptions: 'EQUAL_AREA_1D_ZONAL_LINEAR_OLR_NEAREST_NEIGHBOR_DIFFUSIVE_TRANSPORT',
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
  return Object.freeze({ status: 'MODEL_DERIVED_RATE_CANDIDATE', rateKgPerS, rateAuthorized: true, assumptions: 'ENERGY_LIMITED_ESCAPE_WITH_EXPLICIT_EFFICIENCY_RXUV_AND_ROCHE_CORRECTION', universalEscapeTruthClaim: false });
}

export function atmosphereMassBudgetStep({ atmosphereMassKg, escapeRateKgPerS, sourceRateKgPerS = 0, durationSeconds }) {
  const mass = finite('atmosphereMassKg', atmosphereMassKg);
  const escapeRate = finite('escapeRateKgPerS', escapeRateKgPerS);
  const sourceRate = finite('sourceRateKgPerS', sourceRateKgPerS);
  const dt = finite('durationSeconds', durationSeconds);
  if (mass < 0 || escapeRate < 0 || sourceRate < 0 || dt < 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NEGATIVE_MASS_RATE_OR_TIME' });
  const requestedLossKg = escapeRate * dt;
  const sourceKg = sourceRate * dt;
  const availableKg = mass + sourceKg;
  const realizedLossKg = Math.min(requestedLossKg, availableKg);
  const afterKg = availableKg - realizedLossKg;
  return Object.freeze({ status: requestedLossKg <= availableKg ? 'CONSERVED' : 'DEPLETION_CAPPED', beforeKg: mass, sourceKg, requestedLossKg, realizedLossKg, afterKg, residualKg: afterKg - (mass + sourceKg - realizedLossKg), universalEscapeHistoryClaim: false });
}

export function blackbodyEmission({ temperatureK }) {
  const t = finite('temperatureK', temperatureK);
  if (t <= 0) return Object.freeze({ status: 'UNSUPPORTED', reason: 'NON_POSITIVE_TEMPERATURE' });
  return Object.freeze({ status: 'PRESENT', fluxWm2: SIGMA * Math.pow(t, 4) });
}

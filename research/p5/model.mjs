const C = Object.freeze({
  G: 6.67430e-11,
  K_B: 1.380649e-23,
  AMU: 1.66053906660e-27,
  M_EARTH: 5.9722e24,
  R_EARTH: 6.371e6,
});

export const evidence = Object.freeze({
  rockyMassRadius: { evidenceClass: 'EMPIRICALLY_CONSTRAINED', fidelity: 'APPROXIMATE' },
  volatilePartition: { evidenceClass: 'HYPOTHETICAL', fidelity: 'STYLIZED' },
  atmosphericRetention: { evidenceClass: 'ESTABLISHED', fidelity: 'APPROXIMATE' },
  greenhouse: { evidenceClass: 'EMPIRICALLY_CONSTRAINED', fidelity: 'STYLIZED' },
  geodynamics: { evidenceClass: 'HYPOTHETICAL', fidelity: 'STYLIZED' },
  terrain: { evidenceClass: 'FICTIONAL', fidelity: 'STYLIZED' },
});

function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
function mix(a, b, t) { return a + (b - a) * t; }

export function validateInput(input) {
  const required = ['planetKey','systemAgeGyr','stellarMassSolar','stellarLuminositySolar','semiMajorAxisAu','eccentricity','planetMassEarth','metallicityDex','formationRegion'];
  for (const k of required) if (!(k in input)) throw new Error(`missing ${k}`);
  if (!(input.planetMassEarth > 0)) throw new Error('planetMassEarth must be positive');
  if (!(input.stellarLuminositySolar > 0)) throw new Error('stellarLuminositySolar must be positive');
  if (!(input.semiMajorAxisAu > 0)) throw new Error('semiMajorAxisAu must be positive');
  if (!(input.eccentricity >= 0 && input.eccentricity < 1)) throw new Error('eccentricity out of range');
  return input;
}

function compositionClass(input, d) {
  const snowBias = clamp((input.formationRegion.snowLineRatio - 0.75) / 1.5, 0, 1);
  const gasBias = clamp((input.planetMassEarth - 5) / 15, 0, 1);
  const metalBias = clamp((input.metallicityDex + 0.5) / 1.0, 0, 1);
  if (input.planetMassEarth > 25 && d('bulk.class') < 0.75 + 0.15 * metalBias) return 'GAS_GIANT';
  if (input.planetMassEarth > 8 && d('bulk.class') < 0.35 + 0.35 * gasBias) return 'ICE_GIANT';
  if (snowBias > 0.45 && d('bulk.class') < 0.35 + 0.45 * snowBias) return 'WATER_RICH';
  if (d('bulk.class.iron') < 0.10 + 0.08 * metalBias) return 'IRON_RICH_ROCKY';
  return 'ROCKY';
}

function compositionFractions(cls, d) {
  if (cls === 'GAS_GIANT') return { iron: 0.04, silicate: 0.11, waterIce: 0.10, hHe: 0.75 };
  if (cls === 'ICE_GIANT') return { iron: 0.08, silicate: 0.22, waterIce: 0.50, hHe: 0.20 };
  if (cls === 'WATER_RICH') {
    const water = 0.25 + 0.35 * d('bulk.waterFraction');
    const iron = 0.18 + 0.10 * d('bulk.ironFraction');
    return { iron, silicate: 1 - water - iron, waterIce: water, hHe: 0 };
  }
  const iron = cls === 'IRON_RICH_ROCKY'
    ? 0.45 + 0.18 * d('bulk.ironFraction')
    : 0.22 + 0.16 * d('bulk.ironFraction');
  return { iron, silicate: 1 - iron, waterIce: 0, hHe: 0 };
}

function radiusEarth(massEarth, cls, fractions) {
  if (cls === 'GAS_GIANT') return clamp(9.2 + 1.6 * Math.log10(massEarth / 30 + 1), 8.5, 13.0);
  if (cls === 'ICE_GIANT') return clamp(3.2 * Math.pow(massEarth / 10, 0.22), 2.4, 6.0);
  const rocky = Math.pow(massEarth, 0.27);
  const ironFactor = 1 - 0.22 * Math.max(0, fractions.iron - 0.32);
  const waterFactor = 1 + 0.34 * fractions.waterIce;
  return rocky * ironFactor * waterFactor;
}

function irradiation(input) {
  return input.stellarLuminositySolar /
    (input.semiMajorAxisAu * input.semiMajorAxisAu) /
    Math.sqrt(1 - input.eccentricity * input.eccentricity);
}

function bondAlbedo(cls, waterMassFraction, d) {
  const base = cls === 'GAS_GIANT' ? 0.34 : cls === 'ICE_GIANT' ? 0.40 : cls === 'WATER_RICH' ? 0.28 : 0.20;
  const water = 0.10 * clamp(waterMassFraction * 100, 0, 1);
  return clamp(base + water + (d('climate.albedo') - 0.5) * 0.10, 0.03, 0.80);
}

function equilibriumTemperatureK(fluxEarth, albedo) {
  return 278.5 * Math.pow(Math.max(1e-8, fluxEarth * (1 - albedo)), 0.25);
}

function escapeVelocityMs(massEarth, radiusEarthValue) {
  return Math.sqrt(2 * C.G * massEarth * C.M_EARTH / (radiusEarthValue * C.R_EARTH));
}

function jeansParameter(escapeMs, molecularWeightAmu, exobaseK) {
  return (escapeMs * escapeMs * molecularWeightAmu * C.AMU) / (2 * C.K_B * exobaseK);
}

function volatileInventoryEarthMass(input, cls, fractions, d) {
  const formation = clamp(input.formationRegion.snowLineRatio / 2, 0.05, 2.5);
  let base;
  if (cls === 'GAS_GIANT') base = 0.75 * input.planetMassEarth;
  else if (cls === 'ICE_GIANT') base = 0.25 * input.planetMassEarth;
  else base = input.planetMassEarth * (5e-6 + 2.5e-4 * formation + 2e-2 * fractions.waterIce);
  return base * mix(0.65, 1.35, d('volatile.inventory'));
}

function atmosphereModel({ input, cls, massEarth, radiusEarthValue, teqK, volatileInventory, d }) {
  const vesc = escapeVelocityMs(massEarth, radiusEarthValue);
  const activity = clamp(1.6 / Math.sqrt(Math.max(0.2, input.systemAgeGyr)), 0.45, 3.0);
  const exobaseK = clamp(teqK * (2.2 + 0.8 * activity), 250, 12000);
  const lambdaH2 = jeansParameter(vesc, 2, exobaseK);
  const lambdaN2 = jeansParameter(vesc, 28, exobaseK);
  const hHeRetention = clamp((lambdaH2 - 4) / 18, 0, 1);
  const heavyRetention = clamp((lambdaN2 - 8) / 25, 0, 1);
  const erosion = clamp((teqK - 450) / 900 + 0.20 * (activity - 1), 0, 0.95);
  let fraction = cls === 'GAS_GIANT' ? 0.70 : cls === 'ICE_GIANT' ? 0.18 : 0.025 * heavyRetention;
  fraction *= (1 - erosion);
  if (cls === 'GAS_GIANT' || cls === 'ICE_GIANT') fraction *= 0.5 + 0.5 * hHeRetention;
  fraction *= mix(0.65, 1.35, d('atmosphere.partition'));
  const atmosphericMassEarth = clamp(volatileInventory * fraction, 0, volatileInventory);
  const g = C.G * massEarth * C.M_EARTH / Math.pow(radiusEarthValue * C.R_EARTH, 2);
  const area = 4 * Math.PI * Math.pow(radiusEarthValue * C.R_EARTH, 2);
  const pressureBar = atmosphericMassEarth * C.M_EARTH * g / area / 1e5;
  const co2Fraction = cls === 'GAS_GIANT' || cls === 'ICE_GIANT'
    ? 1e-4
    : Math.pow(10, -4 + 3 * d('atmosphere.co2'));
  return { escapeVelocityMs: vesc, exobaseK, lambdaH2, lambdaN2, atmosphericMassEarth, pressureBar, co2Fraction, hHeRetention, heavyRetention };
}

function greenhouseDeltaK(teqK, pressureBar, co2Fraction, cls) {
  if (cls === 'GAS_GIANT' || cls === 'ICE_GIANT') return 0;
  const pressureTerm = 17 * Math.log1p(Math.min(1000, pressureBar));
  const co2Term = 5.5 * Math.log1p(Math.max(0, co2Fraction) / 2.8e-4);
  const hotMoistBoost = teqK > 300 ? Math.min(80, (teqK - 300) * 0.45) : 0;
  return clamp(pressureTerm + co2Term + hotMoistBoost, 0, 180);
}

function waterState({ cls, fractions, volatileInventory, pressureBar, surfaceK }) {
  if (cls === 'GAS_GIANT' || cls === 'ICE_GIANT') return { reservoir: 'DEEP_ENVELOPE', liquidSurfaceFraction: 0, iceSurfaceFraction: 0 };
  const bulkWater = Math.max(fractions.waterIce * 0.25, Math.min(0.03, volatileInventory * 0.4));
  const pressureAllowsLiquid = pressureBar > 0.006;
  let liquid = 0, ice = 0;
  if (surfaceK < 245) ice = clamp(bulkWater * 14, 0, 0.95);
  else if (surfaceK <= 373 && pressureAllowsLiquid) liquid = clamp(bulkWater * 18, 0, 0.92);
  else if (surfaceK < 273) ice = clamp(bulkWater * 10, 0, 0.9);
  return { reservoir: bulkWater > 1e-5 ? 'PRESENT' : 'TRACE', liquidSurfaceFraction: liquid, iceSurfaceFraction: ice };
}

function geodynamicsModel({ input, massEarth, radiusEarthValue, fractions, d }) {
  const age = Math.max(0.05, input.systemAgeGyr);
  const radiogenic = Math.exp(-age / 6.5) * (0.75 + 0.5 * clamp((input.metallicityDex + 0.4) / 0.8, 0, 1));
  const secular = Math.pow(massEarth, 0.35) / Math.pow(radiusEarthValue, 0.8) * Math.exp(-age / 10);
  const heatIndex = clamp(0.55 * radiogenic + 0.45 * secular, 0, 2.5);
  const waterWeakening = clamp(fractions.waterIce * 4, 0, 0.7);
  const mobilityScore = clamp(0.35 * heatIndex + 0.45 * waterWeakening + 0.20 * d('geo.mobility'), 0, 1);
  const regime = mobilityScore > 0.67 ? 'MOBILE_LID_PROXY' : mobilityScore > 0.34 ? 'EPISODIC_LID_PROXY' : 'STAGNANT_LID_PROXY';
  const volcanismIndex = clamp(0.55 * heatIndex + 0.45 * d('geo.volcanism'), 0, 1.5);
  const reliefPotential = clamp(0.25 + 0.55 * volcanismIndex + 0.25 * (1 - waterWeakening), 0.1, 1.5);
  return { heatIndex, mobilityScore, regime, volcanismIndex, reliefPotential };
}

function terrainConstraints({ cls, geo, water, d }) {
  if (cls === 'GAS_GIANT' || cls === 'ICE_GIANT') return { surfaceMode: 'NO_SOLID_TERRAIN', oceanFraction: 0, reliefScaleM: 0, basinBias: 0 };
  const oceanFraction = clamp(water.liquidSurfaceFraction, 0, 0.95);
  const reliefScaleM = Math.round((1800 + 7200 * geo.reliefPotential) * (1 - 0.55 * oceanFraction));
  const basinBias = clamp(oceanFraction * 0.8 + 0.2 * d('terrain.basinBias'), 0, 1);
  return { surfaceMode: 'HIERARCHICAL_CONSTRAINED_PATCHES', oceanFraction, reliefScaleM, basinBias };
}

export function generatePlanet(input, deriveUnit) {
  validateInput(input);
  if (typeof deriveUnit !== 'function') throw new Error('deriveUnit required');
  const d = (tag) => deriveUnit(input.planetKey, tag);
  const cls = compositionClass(input, d);
  const fractions = compositionFractions(cls, d);
  const radius = radiusEarth(input.planetMassEarth, cls, fractions);
  const densityEarth = input.planetMassEarth / Math.pow(radius, 3);
  const gravityEarth = input.planetMassEarth / Math.pow(radius, 2);
  const fluxEarth = irradiation(input);
  const volatileInventory = volatileInventoryEarthMass(input, cls, fractions, d);
  const albedo = bondAlbedo(cls, fractions.waterIce, d);
  const teq = equilibriumTemperatureK(fluxEarth, albedo);
  const atmosphere = atmosphereModel({ input, cls, massEarth: input.planetMassEarth, radiusEarthValue: radius, teqK: teq, volatileInventory, d });
  const greenhouse = greenhouseDeltaK(teq, atmosphere.pressureBar, atmosphere.co2Fraction, cls);
  const surfaceK = teq + greenhouse;
  const water = waterState({ cls, fractions, volatileInventory, pressureBar: atmosphere.pressureBar, surfaceK });
  const geo = geodynamicsModel({ input, massEarth: input.planetMassEarth, radiusEarthValue: radius, fractions, d });
  const terrain = terrainConstraints({ cls, geo, water, d });
  return Object.freeze({
    modelVersion: 'p5-research-planet-v0.1',
    planetKey: input.planetKey,
    bulk: { class: cls, massEarth: input.planetMassEarth, radiusEarth: radius, densityEarth, gravityEarth, compositionFractions: fractions },
    energy: { fluxEarth, bondAlbedo: albedo, equilibriumTemperatureK: teq },
    volatiles: { inventoryEarthMass: volatileInventory },
    atmosphere,
    climate: { meanSurfaceTemperatureK: surfaceK, greenhouseDeltaK: greenhouse, tier: 'TIER_1_GLOBAL_EBM_PROXY' },
    hydrosphere: water,
    geodynamics: geo,
    terrainConstraints: terrain,
  });
}

export function sampleTerrainPatch(planet, surfaceAddress, resolution, deriveUnit) {
  if (planet.terrainConstraints.surfaceMode !== 'HIERARCHICAL_CONSTRAINED_PATCHES') return Object.freeze({ meanHeightM: 0, amplitudeM: 0, samples: [0] });
  if (!Number.isInteger(resolution) || resolution < 0 || resolution > 12) throw new Error('resolution out of range');
  const base = `${planet.planetKey}|${surfaceAddress}`;
  const coarse = (deriveUnit(base, 'terrain.coarse') * 2 - 1) * planet.terrainConstraints.reliefScaleM * 0.45;
  let correction = 0;
  for (let level = 1; level <= resolution; level++) {
    const amp = planet.terrainConstraints.reliefScaleM * Math.pow(0.48, level + 1);
    correction += (deriveUnit(base, `terrain.level.${level}`) * 2 - 1) * amp;
  }
  const raw = coarse + correction - planet.terrainConstraints.basinBias * planet.terrainConstraints.reliefScaleM * 0.25;
  const seaAdjusted = planet.terrainConstraints.oceanFraction > 0.5 ? raw - planet.terrainConstraints.reliefScaleM * 0.10 : raw;
  return Object.freeze({ meanHeightM: Math.round(seaAdjusted), amplitudeM: planet.terrainConstraints.reliefScaleM, resolution });
}

export function environmentalContract(planet) {
  return Object.freeze({
    version: 'p6-environment-research-v0.1',
    energyAvailability: clamp(planet.energy.fluxEarth, 0, 20),
    meanTemperatureK: planet.climate.meanSurfaceTemperatureK,
    pressureBar: planet.atmosphere.pressureBar,
    liquidSolventFraction: planet.hydrosphere.liquidSurfaceFraction,
    iceFraction: planet.hydrosphere.iceSurfaceFraction,
    oceanLandFraction: { ocean: planet.terrainConstraints.oceanFraction, land: 1 - planet.terrainConstraints.oceanFraction },
    geologicActivity: clamp(planet.geodynamics.volcanismIndex, 0, 1),
    habitatReliefM: planet.terrainConstraints.reliefScaleM,
  });
}

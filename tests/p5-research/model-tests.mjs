import assert from 'node:assert/strict';
import { generatePlanet, sampleTerrainPatch, environmentalContract } from '../../research/p5/model.mjs';
import { fixtureUnit } from '../../research/p5/fixture-derivation.mjs';

const base = Object.freeze({
  planetKey: 'fixture:earthlike:001', systemAgeGyr: 4.6, stellarMassSolar: 1, stellarLuminositySolar: 1,
  semiMajorAxisAu: 1, eccentricity: 0.0167, planetMassEarth: 1, metallicityDex: 0,
  formationRegion: { snowLineRatio: 0.55 },
});

const a = generatePlanet(base, fixtureUnit);
const b = generatePlanet(base, fixtureUnit);
assert.deepEqual(a, b, 'same input must be deterministic');
assert(a.bulk.radiusEarth > 0 && a.bulk.gravityEarth > 0);
assert(a.atmosphere.pressureBar >= 0);
assert(a.atmosphere.atmosphericMassEarth <= a.volatiles.inventoryEarthMass + 1e-18);

const hot = generatePlanet({ ...base, planetKey: 'hot', semiMajorAxisAu: 0.55 }, fixtureUnit);
const cold = generatePlanet({ ...base, planetKey: 'cold', semiMajorAxisAu: 1.6 }, fixtureUnit);
assert(hot.energy.equilibriumTemperatureK > cold.energy.equilibriumTemperatureK, 'higher irradiation must raise Teq');

const lowG = generatePlanet({ ...base, planetKey: 'gravity', planetMassEarth: 0.25 }, fixtureUnit);
const highG = generatePlanet({ ...base, planetKey: 'gravity', planetMassEarth: 3.0 }, fixtureUnit);
assert(highG.atmosphere.lambdaN2 > lowG.atmosphere.lambdaN2, 'higher mass at same causal fixture should improve heavy-gas Jeans retention proxy');

const p0 = sampleTerrainPatch(a, 'face0/12/9', 0, fixtureUnit);
const p6 = sampleTerrainPatch(a, 'face0/12/9', 6, fixtureUnit);
const p6again = sampleTerrainPatch(a, 'face0/12/9', 6, fixtureUnit);
assert.deepEqual(p6, p6again, 'random access terrain patch must be stable');
assert.equal(sampleTerrainPatch(a, 'face0/12/9', 3, fixtureUnit).resolution, 3);
assert(Number.isFinite(p0.meanHeightM) && Number.isFinite(p6.meanHeightM));

const env = environmentalContract(a);
assert(env.pressureBar >= 0 && env.oceanLandFraction.ocean >= 0 && env.oceanLandFraction.ocean <= 1);

console.log(JSON.stringify({ status: 'PASS', planetClass: a.bulk.class, meanSurfaceTemperatureK: a.climate.meanSurfaceTemperatureK, pressureBar: a.atmosphere.pressureBar, terrainSample: p6 }, null, 2));

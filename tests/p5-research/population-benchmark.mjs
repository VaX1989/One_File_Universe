import { performance } from 'node:perf_hooks';
import { generatePlanet, sampleTerrainPatch } from '../../research/p5/model.mjs';
import { fixtureUnit } from '../../research/p5/fixture-derivation.mjs';

function q(key, tag, lo, hi) { return lo + (hi - lo) * fixtureUnit(key, tag); }
const N = 10000;
const counts = new Map();
let invalid = 0, hot = 0, cold = 0, pressureSum = 0, teqSum = 0, massSum = 0, radiusSum = 0;
let monotonicFailures = 0;
const t0 = performance.now();
const planets = [];
for (let i = 0; i < N; i++) {
  const key = `population:${i}`;
  const mass = Math.exp(q(key, 'mass.log', Math.log(0.08), Math.log(80)));
  const a = Math.exp(q(key, 'a.log', Math.log(0.05), Math.log(12)));
  const starMass = q(key, 'star.mass', 0.55, 1.35);
  const input = {
    planetKey: key,
    systemAgeGyr: q(key, 'age', 0.2, 11.5),
    stellarMassSolar: starMass,
    stellarLuminositySolar: Math.pow(starMass, 3.7),
    semiMajorAxisAu: a,
    eccentricity: q(key, 'ecc', 0, 0.45),
    planetMassEarth: mass,
    metallicityDex: q(key, 'metal', -0.6, 0.5),
    formationRegion: { snowLineRatio: q(key, 'snow', 0.15, 3.0) },
  };
  const p = generatePlanet(input, fixtureUnit);
  planets.push(p);
  counts.set(p.bulk.class, (counts.get(p.bulk.class) || 0) + 1);
  if (!(p.bulk.radiusEarth > 0) || !(p.atmosphere.pressureBar >= 0) || !Number.isFinite(p.climate.meanSurfaceTemperatureK)) invalid++;
  if (p.energy.equilibriumTemperatureK > 500) hot++;
  if (p.energy.equilibriumTemperatureK < 150) cold++;
  pressureSum += Math.min(p.atmosphere.pressureBar, 1e6);
  teqSum += p.energy.equilibriumTemperatureK;
  massSum += p.bulk.massEarth;
  radiusSum += p.bulk.radiusEarth;

  if (i < 1000 && mass < 7) {
    const inner = generatePlanet({ ...input, planetKey: `${key}:metamorphic`, semiMajorAxisAu: Math.max(0.03, a * 0.8) }, fixtureUnit);
    const outer = generatePlanet({ ...input, planetKey: `${key}:metamorphic`, semiMajorAxisAu: a * 1.2 }, fixtureUnit);
    if (!(inner.energy.equilibriumTemperatureK > outer.energy.equilibriumTemperatureK)) monotonicFailures++;
  }
}
const t1 = performance.now();
let patchChecksum = 0;
const p0 = performance.now();
for (let i = 0; i < 5000; i++) {
  const p = planets[i % planets.length];
  const patch = sampleTerrainPatch(p, `face${i%6}/${(i*17)%1024}/${(i*31)%1024}`, i % 9, fixtureUnit);
  patchChecksum = (patchChecksum + (patch.meanHeightM || 0)) | 0;
}
const p1 = performance.now();
console.log(JSON.stringify({
  modelVersion: 'p5-research-planet-v0.1', N,
  classCounts: Object.fromEntries([...counts.entries()].sort()), invalid,
  hotFraction: hot/N, coldFraction: cold/N,
  means: { massEarth: massSum/N, radiusEarth: radiusSum/N, teqK: teqSum/N, cappedPressureBar: pressureSum/N },
  causalMetamorphic: { irradiationMonotonicFailures: monotonicFailures },
  performance: { genesisTotalMs: t1-t0, genesisUsPerPlanet: (t1-t0)*1000/N, terrain5000TotalMs: p1-p0, terrainUsPerPatch: (p1-p0)*1000/5000 },
  patchChecksum
}, null, 2));

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  AUTHORITY, MODEL_CATALOG, deriveRockyInterior, validateVolatileState,
  energyLimitedEscapeTg, applyEnergyLimitedEscape, greyAtmosphereTemperatureMilliK,
  thermalBudgetStep, rayleighNumberPpm, classifyLidRegime, zonalEnergyStep, validateWaterState,
  transferWater, climatePhaseProposal, refinePlanetBudget, projectPlanetBudget,
  reconcilePlanetBudget, deterministicTerrainEnvelope, classifyGiantPlanet,
  makeP4TransitionProposal, causalGraph
} from '../src/planetary-causality.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(fs.readFileSync(join(here, '..', 'fixtures', 'oracle-cases.json'), 'utf8'));
const bi = x => BigInt(x);
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };

test('rocky composition closes exactly and oracle radius stays within integer-root approximation tolerance', () => {
  for (const c of fixture.rockyCases) {
    const corePpm = bi(c.corePermille) * 1000n;
    const out = deriveRockyInterior({ massMilliEarth: bi(c.massMilliEarth), corePpm, mantlePpm: 1_000_000n - corePpm, waterPpm: 0n });
    assert.equal(out.composition.sumPpm, 1_000_000n);
    assert.equal(out.authority, AUTHORITY);
    const err = out.meanRadiusM > bi(c.radiusM) ? out.meanRadiusM - bi(c.radiusM) : bi(c.radiusM) - out.meanRadiusM;
    assert.ok(err <= 10n, `rocky oracle error ${err} m`);
    assert.ok(out.surfaceGravityMicroMs2 > 0n);
    assert.ok(out.meanDensityKgM3 > 0n);
  }
});

test('grey atmosphere fixed-point agrees with independent Decimal oracle', () => {
  for (const c of fixture.greyCases) assert.equal(greyAtmosphereTemperatureMilliK(bi(c.effectiveTemperatureMilliK), bi(c.opticalDepthPpm)), bi(c.temperatureMilliK));
});

test('grey temperature is monotone in optical depth inside declared idealized model', () => {
  const values = [0n, 250_000n, 666_667n, 1_000_000n, 4_000_000n].map(t => greyAtmosphereTemperatureMilliK(250_000n, t));
  for (let i = 1; i < values.length; i++) assert.ok(values[i] >= values[i - 1]);
});

test('energy-limited escape agrees with independent Decimal oracle', () => {
  for (const c of fixture.escapeCases) {
    const got = energyLimitedEscapeTg(Object.fromEntries(Object.entries(c).filter(([k]) => k !== 'escapeTg').map(([k, v]) => [k, bi(v)])));
    assert.equal(got, bi(c.escapeTg));
  }
});

test('volatile escape cannot exceed reservoir and exact total is conserved', () => {
  const state = { totalVolatileTg: 1000n, atmosphereTg: 100n, condensedTg: 300n, interiorTg: 600n, lostTg: 0n };
  validateVolatileState(state);
  const out = applyEnergyLimitedEscape(state, {efficiencyPpm: 300_000n, xuvFluxMilliWm2: 10_000_000n, xuvRadiusM: 10_000_000n, massMilliEarth: 1000n, rocheFactorPpm: 500_000n, dtKyr: 1000n});
  assert.equal(out.appliedEscapeTg, 100n); assert.equal(out.next.atmosphereTg, 0n); assert.equal(out.next.lostTg, 100n); validateVolatileState(out.next);
});

test('thermal reservoir obeys exact energy ledger and rejects negative reservoir', () => {
  const out = thermalBudgetStep({ mantleHeatTJ: 1000n }, {radiogenicInputTJ: 100n, tidalInputTJ: 50n, secularInputTJ: 0n, convectiveLossTJ: 120n, volcanicLossTJ: 30n});
  assert.equal(out.nextHeatTJ, 1000n); assert.equal(out.conservationResidualTJ, 0n);
  assert.throws(() => thermalBudgetStep({ mantleHeatTJ: 10n }, {radiogenicInputTJ: 0n, tidalInputTJ: 0n, convectiveLossTJ: 20n, volcanicLossTJ: 0n}), /negative reservoir/);
});

test('Rayleigh number fixed-point path returns an Earth-mantle-order convective value', () => {
  const raPpm = rayleighNumberPpm({densityKgM3: 4500n, gravityMicroMs2: 9_810_000n, expansivityNanoPerK: 30_000n, deltaTemperatureMilliK: 2_500_000n, layerThicknessM: 2_900_000n, diffusivityNanoM2s: 1000n, viscosityPaS: 1_000_000_000_000_000_000_000n});
  const ra = raPpm / 1_000_000n; assert.ok(ra > 10_000_000n && ra < 1_000_000_000n, `unexpected Ra ${ra}`);
});

test('lid classifier exposes candidate status rather than physical truth', () => {
  assert.equal(classifyLidRegime({ convectiveVigorPpm: 500_000n, viscosityContrastPpm: 100_000_000n }).regime, 'STAGNANT_LID_CANDIDATE');
  assert.equal(classifyLidRegime({ convectiveVigorPpm: 50_000n, viscosityContrastPpm: 1_000_000n }).regime, 'CONDUCTION_DOMINATED_CANDIDATE');
});

test('zonal transport is antisymmetric and conserves total energy absent forcing', () => {
  const out = zonalEnergyStep({ bands: [{energyUnits: 300_000n, capacityUnitsPerMilliK: 1n},{energyUnits: 280_000n, capacityUnitsPerMilliK: 1n},{energyUnits: 260_000n, capacityUnitsPerMilliK: 1n}] }, [0n, 0n, 0n], 100_000n);
  assert.equal(out.ledger.transportResidual, 0n); assert.equal(out.ledger.nextTotal, out.ledger.previousTotal); assert.equal(out.bands.length, 3);
});

test('zonal external forcing changes total by exactly forcing sum', () => {
  const out = zonalEnergyStep({ bands: [{energyUnits: 300_000n, capacityUnitsPerMilliK: 1n},{energyUnits: 280_000n, capacityUnitsPerMilliK: 1n}] }, [10n, -3n], 50_000n);
  assert.equal(out.ledger.nextTotal - out.ledger.previousTotal, 7n);
});

test('water reservoir transfers conserve exact total and reject overdraft', () => {
  const state = { totalWaterTg: 1000n, oceanTg: 600n, iceTg: 200n, atmosphereTg: 50n, interiorTg: 150n, lostTg: 0n };
  validateWaterState(state);
  const out = transferWater(state, [{ from: 'oceanTg', to: 'iceTg', massTg: 40n }, { from: 'interiorTg', to: 'oceanTg', massTg: 10n }]);
  validateWaterState(out.next); assert.equal(out.next.totalWaterTg, 1000n);
  assert.throws(() => transferWater(state, [{ from: 'atmosphereTg', to: 'lostTg', massTg: 51n }]), /overdraft/);
});

test('temperature-only phase helper is explicitly proposal-only', () => { const p = climatePhaseProposal(240_000n, 1000n); assert.equal(p.phase, 'ICE_FAVORED'); assert.equal(p.proposalOnly, true); });

test('REFINE PROJECT RECONCILE closes exact planet-region budget with bounded working set', () => {
  const refined = refinePlanetBudget(10_000_003n, [{address:'planet/A',weightPpm:333_333n},{address:'planet/B',weightPpm:333_333n},{address:'planet/C',weightPpm:333_334n}]);
  assert.equal(refined.boundedWorkingSet, true); assert.equal(projectPlanetBudget(refined).projectedUnits, 10_000_003n); assert.equal(reconcilePlanetBudget(10_000_003n, refined.regions).status, 'EXACT');
  const bad = refined.regions.map(r => ({ ...r })); bad[0].allocatedUnits += 1n; assert.equal(reconcilePlanetBudget(10_000_003n, bad).status, 'REJECT');
});

test('sparse terrain envelope is deterministic, bounded, and marked non-physical', () => {
  const a = deterministicTerrainEnvelope('p/facePX/l4/x3/y7', 8000n), b = deterministicTerrainEnvelope('p/facePX/l4/x3/y7', 8000n);
  assert.equal(a.elevationM, b.elevationM); assert.ok(a.elevationM >= -8000n && a.elevationM <= 8000n); assert.equal(a.physicalTruth, false);
});

test('giant family model refuses to fabricate radius or atmosphere', () => { const g = classifyGiantPlanet({massMilliEarth:318_000n,heavyElementMassMilliEarth:30_000n,irradiationPpm:1_000_000n}); assert.equal(g.family,'JOVIAN_CANDIDATE'); assert.equal(g.radiusPrediction,null); assert.equal(g.atmospherePrediction,null); });

test('P4 adapter produces non-canonical proposal with no event/order authority', () => {
  const p = makeP4TransitionProposal({operation:'EVOLVE',modelId:MODEL_CATALOG.volatileEscape.modelId,targetEntityId:'planet:abc',timeSeconds:1000n,timeMicros:0n,previousStateDigest:'00'.repeat(32),nextStateDigest:'11'.repeat(32),conservationLedgerDigest:'22'.repeat(32),payloadDigest:'33'.repeat(32)});
  assert.equal(p.canonicalAdmission,'REQUIRED_AND_NOT_PERFORMED'); assert.equal(p.privateClock,false); assert.equal(p.canonicalEventId,null); assert.equal(p.canonicalOrder,null); assert.equal(p.p4CommitResult,null); assert.match(p.proposalDigest,/^[0-9a-f]{64}$/);
});

test('causal graph is versioned and includes climate-hydrology and interior-escape chains', () => { const g=causalGraph(); assert.ok(g.edges.some(([a,b])=>a==='zonal_transport'&&b==='water_partition')); assert.ok(g.edges.some(([a,b])=>a==='interior_structure'&&b==='xuv_escape')); });

console.log(`\n${passed} research tests passed`);

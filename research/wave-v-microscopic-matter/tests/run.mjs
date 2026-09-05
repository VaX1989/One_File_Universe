import assert from 'node:assert/strict';
import {
  Units, compatibleUnits, convertValue, bridgeDescriptor, REFINE, PROJECT, RECONCILE,
  representationIdentity, RESEARCH_REGIMES
} from '../prototype/model-regime.mjs';
import { seedCells, createTissueState, stepTissue, totalMassLike, projectTissue } from '../prototype/cell-tissue.mjs';
import { syntheticVisualBackmap, sourceBackedAtomicRepresentation, projectAtomicRepresentation } from '../prototype/molecular-adapter.mjs';
import { MaterializationStore, requestKey } from '../prototype/micro-materialization.mjs';

const nearly = (a, b, eps = 1e-10) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));

assert.equal(compatibleUnits(Units.metre, Units.nanometre), true);
assert.equal(compatibleUnits(Units.metre, Units.second), false);
assert(nearly(convertValue(1, Units.micrometre, Units.nanometre), 1000));
assert(nearly(convertValue(1, Units.millisecond, Units.microsecond), 1000));

const ridA = representationIdentity({ entityId: 'E1', regimeId: RESEARCH_REGIMES.tissue.regimeId, localAddress: 'patch/0' });
const ridB = representationIdentity({ entityId: 'E1', regimeId: RESEARCH_REGIMES.tissue.regimeId, localAddress: 'patch/0' });
assert.equal(ridA, ridB);
assert.notEqual(ridA, representationIdentity({ entityId: 'E1', regimeId: RESEARCH_REGIMES.singleCell.regimeId, localAddress: 'patch/0' }));
assert.deepEqual(RESEARCH_REGIMES.tissue.observables, ['cellCount', 'fieldMass', 'cellStoreMass', 'meanField']);

let tissue = createTissueState({
  width: 24, height: 24, dtSeconds: 0.25, diffusivityM2PerS: 1e-10,
  cells: seedCells({ seed: 'corpus-a', count: 32, width: 24, height: 24, uptakePerSecond: 0.001 })
});
const initialMass = totalMassLike(tissue).total;
for (let i = 0; i < 200; i++) tissue = stepTissue(tissue);
const finalProjection = projectTissue(tissue);
assert(nearly(initialMass, finalProjection.totalMassLike, 2e-12));
assert(tissue.field.every((x) => x >= -1e-12));

const bridge = bridgeDescriptor({
  bridgeId: 'tissue-local-refinement-v0', fromRegime: 'tissue-coarse', toRegime: RESEARCH_REGIMES.tissue.regimeId,
  inheritedCommitments: ['totalMassLike'], projectedObservables: ['totalMassLike'],
  reconciliation: { totalMassLike: 'relative <= 2e-12' }
});
const refined = REFINE({ bridge, coarseState: { totalMassLike: initialMass }, query: { patch: 0 }, budget: { maxNodes: 1024 }, refine: () => ({ state: tissue }) });
const projected = PROJECT({ bridge, fineState: refined.state, project: ({ fineState }) => ({ observables: projectTissue(fineState) }) });
const witness = RECONCILE({
  bridge, coarseCommitments: { totalMassLike: initialMass }, projection: projected.observables,
  reconcile: ({ coarseCommitments, projection }) => ({
    pass: nearly(coarseCommitments.totalMassLike, projection.totalMassLike, 2e-12),
    discrepancy: projection.totalMassLike - coarseCommitments.totalMassLike
  })
});
assert.equal(witness.pass, true);

const beads = [
  { id: 'b0', x: 0, y: 0, z: 0, visualElement: 'C' },
  { id: 'b1', x: 0.5, y: 0, z: 0, visualElement: 'O' }
];
const backA = syntheticVisualBackmap({ complexId: 'M1', beads, atomsPerBead: 4 });
const backB = syntheticVisualBackmap({ complexId: 'M1', beads, atomsPerBead: 4 });
assert.deepEqual(backA, backB);
assert.equal(backA.dynamicalAuthority, 'NONE');
assert.equal(backA.evidenceClass, 'FICTIONAL');
const backProjection = projectAtomicRepresentation(backA);
assert.equal(backProjection.atomCount, 8);

const source = sourceBackedAtomicRepresentation({
  complexId: 'M2', sourceId: 'fixture:mmcif:demo', reportedResolutionAngstrom: 2.1,
  atoms: [{ element: 'C', x: 0, y: 0, z: 0 }, { element: 'O', x: 1, y: 0, z: 0 }]
});
assert.equal(source.visualAuthority, 'SOURCE_BACKED');
assert.equal(source.dynamicalAuthority, 'NONE');

const requests = Array.from({ length: 50 }, (_, i) => ({
  entityId: `E${i % 7}`, regimeId: i % 2 ? 'cell' : 'organelle', localAddress: `tile/${i}`, depth: 2
}));
const a = new MaterializationStore({ tier: 'WARM' });
const b = new MaterializationStore({ tier: 'WARM' });
const outputsA = requests.map((r) => a.materialize(r));
const outputsB = [...requests].reverse().map((r) => b.materialize(r));
const byKeyA = new Map(outputsA.map((x) => [x.key, x]));
for (const x of outputsB) assert.deepEqual(x, byKeyA.get(x.key));
assert.equal(new Set(requests.map(requestKey)).size, 50);
assert(a.snapshotKeys().length <= 64 && b.snapshotKeys().length <= 64);

console.log(JSON.stringify({
  status: 'PASS', tests: 18,
  tissue: { steps: 200, cells: tissue.cells.length, grid: `${tissue.width}x${tissue.height}`, conservationDiscrepancy: witness.discrepancy },
  molecular: { syntheticAtoms: backA.atoms.length, sourceAtoms: source.atoms.length },
  materialization: { requests: requests.length, maxCached: 64 }
}, null, 2));

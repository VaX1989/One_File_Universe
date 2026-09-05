import { performance } from 'node:perf_hooks';
import { seedCells, createTissueState, stepTissue } from '../prototype/cell-tissue.mjs';
import { MaterializationStore } from '../prototype/micro-materialization.mjs';

function benchTissue(size, cells, steps) {
  let state = createTissueState({
    width: size, height: size, dtSeconds: 0.25, diffusivityM2PerS: 1e-10,
    cells: seedCells({ seed: `bench-${size}-${cells}`, count: cells, width: size, height: size, uptakePerSecond: 0.0001 })
  });
  const t0 = performance.now();
  for (let i = 0; i < steps; i++) state = stepTissue(state);
  const ms = performance.now() - t0;
  return { size, cells, steps, ms: Number(ms.toFixed(3)), stepsPerSecond: Number((1000 * steps / ms).toFixed(1)) };
}

function benchMaterialization(n) {
  const store = new MaterializationStore({ tier: 'IMMEDIATE' });
  const t0 = performance.now();
  for (let i = 0; i < n; i++) store.materialize({ entityId: `E${i % 100}`, regimeId: 'cell', localAddress: `tile/${i}`, depth: 4 });
  const ms = performance.now() - t0;
  return { requests: n, ms: Number(ms.toFixed(3)), requestsPerSecond: Number((1000 * n / ms).toFixed(0)), cached: store.snapshotKeys().length };
}

console.log(JSON.stringify({
  environment: { node: process.version, platform: process.platform, arch: process.arch },
  tissue: [benchTissue(32, 64, 200), benchTissue(64, 256, 100), benchTissue(128, 512, 25)],
  materialization: benchMaterialization(10000),
  note: 'Microbenchmark only; not a production capacity claim and not portable across hardware/runtime.'
}, null, 2));

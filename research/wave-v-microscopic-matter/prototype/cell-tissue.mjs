import { createHash } from 'node:crypto';

function boundedIntFromHash(seed, label, modulus) {
  const digest = createHash('sha256').update('OFU-WVE-TISSUE-v0\0').update(seed).update('\0').update(label).digest();
  return digest.readUInt32BE(0) % modulus;
}

export function seedCells({ seed = 'wve-fixture', count, width, height, uptakePerSecond = 1e-4 }) {
  if (!Number.isInteger(count) || count < 0 || count > 4096) throw new RangeError('cell count must be 0..4096');
  return Array.from({ length: count }, (_, i) => ({
    id: `cell-${i}`,
    x: boundedIntFromHash(seed, `x:${i}`, width),
    y: boundedIntFromHash(seed, `y:${i}`, height),
    store: 0,
    uptakePerSecond
  }));
}

export function createTissueState({
  width = 32,
  height = 32,
  dxMetres = 20e-6,
  dtSeconds = 0.5,
  diffusivityM2PerS = 1e-10,
  initialConcentration = 1,
  cells = []
} = {}) {
  if (![width, height].every((x) => Number.isInteger(x) && x >= 2 && x <= 256)) throw new RangeError('grid must be 2..256 per axis');
  if (!Number.isFinite(dxMetres) || dxMetres <= 0 || !Number.isFinite(dtSeconds) || dtSeconds <= 0 || !Number.isFinite(diffusivityM2PerS) || diffusivityM2PerS < 0) {
    throw new TypeError('invalid physical discretization');
  }
  const alpha = diffusivityM2PerS * dtSeconds / (dxMetres * dxMetres);
  if (alpha > 0.24) throw new RangeError(`unstable explicit diffusion alpha=${alpha}`);
  if (!Number.isFinite(initialConcentration) || initialConcentration < 0) throw new TypeError('initialConcentration must be finite >= 0');
  const field = new Float64Array(width * height).fill(initialConcentration);
  return {
    schema: 'ofu.wve.cell-tissue-research.v0', width, height, dxMetres, dtSeconds, diffusivityM2PerS,
    field, cells: cells.map((cell) => ({ ...cell })), elapsedSeconds: 0
  };
}

export function totalMassLike(state) {
  let field = 0;
  for (const value of state.field) field += value;
  const stores = state.cells.reduce((sum, cell) => sum + cell.store, 0);
  return { field, stores, total: field + stores };
}

export function stepTissue(state) {
  const { width, height, field, diffusivityM2PerS, dtSeconds, dxMetres } = state;
  const alpha = diffusivityM2PerS * dtSeconds / (dxMetres * dxMetres);
  if (alpha > 0.24) throw new RangeError('unstable step');
  const next = field.slice();
  const index = (x, y) => y * width + x;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = index(x, y);
      if (x + 1 < width) {
        const j = index(x + 1, y);
        const flux = alpha * (field[j] - field[i]);
        next[i] += flux;
        next[j] -= flux;
      }
      if (y + 1 < height) {
        const j = index(x, y + 1);
        const flux = alpha * (field[j] - field[i]);
        next[i] += flux;
        next[j] -= flux;
      }
    }
  }

  const cells = state.cells.map((cell) => {
    const i = index(cell.x, cell.y);
    const requested = Math.max(0, cell.uptakePerSecond * dtSeconds);
    const uptake = Math.min(next[i], requested);
    next[i] -= uptake;
    return { ...cell, store: cell.store + uptake };
  });

  for (const value of next) {
    if (!Number.isFinite(value) || value < -1e-12) throw new Error('positivity invariant violated');
  }
  return { ...state, field: next, cells, elapsedSeconds: state.elapsedSeconds + dtSeconds };
}

export function projectTissue(state) {
  const mass = totalMassLike(state);
  return {
    schema: 'ofu.wve.tissue-projection.v0',
    cellCount: state.cells.length,
    fieldMassLike: mass.field,
    cellStoreMassLike: mass.stores,
    totalMassLike: mass.total,
    meanField: mass.field / state.field.length,
    elapsedSeconds: state.elapsedSeconds
  };
}

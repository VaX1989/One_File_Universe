import { createHash } from 'node:crypto';

export const EVIDENCE_CLASSES = Object.freeze([
  'ESTABLISHED',
  'EMPIRICALLY_CONSTRAINED',
  'HYPOTHETICAL',
  'SPECULATIVE',
  'FICTIONAL'
]);

export const MODEL_FIDELITIES = Object.freeze([
  'FORMAL',
  'HIGH_FIDELITY',
  'APPROXIMATE',
  'STYLIZED',
  'METAPHORICAL'
]);

export const DYNAMICAL_AUTHORITY = Object.freeze({
  NONE: 'NONE',
  LOCAL_RESEARCH: 'LOCAL_RESEARCH',
  VALIDATED_DOMAIN: 'VALIDATED_DOMAIN'
});

export const VISUAL_AUTHORITY = Object.freeze({
  NONE: 'NONE',
  REPRESENTATIONAL: 'REPRESENTATIONAL',
  SOURCE_BACKED: 'SOURCE_BACKED'
});

export const SI_DIMENSIONS = Object.freeze([
  'length', 'mass', 'time', 'current', 'temperature', 'amount', 'luminousIntensity'
]);

function assertFinitePositive(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new TypeError(`${name} must be finite and > 0`);
}

export function unit({ symbol, scaleToSI = 1, dimensions }) {
  if (typeof symbol !== 'string' || !symbol) throw new TypeError('unit symbol required');
  assertFinitePositive(scaleToSI, 'scaleToSI');
  if (!Array.isArray(dimensions) || dimensions.length !== SI_DIMENSIONS.length ||
      dimensions.some((x) => !Number.isInteger(x) || Math.abs(x) > 12)) {
    throw new TypeError('dimensions must be seven bounded integer exponents');
  }
  return Object.freeze({ symbol, scaleToSI, dimensions: Object.freeze([...dimensions]) });
}

export function compatibleUnits(a, b) {
  return a.dimensions.every((value, index) => value === b.dimensions[index]);
}

export function convertValue(value, from, to) {
  if (!compatibleUnits(from, to)) throw new Error(`incompatible units ${from.symbol} -> ${to.symbol}`);
  if (!Number.isFinite(value)) throw new TypeError('value must be finite');
  return value * from.scaleToSI / to.scaleToSI;
}

export function regimeDescriptor(input) {
  const requiredText = ['regimeId', 'semanticVersion', 'purpose', 'frameType', 'timeIntegration'];
  for (const key of requiredText) {
    if (typeof input[key] !== 'string' || !input[key]) throw new TypeError(`${key} required`);
  }
  if (!EVIDENCE_CLASSES.includes(input.evidenceClass)) throw new TypeError('unknown evidenceClass');
  if (!MODEL_FIDELITIES.includes(input.modelFidelity)) throw new TypeError('unknown modelFidelity');
  if (!Object.values(DYNAMICAL_AUTHORITY).includes(input.dynamicalAuthority)) throw new TypeError('unknown dynamicalAuthority');
  if (!Object.values(VISUAL_AUTHORITY).includes(input.visualAuthority)) throw new TypeError('unknown visualAuthority');
  assertFinitePositive(input.nominalTimeScaleSeconds, 'nominalTimeScaleSeconds');
  const observables = Array.isArray(input.observables) ? input.observables.map((x) =>
    typeof x === 'string' ? x : Object.freeze({ ...x })) : [];
  return Object.freeze({ ...input, observables: Object.freeze(observables) });
}

export function representationIdentity({ entityId, regimeId, localAddress = '', epoch = 'static' }) {
  for (const [k, v] of Object.entries({ entityId, regimeId, localAddress, epoch })) {
    if (typeof v !== 'string') throw new TypeError(`${k} must be string`);
  }
  return createHash('sha256')
    .update('OFU-WVE-REPRESENTATION-v0\0')
    .update(JSON.stringify([entityId, regimeId, localAddress, epoch]))
    .digest('hex');
}

export function bridgeDescriptor({ bridgeId, fromRegime, toRegime, inheritedCommitments, projectedObservables, reconciliation }) {
  if (!bridgeId || !fromRegime || !toRegime) throw new TypeError('bridge identity and endpoint regimes required');
  return Object.freeze({
    bridgeId,
    fromRegime,
    toRegime,
    inheritedCommitments: Object.freeze([...(inheritedCommitments ?? [])]),
    projectedObservables: Object.freeze([...(projectedObservables ?? [])]),
    reconciliation: Object.freeze({ ...(reconciliation ?? {}) })
  });
}

export function REFINE({ bridge, coarseState, query, budget, refine }) {
  if (typeof refine !== 'function') throw new TypeError('refine adapter required');
  if (!budget || !Number.isInteger(budget.maxNodes) || budget.maxNodes < 1) throw new TypeError('bounded maxNodes required');
  const result = refine({ coarseState, query, budget });
  if (!result || typeof result !== 'object') throw new Error('REFINE adapter returned invalid result');
  return Object.freeze({ operation: 'REFINE', bridgeId: bridge.bridgeId, ...result });
}

export function PROJECT({ bridge, fineState, project }) {
  if (typeof project !== 'function') throw new TypeError('project adapter required');
  const result = project({ fineState });
  if (!result || typeof result !== 'object') throw new Error('PROJECT adapter returned invalid result');
  return Object.freeze({ operation: 'PROJECT', bridgeId: bridge.bridgeId, ...result });
}

export function RECONCILE({ bridge, coarseCommitments, projection, reconcile }) {
  if (typeof reconcile !== 'function') throw new TypeError('reconcile adapter required');
  const result = reconcile({ coarseCommitments, projection });
  if (!result || typeof result.pass !== 'boolean') throw new Error('RECONCILE must return {pass:boolean,...}');
  return Object.freeze({ operation: 'RECONCILE', bridgeId: bridge.bridgeId, ...result });
}

export const Units = Object.freeze({
  metre: unit({ symbol: 'm', scaleToSI: 1, dimensions: [1, 0, 0, 0, 0, 0, 0] }),
  micrometre: unit({ symbol: 'um', scaleToSI: 1e-6, dimensions: [1, 0, 0, 0, 0, 0, 0] }),
  nanometre: unit({ symbol: 'nm', scaleToSI: 1e-9, dimensions: [1, 0, 0, 0, 0, 0, 0] }),
  second: unit({ symbol: 's', scaleToSI: 1, dimensions: [0, 0, 1, 0, 0, 0, 0] }),
  millisecond: unit({ symbol: 'ms', scaleToSI: 1e-3, dimensions: [0, 0, 1, 0, 0, 0, 0] }),
  microsecond: unit({ symbol: 'us', scaleToSI: 1e-6, dimensions: [0, 0, 1, 0, 0, 0, 0] }),
  nanosecond: unit({ symbol: 'ns', scaleToSI: 1e-9, dimensions: [0, 0, 1, 0, 0, 0, 0] }),
  picosecond: unit({ symbol: 'ps', scaleToSI: 1e-12, dimensions: [0, 0, 1, 0, 0, 0, 0] }),
  molePerCubicMetre: unit({ symbol: 'mol/m3', scaleToSI: 1, dimensions: [-3, 0, 0, 0, 0, 1, 0] })
});

export const RESEARCH_REGIMES = Object.freeze({
  tissue: regimeDescriptor({
    regimeId: 'ofu.wve.tissue-agent-field.v0', semanticVersion: '0.1.0',
    purpose: 'bounded tissue patch with cell agents and extracellular transport fields',
    frameType: 'TISSUE_PATCH_LOCAL', timeIntegration: 'explicit-subcycled-research',
    nominalTimeScaleSeconds: 1, evidenceClass: 'EMPIRICALLY_CONSTRAINED', modelFidelity: 'APPROXIMATE',
    dynamicalAuthority: 'LOCAL_RESEARCH', visualAuthority: 'REPRESENTATIONAL',
    observables: ['cellCount', 'fieldMass', 'cellStoreMass', 'meanField']
  }),
  singleCell: regimeDescriptor({
    regimeId: 'ofu.wve.single-cell-spatial.v0', semanticVersion: '0.1.0',
    purpose: 'single-cell compartment/reaction-transport research regime',
    frameType: 'CELL_LOCAL', timeIntegration: 'adapter-defined', nominalTimeScaleSeconds: 0.01,
    evidenceClass: 'EMPIRICALLY_CONSTRAINED', modelFidelity: 'APPROXIMATE',
    dynamicalAuthority: 'NONE', visualAuthority: 'REPRESENTATIONAL', observables: ['speciesAmount', 'flux']
  }),
  molecularCoarse: regimeDescriptor({
    regimeId: 'ofu.wve.molecular-coarse.v0', semanticVersion: '0.1.0',
    purpose: 'coarse molecular representation adapter', frameType: 'MOLECULE_LOCAL',
    timeIntegration: 'external-engine-only', nominalTimeScaleSeconds: 1e-9,
    evidenceClass: 'EMPIRICALLY_CONSTRAINED', modelFidelity: 'APPROXIMATE',
    dynamicalAuthority: 'NONE', visualAuthority: 'REPRESENTATIONAL', observables: ['composition', 'radiusOfGyration']
  }),
  atomicRepresentation: regimeDescriptor({
    regimeId: 'ofu.wve.atomic-representation.v0', semanticVersion: '0.1.0',
    purpose: 'source-backed or explicitly synthetic atomic representation', frameType: 'MOLECULE_LOCAL',
    timeIntegration: 'none-unless-external-protocol', nominalTimeScaleSeconds: 1e-12,
    evidenceClass: 'EMPIRICALLY_CONSTRAINED', modelFidelity: 'APPROXIMATE',
    dynamicalAuthority: 'NONE', visualAuthority: 'SOURCE_BACKED', observables: ['coordinates', 'composition']
  })
});

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validatePXEvidence, validatePXV1Evidence} from '../../tools/extensions/seal.mjs';

// These synthetic records falsify the seals; they are never runtime evidence.
const digest = 'a'.repeat(64);
const source = 'b'.repeat(40);
const bands = [
  'galaxy',
  'galactic_region',
  'stellar_neighborhood',
  'system',
  'orbit',
  'approach',
  'global_surface',
  'regional_surface',
  'local_surface',
  'human',
];
const composition = {};
const build = {
  sourceCommit: source,
  artifactSha256: digest,
  additiveComponents: composition,
  componentCompositionSha256: createHash('sha256').update(JSON.stringify(composition)).digest('hex'),
  px: {
    version: 'ofu-px-product-1',
    scope: 'FULL_WAVE_IV_PRODUCT',
    registryDigest: digest,
    regimes: bands.map(id => ({id})),
    registryManifest: {
      providers: [
        {id: 'px.domain', kind: 'domain', mandatory: true},
        {id: 'px.scene', kind: 'scene', mandatory: true},
      ],
    },
  },
};

const platformTuples = [
  'darwin/arm64/webkit',
  'linux/x64/chromium',
  'linux/x64/firefox',
  'linux/x64/webkit',
  'win32/x64/chromium',
];

const rows = platformTuples.map(tuple => {
  const [platform, arch, browser] = tuple.split('/');
  return {
    schema: 'ofu-px-browser-evidence-1',
    status: 'PASS',
    sourceSha: source,
    artifactSha256: digest,
    componentCompositionSha256: build.componentCompositionSha256,
    platform,
    arch,
    browser,
    capability: {webgl2: true},
    directFile: true,
    offline: true,
    unexpectedNetworkRequests: 0,
    pageErrors: 0,
    physicalAndroid: 'NOT_VERIFIED',
    physicalIOS: 'NOT_VERIFIED',
    registry: {
      sealed: true,
      bindingsSealed: true,
      manifestDigest: digest,
      entries: 2,
      bound: ['px.domain', 'px.scene'],
    },
    providerChecks: ['px.domain'],
    canonicalBefore: digest,
    canonicalAfter: digest,
    p4Before: digest,
    p4After: digest,
    metrics: {renderCalls: 100, reconciliations: 100, refinements: 50, projections: 50},
    workingSet: {
      cacheEntries: 1,
      witnessCount: 32,
      resources: {entries: 2, totalDecodedBytes: 1000},
    },
    journeys: Array.from({length: 3}, () => bands.map(scale => ({
      scale,
      witness: digest,
      backend: ['regional_surface', 'local_surface', 'human'].includes(scale)
        ? 'webgl2-local-surface'
        : ['orbit', 'approach', 'global_surface'].includes(scale)
          ? 'webgl2'
          : 'canvas2d',
    }))).flat(),
  };
});

validatePXEvidence(rows, build, source);
let cases = 1;
for (const mutate of [
  x => x.pop(),
  x => { x[0].sourceSha = 'c'.repeat(40); },
  x => { x[0].artifactSha256 = 'f'.repeat(64); },
  x => { x[0].componentCompositionSha256 = 'f'.repeat(64); },
  x => { x[0].registry.manifestDigest = 'f'.repeat(64); },
  x => { x[0].registry.bound = []; },
  x => { x[0].capability.webgl2 = false; },
  x => { x[0].directFile = false; },
  x => { x[0].physicalIOS = 'PASS'; },
  x => { x[0].metrics.refinements = 0; },
  x => { x[0].metrics.projections = 0; },
  x => { x[0].metrics.renderCalls = 0; },
  x => { x[0].providerChecks = []; },
  x => { x[0].canonicalAfter = 'f'.repeat(64); },
  x => { x[0].workingSet.cacheEntries = 17; },
  x => { x[0].journeys = x[0].journeys.filter(j => j.scale !== 'human'); },
  x => { x[1] = {...x[0]}; },
]) {
  const changed = structuredClone(rows);
  mutate(changed);
  assert.throws(() => validatePXEvidence(changed, build, source));
  cases++;
}

const v1Providers = [
  {id: 'px.domain.canonical', kind: 'domain', mandatory: true},
  {id: 'px.model.identity', kind: 'model', mandatory: true},
  {id: 'px.query.discovery', kind: 'query', mandatory: true},
  {id: 'px.inspector.selection', kind: 'inspector', mandatory: true},
  {id: 'px.persistence.context', kind: 'persistence', mandatory: true},
  {id: 'px.representation.context', kind: 'representation', mandatory: true},
  {id: 'px.test.conformance', kind: 'test', mandatory: true},
  {id: 'v1.model.astronomy', kind: 'model', mandatory: true},
  {id: 'v1.query.environment', kind: 'query', mandatory: true},
  {id: 'v1.scene.living-world', kind: 'scene', mandatory: true},
];
const v1Build = {
  ...build,
  visualUniverse: {primarySceneProvider: 'v1.scene.living-world'},
  px: {
    ...build.px,
    scope: 'FULL_V2_LIVING_PRODUCT_OVER_V1_COMPATIBILITY_RUNTIME',
    registryManifest: {providers: v1Providers},
  },
};
const directPX = v1Providers
  .filter(provider => provider.id.startsWith('px.') && provider.kind !== 'scene')
  .map(provider => provider.id)
  .sort();
const bound = v1Providers.map(provider => provider.id);
const stages = [
  'APPROACH',
  'GALAXY',
  'GLOBAL_SURFACE',
  'HUMAN',
  'LOCAL_SURFACE',
  'ORBIT',
  'REGIONAL_SURFACE',
  'SYSTEM',
];
const viewports = [[1280, 800], [390, 844], [844, 390]];

const v1Rows = platformTuples.map(tuple => {
  const [platform, arch, browser] = tuple.split('/');
  const journeys = viewports.flatMap(([width, height]) => [
    ...stages.map(stage => ({viewport: {width, height}, stage, cache: 1})),
    ...stages.slice(0, 2).map(stage => ({viewport: {width, height}, stage, cache: 1})),
  ]);
  return {
    schema: 'ofu-px-browser-evidence-2',
    status: 'PASS',
    sourceSha: source,
    artifactSha256: digest,
    componentCompositionSha256: v1Build.componentCompositionSha256,
    platform,
    arch,
    browser,
    capability: {webgl2: true},
    directFile: true,
    offline: true,
    unexpectedNetworkRequests: 0,
    pageErrors: 0,
    physicalAndroid: 'NOT_VERIFIED',
    physicalIOS: 'NOT_VERIFIED',
    registry: {
      sealed: true,
      bindingsSealed: true,
      manifestDigest: digest,
      entries: v1Providers.length,
      bound: [...bound],
    },
    providerChecks: [...directPX],
    canonicalBefore: digest,
    canonicalAfter: digest,
    p4Before: digest,
    p4After: digest,
    metrics: {renderCalls: 100, reconciliations: 100, refinements: 50, projections: 50},
    workingSet: {
      pxCacheEntries: 1,
      pxWitnessCount: 1,
      livingHistoryDepth: 1,
      livingDiscoveryCacheEntries: 1,
      resources: {entries: 2, totalDecodedBytes: 1000},
    },
    journeys,
  };
});

validatePXV1Evidence(v1Rows, v1Build, source);
cases++;
for (const mutate of [
  x => { x[0].providerChecks.push('v1.model.astronomy'); },
  x => { x[0].registry.bound = x[0].registry.bound.filter(id => id !== 'v1.model.astronomy'); },
  x => { x[0].registry.bound = x[0].registry.bound.filter(id => id !== 'v1.scene.living-world'); },
  x => { x[0].journeys = x[0].journeys.filter(j => !(j.viewport.width === 390 && j.stage === 'SYSTEM')); },
  x => { x[0].journeys = x[0].journeys.filter(j => !(j.viewport.width === 844 && j.stage === 'SYSTEM')); },
]) {
  const changed = structuredClone(v1Rows);
  mutate(changed);
  assert.throws(() => validatePXV1Evidence(changed, v1Build, source));
  cases++;
}

console.log(JSON.stringify({status: 'PASS', suite: 'px-seal', cases, syntheticOnly: true}));

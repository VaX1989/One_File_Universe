// The active product manifest must describe the composed foreground owner.
// Historical Wave IV descriptors remain available under an explicit legacy key.
import assert from 'node:assert/strict';
const required = [
  'v1.convergence.world-context', 'v1.convergence.material-context',
  'v1.exploration.living-runtime', 'v1.rendering.living-renderer',
  'v1.product.living-universe'
];
export function attachWaveAProduct(manifest, plan) {
  const ids = new Set(plan.map(c => c.id));
  for (const id of required) assert.ok(ids.has(id), 'Wave A assembly missing ' + id);
  assert.ok(manifest.px.registryManifest.providers.some(p => p.id === 'v1.scene.living-world'),
    'Wave A foreground must use the sealed scene provider');
  manifest.legacyPresentation = {
    primary: false, retainedFor: 'COMPATIBILITY_AND_HISTORICAL_PROVENANCE',
    visualUniverse: manifest.visualUniverse,
    planetPresentation: manifest.planetPresentation,
    surfacePresentation: manifest.surfacePresentation
  };
  const canvas = 'ofu-wave-a-living-renderer-1';
  const globe = 'ofu-v1-world-webgl2-1';
  manifest.visualUniverse = {
    version: 'ofu-wave-a-living-universe-1', authority: 'PRESENTATION_ONLY',
    primarySceneProvider: 'v1.scene.living-world',
    primaryScenePolicy: Object.fromEntries([
      'UNIVERSE', 'GALAXY', 'REGION', 'NEIGHBORHOOD', 'SYSTEM', 'ORBIT',
      'APPROACH', 'GLOBAL_SURFACE', 'REGIONAL_SURFACE', 'LOCAL_SURFACE', 'HUMAN',
      'MATERIAL', 'MICROSTRUCTURE', 'MOLECULAR', 'ATOMIC'
    ].map(scale => [scale, canvas])),
    globeBackend: globe, fallback: 'BOUNDED_MODEL_SAMPLED_CANVAS',
    duplicatePrimaryRendererAllowed: false, decorativeObjectsCanonical: false,
    scientificAuthorityOfRenderings: false
  };
  manifest.planetPresentation = {
    rendererVersion: canvas, globeBackend: globe, authority: 'PRESENTATION_ONLY',
    worldSource: 'ofu-wave-a-world-context-1',
    sampling: 'SHARED_MODEL_ENVIRONMENT_AT_MICRODEGREE_COORDINATES',
    modelAuthority: 'MODEL_DERIVED_SIMULATION',
    canonicalSurfaceFeatureClaim: false, canonicalBiosphereClaim: false,
    surfaceAvailability: 'MODEL_BODY_CAPABILITY_NOT_UNIVERSAL_SOLID_SURFACE',
    textureSamples: [96, 48], textureCacheEntries: 2
  };
  manifest.surfacePresentation = {
    rendererVersion: canvas, authority: 'PRESENTATION_ONLY',
    terrainIdentity: 'SELECTED_BODY_PLUS_NORMALIZED_MICRODEGREE_LOCATION',
    sourceDetail: 8, maxWindowSamples: 192,
    features: 'SHARED_GEOLOGY_HYDROLOGY_LOCAL_ECOLOGY_AND_CIVILIZATION',
    settlements: 'SCHEMATIC_AGGREGATES_AT_MODEL_SETTLEMENT_COORDINATES',
    microscopicSources: 'VALIDATED_SELECTED_LOCAL_MATERIAL_OR_OBJECT',
    unresolvedChemistry: 'NO_FABRICATED_MOLECULES_OR_ATOMS',
    canonicalGeodesyClaim: false, atomicallyExhaustiveClaim: false,
    resourceBounds: {maxGlobePrograms: 2, maxGlobeBuffers: 1, maxGlobeTextures: 1}
  };
  manifest.worldConvergence = {
    version: 'ofu-wave-a-world-convergence-1', developmentCandidate: true,
    inputProvenance: 'docs/integration/wave-a-inputs.json',
    runtimeVersion: 'ofu-wave-a-living-runtime-1',
    canonicalAuthority: ['P2_IDENTITY', 'P3_ASTRONOMY', 'P4_COMMITTED_HISTORY', 'P6_ELIGIBILITY'],
    modelAuthority: 'MODEL_DERIVED_SIMULATION', renderAuthority: 'PRESENTATION_ONLY',
    modelHistoryCommitsCanonicalEvents: false, canonicalP6Changed: false,
    historyFrames: 64, cacheBounds: {discovery: 12, worlds: 16, bodies: 8, candidates: 32},
    releaseVersionDeclared: false
  };
  manifest.px.scope = 'FULL_V1_WAVE_A_PRODUCT';
  manifest.productSourceComposition += '+v1-wave-a-world-convergence-1';
  return manifest;
}

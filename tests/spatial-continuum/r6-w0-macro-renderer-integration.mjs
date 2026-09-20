import assert from 'node:assert/strict';
import fs from 'node:fs';
import { macroPresentationProfile } from '../../src/experiments/spatial-continuum/macro-renderer-residency.js';

const read=relative=>fs.readFileSync(new URL('../../'+relative,import.meta.url),'utf8');
const helper=read('src/experiments/spatial-continuum/macro-renderer-residency.js'),facade=read('src/experiments/spatial-continuum/renderer-phase2.js'),build=read('tools/build-spatial-continuum.mjs'),base=read('src/experiments/spatial-continuum/renderer.js'),experience=read('src/experiments/spatial-continuum/experience.js');
assert.match(helper,/createProgressiveMacroMaterializer/);assert.match(helper,/maxBuildPerSlice=2/);assert.match(helper,/fullLayerClearRebuild:false/);assert.match(helper,/semanticDiscoveryInRenderer:false/);assert.match(helper,/MACRO_TARGET_CHANGED/);assert.match(helper,/disposeEntry/);
const signatureSource=helper.slice(helper.indexOf('export const macroStructuralSignature'),helper.indexOf('export function createProgressiveMacroRenderer'));assert.doesNotMatch(signatureSource,/\.selected/,'selection-only changes must not invalidate structural macro residency');
assert.match(experience,/from '\.\/renderer-phase2\.js'/);assert.match(facade,/createBaseContinuumRenderer/);assert.match(facade,/scene:base\.scene/);assert.match(facade,/macroRenderingOwnedExternally:true/);assert.match(facade,/getOpenUniverse:\(\)=>activeWorld\.openUniverse/);assert.match(facade,/rendererOwnedPicking:true/);assert.match(facade,/WORLD_REBIND/);assert.match(facade,/requestAnimationFrame\(renderMacroContinuation\)/);assert.match(facade,/maxBuildPerSlice:2/);assert.doesNotMatch(facade,/createMacroSuppressedOpenUniverse|Object\.getOwnPropertyDescriptors\(openUniverse\)|descriptors\.catalogueFor|new Proxy\(openUniverse/,'active architecture must use explicit renderer ownership, not authority wrapping');
assert.match(base,/const macro=macroRenderingOwnedExternally\?null:createMacroLayer/);assert.match(base,/owner:macroRenderingOwnedExternally\?'EXTERNAL':'BASE'/);
assert.match(build,/semanticBuildTransforms:false/);assert.match(build,/macroRendererOwner:'PHASE2_PROGRESSIVE'/);assert.doesNotMatch(build,/r6-w0-phase2-product-integration|path\.basename\(args\.importer\)|renderer-phase2\.js.*onResolve/);

const representative={
  galaxy:{id:'g',kind:'GALAXY',morphology:'DISK',size:2,selected:false},
  region:{id:'r',kind:'GALACTIC_REGION',morphology:'UNKNOWN',size:1,selected:false},
  system:{id:'s',kind:'SYSTEM',morphology:'UNKNOWN',size:.4,selected:false},
  star:{id:'star',kind:'STAR',morphology:'UNKNOWN',size:1.8,selected:true},
  body:{id:'planet',kind:'PLANET',morphology:'UNKNOWN',size:1.1,selected:false}
};
const stages={
  UNIVERSE:macroPresentationProfile('UNIVERSE',representative.galaxy),
  GALAXY:macroPresentationProfile('GALAXY',representative.region),
  REGION:macroPresentationProfile('REGION',representative.region),
  NEIGHBORHOOD:macroPresentationProfile('NEIGHBORHOOD',representative.system),
  SYSTEM_STAR:macroPresentationProfile('SYSTEM',representative.star),
  SYSTEM_BODY:macroPresentationProfile('SYSTEM',representative.body)
};
assert.deepEqual(macroPresentationProfile('REGION',representative.region),stages.REGION,'macro profile must be deterministic');
assert.deepEqual(Object.values(stages).map(profile=>profile.authority),Array(Object.keys(stages).length).fill('PRESENTATION_ONLY'));
assert.deepEqual(
  [stages.UNIVERSE.composition,stages.GALAXY.composition,stages.REGION.composition,stages.NEIGHBORHOOD.composition,stages.SYSTEM_STAR.composition],
  ['VAST_GALAXY_FIELD','GALACTIC_REGION_CLOUD','REGION_FILAMENT_NETWORK','STELLAR_NEIGHBORHOOD_DEPTH_FIELD','SYSTEM_HIERARCHY']
);
assert.notEqual(stages.GALAXY.radialMultiplier,stages.REGION.radialMultiplier,'GALAXY and REGION must not collapse to the same spatial grammar');
assert.notEqual(stages.GALAXY.verticalMultiplier,stages.REGION.verticalMultiplier,'GALAXY and REGION must have materially different depth hierarchy');
assert.notEqual(stages.NEIGHBORHOOD.depthCompression,stages.REGION.depthCompression,'NEIGHBORHOOD must establish a distinct depth field');
assert.equal(stages.SYSTEM_STAR.family,'STAR');assert.equal(stages.SYSTEM_BODY.family,'BODY');
assert.ok(stages.SYSTEM_STAR.particleCount>stages.SYSTEM_BODY.particleCount,'SYSTEM hierarchy must privilege stellar light structure without changing canonical identity');
assert.ok(stages.SYSTEM_STAR.coreMultiplier>stages.SYSTEM_BODY.coreMultiplier,'SYSTEM stellar/body hierarchy must be perceptible beyond palette');
for(const profile of Object.values(stages)){assert.ok(profile.particleCount>=4&&profile.particleCount<=400,'stage particle budget must remain bounded');assert.ok(profile.depthCompression>.25&&profile.depthCompression<1.5)}

console.log(JSON.stringify({status:'PASS',suite:'r6-w0-phase2-macro-renderer-integration',singleBaseRenderer:true,progressiveResidency:true,maxBuildPerSlice:2,selectionOnlyStructuralRebuild:false,explicitMacroOwnership:true,authoritativeOpenUniverseIntact:true,legacyBaseMacroConstructed:false,rendererOwnedPicking:true,presentationAuthority:'PRESENTATION_ONLY',stageProfiles:stages,stageCompositionDistinct:true,systemHierarchyBeyondPalette:true},null,2));

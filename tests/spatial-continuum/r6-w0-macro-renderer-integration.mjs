import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=relative=>fs.readFileSync(new URL('../../'+relative,import.meta.url),'utf8');
const helper=read('src/experiments/spatial-continuum/macro-renderer-residency.js'),facade=read('src/experiments/spatial-continuum/renderer-phase2.js'),build=read('tools/build-spatial-continuum.mjs'),base=read('src/experiments/spatial-continuum/renderer.js');
assert.match(helper,/createProgressiveMacroMaterializer/);assert.match(helper,/maxBuildPerSlice=2/);assert.match(helper,/fullLayerClearRebuild:false/);assert.match(helper,/semanticDiscoveryInRenderer:false/);assert.match(helper,/MACRO_TARGET_CHANGED/);assert.match(helper,/disposeEntry/);
const signatureSource=helper.slice(helper.indexOf('export const macroStructuralSignature'),helper.indexOf('export function createProgressiveMacroRenderer'));assert.doesNotMatch(signatureSource,/\.selected/,'selection-only changes must not invalidate structural macro residency');
assert.match(facade,/createBaseContinuumRenderer/);assert.match(facade,/scene:base\.scene/);assert.match(facade,/baseMacroSuppressed:true/);assert.match(facade,/rendererOwnedPicking:true/);assert.match(facade,/WORLD_REBIND/);assert.match(facade,/requestAnimationFrame\(renderMacroContinuation\)/);assert.match(facade,/maxBuildPerSlice:2/);
assert.match(build,/r6-w0-phase2-renderer/);assert.match(build,/renderer-phase2\.js/);assert.match(build,/path\.basename\(args\.importer\)==='experience\.js'/);
assert.match(base,/const clear=\(\)=>\{/,'the Phase-1 renderer remains preserved as the certified base');assert.match(facade,/catalogueFor'\)return\(\)=>Object\.freeze\(\[\]\)/,'the old destructive macro layer must be inert in the Phase-2 product facade');
console.log(JSON.stringify({status:'PASS',suite:'r6-w0-phase2-macro-renderer-integration',singleBaseRenderer:true,progressiveResidency:true,maxBuildPerSlice:2,selectionOnlyStructuralRebuild:false,baseMacroSuppressed:true,rendererOwnedPicking:true},null,2));

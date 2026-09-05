import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {loadProduct} from '../extensions/product-helpers.mjs';

// PX preserves the normalized ownership invariant across the complete Wave IV
// ladder; the retired four-band mock no longer represents the shipped product.
const {O,key}=loadProduct(),R=O.waveIVScaleRuntime;
assert.equal(R.VERSION,'ofu-wave-iv-scale-runtime-3');
assert.equal(R.SCENE_PROVIDER_CONTRACT,'ofu-wave-iv-scene-provider-1');
assert.equal(R.SELECTION_CONTRACT,'ofu-wave-iv-selection-1');
assert.equal(R.TRANSITION_CONTRACT,'ofu-wave-iv-transition-2');
assert.deepEqual([...R.CURRENT_BANDS],['galaxy','galactic_region','stellar_neighborhood','system','orbit','approach','global_surface','regional_surface','local_surface','human']);
assert.deepEqual([...R.FUTURE_LADDER],[...R.CURRENT_BANDS]);assert.equal(R.normalizeBand('close'),'human');
for(const d of [1e12,1e7,400,180,40,4,3,1.35,1.02,1.006,1.0007,1.00008])assert.ok(R.CURRENT_BANDS.includes(R.deriveSemanticScale(d)),'continuous scale must always derive a semantic band');
let distanceCommands=0,cameraIntents=0,planetActive=null,systemActive=null,surfaceActive=null;
R.registerSceneProvider({id:'planet-webgl',scales:['orbit','approach','global_surface'],setActive:v=>{planetActive=v},setDistanceRadii:()=>{distanceCommands++},cameraIntent:()=>{cameraIntents++}});
R.registerSceneProvider({id:'wave-iv-macro',scales:['galaxy','galactic_region','stellar_neighborhood','system'],setActive:v=>{systemActive=v}});
R.registerSceneProvider({id:'surface-webgl',scales:['regional_surface','local_surface','human'],setActive:v=>{surfaceActive=v}});
assert.equal(R.snapshot().activeSceneProvider,'wave-iv-macro');
const before=R.snapshot().cameraCommandCount;R.requestStage('orbit',{source:'test-stage'});const orbit=R.snapshot();
assert.equal(orbit.semanticScale,'orbit');assert.equal(orbit.activeSceneProvider,'planet-webgl');assert.equal(orbit.intentKind,'anchor');assert.equal(orbit.cameraCommandCount,before+1);assert.equal(planetActive,true);assert.equal(systemActive,false);assert.equal(surfaceActive,false);
R.setContinuousDistance(3,{source:'test-wheel'});assert.notEqual(R.snapshot().semanticScale,null);assert.equal(R.snapshot().intentKind,'continuous');
R.dispatchCameraIntent({kind:'rotate-step',dx:.1,dy:0},{source:'test-keyboard'});assert.equal(cameraIntents,1);
const selectedId=O.pxProduct.captured(key).selection.target.entityId;R.setSelection(key,{planetId:selectedId,presentationStatus:'SUPPORTED'});const sel=R.snapshot().selectedCanonicalTarget;assert.equal(sel.orbitIndex,0);assert.equal(sel.planetId,selectedId);assert.equal(String(sel.canonicalKey.siteX),'61');
assert.throws(()=>R.setSelection(key,{planetId:'abc'}),/identity does not match/);assert.deepEqual(R.snapshot().selectedCanonicalTarget,sel);
O.pxProduct.seal();assert.equal(O.pxProduct.snapshot().registry.bindingsSealed,true);
const input=fs.readFileSync('src/bootstrap/product/input-router.js','utf8'),scene=fs.readFileSync('src/bootstrap/product/explorer-scene-adapter.js','utf8'),normalizer=fs.readFileSync('src/bootstrap/product/scene-normalizer.js','utf8');
assert.match(input,/addEventListener\('wheel',handleWheel,\{passive:false,capture:true\}\)/);assert.match(input,/stopImmediatePropagation/);assert.match(input,/touch|pointerType/);assert.match(input,/refreshPlanetAnchors\('resize'\)/);assert.doesNotMatch(scene,/setInterval/);assert.match(scene,/scaleChanged/);const nodes=Object.fromEntries(['planet-view','visual-universe-overlay','wave-iv-macro-view'].map(id=>[id,{style:{},dataset:{},setAttribute(k,v){this[k]=v;}}]));
globalThis.document={readyState:'complete',getElementById:id=>nodes[id]};vm.runInThisContext(normalizer);
for(const scale of ['galaxy','orbit','human','system']){R.requestStage(scale,{driveCamera:false});const macro=R.snapshot().activeSceneProvider==='wave-iv-macro';assert.equal(nodes['wave-iv-macro-view'].style.display,macro?'block':'none');assert.equal(nodes['planet-view'].style.visibility,macro?'hidden':'visible');assert.equal(nodes['visual-universe-overlay'].style.visibility,'hidden');assert.equal(nodes['visual-universe-overlay'].dataset.scenePrimary,'false');}
delete globalThis.document;
console.log(JSON.stringify({status:'PASS',scaleRuntime:R.VERSION,inputIntent:'ofu-wave-iv-input-intent-3',sceneProvider:R.SCENE_PROVIDER_CONTRACT,selection:R.SELECTION_CONTRACT,transition:R.TRANSITION_CONTRACT,semanticScaleAlwaysDefined:true,eventDrivenSceneSeam:true,singlePrimarySceneContract:true,distanceCommands,cameraIntents}));

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const parseRoots=['src/bootstrap/product','src/rendering'];for(const root of parseRoots)for(const name of fs.readdirSync(root).sort()){if(!name.endsWith('.js'))continue;const file=path.join(root,name);new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});}
globalThis.OFU={};vm.runInThisContext(fs.readFileSync('src/bootstrap/product/scale-runtime.js','utf8'));
const R=OFU.waveIVScaleRuntime;assert.equal(R.VERSION,'ofu-wave-iv-scale-runtime-3');assert.deepEqual([...R.LADDER],['galaxy','stellar_neighborhood','system','orbit','approach','global_surface','regional_surface','local_surface','human']);assert.ok(R.snapshot().semanticScale);assert.equal(R.normalizeBand('close'),'human');assert.equal(R.normalizeBand('neighborhood'),'stellar_neighborhood');
const activations=[];for(const [id,scales] of [['wave-iv-macro',['galaxy','stellar_neighborhood','system']],['planet-webgl',['orbit','approach','global_surface']],['surface-webgl',['regional_surface','local_surface','human']]])R.registerSceneProvider({id,scales,setActive(active,s){if(active)activations.push([id,s.semanticScale])}});
for(const scale of R.LADDER){R.requestStage(scale,{source:'oracle',driveCamera:false});assert.equal(R.snapshot().semanticScale,scale);const expected=['galaxy','stellar_neighborhood','system'].includes(scale)?'wave-iv-macro':['orbit','approach','global_surface'].includes(scale)?'planet-webgl':'surface-webgl';assert.equal(R.snapshot().activeSceneProvider,expected)}
const key={galaxyX:48n,galaxyY:-50n,galaxyZ:-1n,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:61n,siteY:0n,siteZ:0n,orbitSlot:0n};R.setSelection(key,{planetId:'p',presentationStatus:'SUPPORTED'});const before=R.snapshot().selectedCanonicalTarget;R.requestStage('galaxy',{driveCamera:false});R.requestStage('human',{driveCamera:false});assert.deepEqual(R.snapshot().selectedCanonicalTarget,before);
R.requestStage('orbit',{driveCamera:false});const a=R.snapshot().anchors,threshold=Math.sqrt(a.orbit*a.approach);R.setContinuousDistance(threshold*1.01,{driveCamera:false});assert.equal(R.snapshot().semanticScale,'orbit','hysteresis must retain previous band near boundary');R.setContinuousDistance(threshold*.85,{driveCamera:false});assert.equal(R.snapshot().semanticScale,'approach');
for(let i=0;i<R.LADDER.length-1;i++)assert.equal(R.adjacent(R.LADDER[i],R.LADDER[i+1]),true);assert.equal(R.adjacent('galaxy','system'),false);
// Anchored framing is resized by the scale owner; continuous travel is not snapped.
R.requestStage('approach',{driveCamera:false});
const framed=R.snapshot().anchors.approach*1.1;
R.configureAnchor('approach',framed,{source:'resize-oracle'});
assert.equal(R.snapshot().distanceIntentRadii,framed,'resize must synchronize anchored scale intent');
assert.equal(R.snapshot().intentKind,'anchor');
R.setContinuousDistance(framed*.97,{driveCamera:false});
const continuous=R.snapshot().distanceIntentRadii;
R.configureAnchor('approach',framed*1.05,{source:'resize-oracle'});
assert.equal(R.snapshot().distanceIntentRadii,continuous,'resize must not snap continuous travel');
assert.equal(R.snapshot().intentKind,'continuous');
console.log(JSON.stringify({status:'PASS',version:R.VERSION,scales:R.LADDER,activations:activations.length,selectionContinuity:true,hysteresis:R.snapshot().hysteresisFraction,parsedBrowserSourceRoots:parseRoots}));

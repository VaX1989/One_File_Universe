import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {loadP5Runtime,canonicalContext} from '../../p5/p5-test-helpers.mjs';

const O=loadP5Runtime();
vm.runInThisContext(fs.readFileSync('src/rendering/universe-presentation.js','utf8'));
vm.runInThisContext(fs.readFileSync('src/rendering/macro/macro-scene.js','utf8'));
vm.runInThisContext(fs.readFileSync('src/rendering/macro/macro-interaction.js','utf8'));
vm.runInThisContext(fs.readFileSync('src/rendering/macro/macro-provider.js','utf8'));
const A=O.p3Astronomy,M=O.waveIVMacroScene,I=O.waveIVMacroInteraction,P=O.waveIVMacroProvider,ctx=canonicalContext(A);
const anchor=Object.freeze({galaxyX:48n,galaxyY:-50n,galaxyZ:-1n,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:61n,siteY:0n,siteZ:0n,orbitSlot:0n});
assert.equal(A.resolveSystem(ctx,anchor).status,'PRESENT','known P3 anchor must remain present');

function systemAt(delta){return M.shiftSystemKey(anchor,delta,0,0)}
function findFixture(predicate,{limit=8192}={}){
 for(let d=0;d<limit;d++)for(const sign of d===0?[1]:[1,-1]){const key=systemAt(d*sign),system=A.resolveSystem(ctx,key);if(system?.status==='PRESENT'&&predicate(system,key))return{system,key}}
 return null;
}
const multi=findFixture(s=>s.facts.stellarComponentCount>1n);
const onePlanet=findFixture(s=>s.facts.planetCount===1n);
const manyPlanet=findFixture(s=>s.facts.planetCount>=6n);
assert(multi,'bounded fixture scan must find a multi-star system');
assert(onePlanet,'bounded fixture scan must find a one-planet system');
assert(manyPlanet,'bounded fixture scan must find a many-planet system');

for(const scale of ['GALAXY','NEIGHBORHOOD','SYSTEM','ORBIT']){
 const first=M.buildScene(scale,ctx,anchor,{selectedOrbitSlot:0}),second=M.buildScene(scale,ctx,anchor,{selectedOrbitSlot:0});
 assert.deepEqual(first,second,scale+' descriptor must be deterministic');assert.equal(M.validateScene(first),true);assert(first.objects.length+first.guides.length+first.decorative.length<=M.CAPS.totalSceneObjects);
 for(const d of first.decorative){assert.equal(d.canonical,false);assert.equal(d.selectable,false);assert.equal(d.navigable,false);assert.equal(d.authority,M.AUTHORITY.DECORATIVE_ONLY)}
 assert.equal(first.claims.presentDayOrbitalPhase,false);assert.equal(first.claims.apparentBrightnessPhysical,false);assert.equal(first.claims.canonicalColor,false);
}
const galaxy=M.galaxyScene(ctx,anchor),neighborhood=M.neighborhoodScene(ctx,anchor);
assert(galaxy.discovery.queryCount<=M.CAPS.galaxyQueries);assert(galaxy.objects.length<=M.CAPS.visibleGalaxies);assert.equal(galaxy.discovery.enumeratesUniverse,false);
assert(neighborhood.discovery.queryCount<=M.CAPS.neighborhoodQueries);assert(neighborhood.objects.length<=M.CAPS.visibleSystems);assert.equal(neighborhood.discovery.enumeratesUniverse,false);
for(const object of neighborhood.objects)assert.equal(object.geometryAuthority,M.AUTHORITY.CANONICAL_GEOMETRY);

function verifySystemFixture(fixture){
 const scene=M.systemScene(ctx,{...fixture.key,orbitSlot:0n},{selectedOrbitSlot:0});const s=fixture.system;
 assert.equal(scene.objects.filter(o=>o.kind==='STAR').length,Number(s.facts.stellarComponentCount));assert.equal(scene.objects.filter(o=>o.kind==='PLANET').length,Number(s.facts.planetCount));
 for(const planet of scene.objects.filter(o=>o.kind==='PLANET')){assert.equal(planet.canonical,true);assert.equal(planet.interaction.selectionAuthority,'ofu-product-canonical-planet-selection-1');assert.equal(planet.claims.presentationAngleIsOrbitalPhase,false)}
 return scene;
}
verifySystemFixture(multi);verifySystemFixture(onePlanet);verifySystemFixture(manyPlanet);

const systemScene=M.systemScene(ctx,anchor,{selectedOrbitSlot:0});const selected=systemScene.objects.find(o=>o.kind==='PLANET'&&o.selectedPath);assert(selected,'system scene must preserve selected canonical body');
const desktop=I.layout(systemScene,{width:1200,height:720}),mobile=I.layout(systemScene,{width:390,height:700,mobile:true});
assert(desktop.hits.length<=M.CAPS.hitObjects);assert(desktop.labels.length<=M.CAPS.labelsDesktop);assert(mobile.labels.length<=M.CAPS.labelsMobile);for(const hit of mobile.hits){assert(hit.width>=44);assert(hit.height>=44)}
const selectedHit=desktop.hits.find(h=>h.objectId===selected.objectId);assert(selectedHit);assert.equal(I.hitTest(desktop,selectedHit.x,selectedHit.y)?.objectId,selected.objectId);
let selectedKey=null;const selectionAuthority={contract:'ofu-product-canonical-planet-selection-1',selectPlanet(key){selectedKey=key;return{canonicalStatus:'PRESENT'}}};
const pointer=I.pointerActivation(desktop,selectedHit.x,selectedHit.y,{selectionAuthority});assert.equal(pointer.handled,true);assert.deepEqual(selectedKey,selected.canonicalKey);assert.equal(pointer.shadowSelection,false);
selectedKey=null;const keyboard=I.keyActivation(desktop,selected.objectId,'Enter',{selectionAuthority});assert.equal(keyboard.handled,true);assert.deepEqual(selectedKey,selected.canonicalKey);assert.equal(keyboard.shadowSelection,false);
assert.throws(()=>I.activate(selectedHit,{selectionAuthority:{contract:'wrong',selectPlanet(){}}}),/normalized canonical selection authority required/);

const orbit=M.orbitScene(ctx,anchor,{selectedOrbitSlot:0}),anchors=orbit.objects.filter(o=>o.kind==='PLANET_HANDOFF_ANCHOR');assert.equal(anchors.length,1);assert.equal(anchors[0].presentationGeometry.renderPrimitive,'NONE');assert.equal(orbit.handoff.macroOwnsPrimarySelectedWorld,false);assert.equal(orbit.handoff.duplicatePrimaryRendererAllowed,false);assert.equal(orbit.handoff.primarySelectedWorldRenderer,'EXTERNAL_PLANET_PROVIDER');
const absent=findFixture(s=>false,{limit:1});void absent;
let absentKey=null;for(let d=1;d<4096&&!absentKey;d++){const key=systemAt(d),system=A.resolveSystem(ctx,key);if(system?.status!=='PRESENT')absentKey=key}assert(absentKey,'bounded scan must encounter an absent system site');assert.equal(M.systemScene(ctx,absentKey).status,'UNSUPPORTED');

assert.equal(M.transitionDescriptor('GALAXY','NEIGHBORHOOD',{reducedMotion:true}).durationMs,0);assert.equal(M.transitionDescriptor('SYSTEM','ORBIT').orbitalMotion,false);assert.equal(P.snapshot().shadowSelection,false);assert.equal(P.snapshot().shadowScaleRuntime,false);
for(let i=0;i<M.CAPS.cachedScenes+4;i++)P.getScene({scale:'SYSTEM',ctx,canonicalKey:M.shiftSystemKey(manyPlanet.key,i,0,0)});assert(P.snapshot().cacheSize<=M.CAPS.cachedScenes);

console.log(JSON.stringify({status:'PASS',contract:M.CONTRACT,fixtures:{multiStars:Number(multi.system.facts.stellarComponentCount),onePlanet:Number(onePlanet.system.facts.planetCount),manyPlanets:Number(manyPlanet.system.facts.planetCount)},bounds:M.CAPS,directSelection:true,keyboardEquivalent:true,mobileMinTargetCssPx:I.MIN_TARGET_CSS_PX,orbitPrimaryWorldOwnedExternally:true}));

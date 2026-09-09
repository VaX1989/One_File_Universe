import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

let originalCalls=0,providerCalls=0,regionArgs=null,projectionCalls=0,placementCalls=0;
const original=Object.freeze({
 VERSION:'original',
 projectEntities(args){placementCalls++;assert.equal(args.context,'NEIGHBORHOOD');return {objects:[{canonicalId:'neighbor',position:{x:1,y:2,z:3}}]}},
 profile({context}){return {scaleUnits:context==='NEIGHBORHOOD'?36:context==='REGION'?150:1}},
 projectPoint(position,cameraFrame){projectionCalls++;return Object.freeze({visible:true,x:position.x/150,y:position.y/150,depth:150,cameraFrame});},
 representation(args){originalCalls++;return Object.freeze({scale:args.context,sourceId:args.scopeId,objects:Object.freeze([{sourceId:'fallback'}])})}
});
const provider=Object.freeze({
 AUTHORITY:'PRESENTATION_ONLY',CONTRACT:'ofu-v2x-03-macrocosm-consumer-1',
 buildUniverse(args){providerCalls++;return Object.freeze({scale:'UNIVERSE',sourceId:args.scopeId,objects:Object.freeze([{sourceId:'universe'}]),camera:Object.freeze({consumedExternalFrame:true})})},
 buildGalaxy(args){providerCalls++;return Object.freeze({scale:'GALAXY',sourceId:args.galaxy.canonicalId,objects:Object.freeze([{sourceId:'galaxy'}]),camera:Object.freeze({consumedExternalFrame:true})})},
 buildRegion(args){providerCalls++;regionArgs=args;return Object.freeze({scale:'REGION',sourceId:args.parentId,objects:Object.freeze([{sourceId:'region',position:Object.freeze({x:75,y:-30,z:12})}])})},
 buildNeighborhood(args){providerCalls++;assert.equal(args.objects[0].canonicalId,'neighbor');assert.deepEqual(args.objects[0].position,{x:1,y:2,z:3});return Object.freeze({scale:'NEIGHBORHOOD',sourceId:'n',objects:Object.freeze([{sourceId:'neighbor'}]),camera:Object.freeze({consumedExternalFrame:true})})}
});
const sandbox={OFU:{v1x02SpatialUniverse:original,v2x03MacrocosmProvider:provider},Object,Array,String,Error,TypeError,Number};sandbox.globalThis=sandbox;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('../../src/rendering/v2x-convergence/macrocosm-composition.js',import.meta.url),'utf8'),sandbox,{filename:'macrocosm-composition.js'});
const S=sandbox.OFU.v1x02SpatialUniverse,cameraFrame={id:'external-camera'};
assert.equal(S.__v2x03Composed,true);
assert.equal(S.representation({context:'UNIVERSE',scopeId:'u',entities:[],cameraFrame}).objects[0].sourceId,'universe');
assert.equal(S.representation({context:'GALAXY',scopeId:'g',entities:[],cameraFrame}).objects[0].sourceId,'galaxy');
const region=S.representation({context:'REGION',scopeId:'r',entities:[],cameraFrame});
assert.equal(region.objects[0].sourceId,'region');assert.equal(region.objects[0].view.visible,true);assert.equal(region.camera.consumedExternalFrame,true);assert.equal(region.composition.regionExtent,150);assert.equal(regionArgs.parentExtent,150);assert.equal(projectionCalls,1);
assert.equal(S.representation({context:'NEIGHBORHOOD',scopeId:'n',entities:[],cameraFrame}).objects[0].sourceId,'neighbor');
const snap=S.compositionSnapshot();
assert.equal(snap.status,'ACTIVE');assert.equal(snap.providerCalls,4);assert.equal(snap.fallbacks,0);assert.equal(providerCalls,4);assert.equal(originalCalls,0);
assert.equal(placementCalls,1,'raw navigation entities require upstream presentation placement before Neighborhood projection');
assert.equal(snap.cameraAuthorityChanged,false);assert.equal(snap.selectionAuthorityChanged,false);assert.equal(snap.canonicalTruthChanged,false);assert.equal(snap.last.cameraConsumed,true);
console.log(JSON.stringify({schema:'ofu-v2x-convergence-macrocosm-composition-1',status:'PASS',providerCalls:snap.providerCalls,fallbacks:snap.fallbacks,regionExternalCamera:true,regionExtent:region.composition.regionExtent}));

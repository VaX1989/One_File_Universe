import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

let originalCalls=0,providerCalls=0;
const original=Object.freeze({
 VERSION:'original',
 profile({context}){return {scaleUnits:context==='NEIGHBORHOOD'?36:1}},
 representation(args){originalCalls++;return Object.freeze({scale:args.context,sourceId:args.scopeId,objects:Object.freeze([{sourceId:'fallback'}])})}
});
const provider=Object.freeze({
 AUTHORITY:'PRESENTATION_ONLY',CONTRACT:'ofu-v2x-03-macrocosm-consumer-1',
 buildUniverse(args){providerCalls++;return Object.freeze({scale:'UNIVERSE',sourceId:args.scopeId,objects:Object.freeze([{sourceId:'universe'}])})},
 buildGalaxy(args){providerCalls++;return Object.freeze({scale:'GALAXY',sourceId:args.galaxy.canonicalId,objects:Object.freeze([{sourceId:'galaxy'}])})},
 buildNeighborhood(args){providerCalls++;return Object.freeze({scale:'NEIGHBORHOOD',sourceId:'n',objects:Object.freeze([{sourceId:'neighbor'}])})}
});
const sandbox={OFU:{v1x02SpatialUniverse:original,v2x03MacrocosmProvider:provider},Object,Array,String,Error};sandbox.globalThis=sandbox;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('../../src/rendering/v2x-convergence/macrocosm-composition.js',import.meta.url),'utf8'),sandbox,{filename:'macrocosm-composition.js'});
const S=sandbox.OFU.v1x02SpatialUniverse;
assert.equal(S.__v2x03Composed,true);
assert.equal(S.representation({context:'UNIVERSE',scopeId:'u',entities:[],cameraFrame:{}}).objects[0].sourceId,'universe');
assert.equal(S.representation({context:'GALAXY',scopeId:'g',entities:[],cameraFrame:{}}).objects[0].sourceId,'galaxy');
assert.equal(S.representation({context:'NEIGHBORHOOD',scopeId:'n',entities:[],cameraFrame:{}}).objects[0].sourceId,'neighbor');
assert.equal(S.representation({context:'REGION',scopeId:'r',entities:[],cameraFrame:{}}).objects[0].sourceId,'fallback');
const snap=S.compositionSnapshot();
assert.equal(snap.status,'ACTIVE');assert.equal(snap.providerCalls,3);assert.equal(snap.fallbacks,1);assert.equal(providerCalls,3);assert.equal(originalCalls,1);
assert.equal(snap.cameraAuthorityChanged,false);assert.equal(snap.selectionAuthorityChanged,false);assert.equal(snap.canonicalTruthChanged,false);
console.log(JSON.stringify({schema:'ofu-v2x-convergence-macrocosm-composition-1',status:'PASS',providerCalls:snap.providerCalls,fallbacks:snap.fallbacks}));

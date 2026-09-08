import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
vm.runInThisContext(fs.readFileSync(path.join(root,'src/rendering/planet/approach/approach-continuity.js'),'utf8'),{filename:'approach-continuity.js'});
const api=globalThis.OFU.v2x04ApproachContinuity;
const packet=api.makePacket({systemId:'sys-1',bodyId:'planet-1',parentBodyId:'star-1',startDistanceRatio:5000,endDistanceRatio:1.02,samples:65,approachVector3d:[4,-2,7],surfaceTarget:{latitudeDeg:39.2,longitudeDeg:369.1},referenceFrameId:'frame-system',scaleStateToken:'semantic-system'});
assert.equal(packet.authority,'PRESENTATION_ONLY');
assert.equal(packet.scientificEvidence,false);
assert.equal(packet.direction,'REFINE_TO_BODY');
assert.equal(packet.frames.length,65);
assert.equal(api.validate(packet),true);
assert.equal(api.normalizeLongitude(369.1),9.100000000000023);
for(const stage of api.STAGES)assert(packet.frames.some(f=>f.stage===stage),`missing ${stage}`);
for(let i=1;i<packet.frames.length;i++)assert(packet.frames[i].distanceRatio<packet.frames[i-1].distanceRatio);
for(const f of packet.frames){assert.equal(f.stage,api.stageForRatio(f.distanceRatio));assert(Math.abs(Math.hypot(...f.presentationTravelDirection3d)-1)<1e-9);assert(Math.abs(Math.hypot(...f.presentationPositionRadii3d)-f.distanceRatio)<1e-8*Math.max(1,f.distanceRatio));}
assert.equal(packet.frames[0].surfaceTargetBlend,0);
assert(packet.frames.at(-1).surfaceTargetBlend>.9);
const targetDir=api.surfaceDirection(packet.frames[0].surfaceTarget),dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
assert(dot(packet.frames.at(-1).presentationTravelDirection3d,targetDir)>dot(packet.frames[0].presentationTravelDirection3d,targetDir));
const reverse=api.reverse(packet);
assert.equal(reverse.direction,'PROJECT_TO_SYSTEM');
assert.equal(api.validate(reverse),true);
for(let i=1;i<reverse.frames.length;i++)assert(reverse.frames[i].distanceRatio>reverse.frames[i-1].distanceRatio);
const round=api.reverse(reverse),witness=api.roundTripWitness(packet);
assert.equal(api.validate(round),true);
assert.equal(witness.reversible,true);
assert.deepEqual(round.frames.map(f=>f.presentationPositionRadii3d),packet.frames.map(f=>f.presentationPositionRadii3d));

const mutate=(field,value)=>({...packet,frames:packet.frames.map((f,i)=>i===20?{...f,[field]:value}:f)});
assert.equal(api.validate(mutate('stage','SYSTEM')),false);
assert.equal(api.validate(mutate('presentationTravelDirection3d',[1,0,0])),false);
assert.equal(api.validate(mutate('presentationPositionRadii3d',[1,2,3])),false);
assert.equal(api.validate(mutate('surfaceTargetBlend',.123)),false);
assert.equal(api.validate(mutate('t',.123)),false);
assert.equal(api.validate({...packet,frames:packet.frames.map((f,i)=>i===20?{...f,cameraStateMutation:undefined}:f)}),false);
assert.throws(()=>api.reverse(mutate('stage','SYSTEM')),/valid approach packet/);
assert.throws(()=>api.makePacket({systemId:'s',bodyId:'p',startDistanceRatio:10,endDistanceRatio:1.02,samples:0}),/sample budget/);
assert.throws(()=>api.makePacket({systemId:'s',bodyId:'p',startDistanceRatio:10,endDistanceRatio:1.02,samples:5.5}),/sample budget/);
assert.throws(()=>api.makePacket({systemId:'s',bodyId:'p',startDistanceRatio:10,endDistanceRatio:1.02,surfaceTarget:{latitudeDeg:1}}),/both latitude and longitude/);
assert.throws(()=>api.makePacket({systemId:'s',bodyId:'p',startDistanceRatio:10,endDistanceRatio:1.02,surfaceTarget:{latitudeDeg:91,longitudeDeg:0}}),/latitude/);
assert.throws(()=>api.makePacket({systemId:'s',bodyId:'p',startDistanceRatio:10,endDistanceRatio:1.02,referenceFrameId:''}),/referenceFrameId/);

const bytes=Uint8Array.from([0,1,254,255]);
const bytePacket=api.makePacket({systemId:bytes,bodyId:bytes,parentBodyId:Uint8Array.from([1,2]),startDistanceRatio:10,endDistanceRatio:1.02,samples:5});
assert.equal(bytePacket.frames[0].systemCanonicalEntityId,'0001feff');
assert.equal(bytePacket.frames[0].bodyCanonicalEntityId,'0001feff');
assert.equal(bytePacket.frames[0].parentCanonicalEntityId,'0102');
assert.equal(api.validate(bytePacket),true);

const maxPacket=api.makePacket({systemId:'max-s',bodyId:'max-p',startDistanceRatio:api.LIMITS.maxDistanceRatio,endDistanceRatio:api.LIMITS.minDistanceRatio,samples:api.LIMITS.maxSamples,approachVector3d:[0,0,1],surfaceTarget:{latitudeDeg:-90,longitudeDeg:180}});
assert.equal(maxPacket.frames.length,api.LIMITS.maxSamples);
assert.equal(api.validate(maxPacket),true);
assert.equal(api.validate(api.reverse(maxPacket)),true);
let approachSeed=0x04a11ce>>>0;const approachRand=()=>{approachSeed=(Math.imul(approachSeed,1664525)+1013904223)>>>0;return approachSeed/4294967296};
for(let i=0;i<64;i++){
 const start=1001+approachRand()*500000,end=api.LIMITS.minDistanceRatio+approachRand()*.4,samples=5+Math.floor(approachRand()*120),vector=[approachRand()-.5,approachRand()-.5,approachRand()-.5];if(Math.hypot(...vector)<1e-6)vector[0]=1;
 const target=approachRand()<.75?{latitudeDeg:-90+approachRand()*180,longitudeDeg:-1080+approachRand()*2160}:null;
 const row=api.makePacket({systemId:`fuzz-s-${i}`,bodyId:`fuzz-b-${i}`,startDistanceRatio:start,endDistanceRatio:end,samples,approachVector3d:vector,...(target?{surfaceTarget:target}:{})});assert.equal(api.validate(row),true);const back=api.reverse(row);assert.equal(api.validate(back),true);assert.equal(api.roundTripWitness(row).reversible,true);
}

console.log(JSON.stringify({status:'PASS',suite:'v2x04-approach-continuity-oracle-v3',samples:packet.frames.length,stages:[...new Set(packet.frames.map(f=>f.stage))],identityStable:true,byteIdentityPreserved:true,reverseValidated:true,roundTripValidated:witness.reversible,renderable3dTrajectory:true,strongTamperRejection:true,maxSamples:maxPacket.frames.length,metamorphicApproachCases:64,scientificEvidence:false}));

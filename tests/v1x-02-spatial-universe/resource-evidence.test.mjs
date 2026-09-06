import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const sourcePath=path.join(root,'src/v1x-02-spatial-universe/spatial-universe.js');
const sandbox={console};sandbox.globalThis=sandbox;
vm.runInNewContext(fs.readFileSync(sourcePath,'utf8'),sandbox,{filename:sourcePath});
const S=sandbox.OFU.v1x02SpatialUniverse;
const entities=Array.from({length:S.MAX_ENTITIES},(_,i)=>({canonicalId:'resource-entity:'+i,sourceAuthority:'CANONICAL_PROVEN'}));
const run=()=>{
  const scene=S.projectEntities({context:'GALAXY',scopeId:'resource-envelope',entities,presentationSeed:'resource-seed',morphology:'SPIRAL',densityHint:.61,limit:S.MAX_ENTITIES});
  const probes=S.sampleNeighborhood({context:'GALAXY',scopeId:'resource-envelope',anchorId:'resource-anchor',presentationSeed:'resource-seed',morphology:'SPIRAL',densityHint:.61,limit:S.MAX_PROBES});
  return {scene,probes};
};
for(let i=0;i<10;i++)run();
const samples=[];let value;
for(let i=0;i<100;i++){const start=performance.now();value=run();samples.push(performance.now()-start)}
samples.sort((a,b)=>a-b);
const serializedBytes=Buffer.byteLength(JSON.stringify(value));
assert.equal(value.scene.objects.length,S.MAX_ENTITIES);
assert.equal(value.probes.probes.length,S.MAX_PROBES);
assert.ok(serializedBytes<=262144,'representative maximum envelope exceeds declared provider byte budget');
const result={status:'PASS',oracle:'v1x02-bounded-resource-envelope',authority:'MEASURED_RUNTIME_EVIDENCE',runtime:process.version,entityCount:S.MAX_ENTITIES,probeCount:S.MAX_PROBES,serializedBytes,iterations:samples.length,medianMs:Number(samples[Math.floor(samples.length*.5)].toFixed(6)),p95Ms:Number(samples[Math.floor(samples.length*.95)].toFixed(6)),measurementScope:'LOCAL_NODE_DIAGNOSTIC_NOT_BROWSER_GPU'};
console.log(JSON.stringify(result));

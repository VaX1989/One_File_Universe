import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {loadP6} from './p6-test-helpers.mjs';

const O=loadP6(),P=O.p2,B=O.p6Biosphere,h=P.hex;
const seed=Uint8Array.from({length:32},(_,index)=>index+1),universeIdentity=Uint8Array.from({length:32},(_,index)=>255-index),planetId=Uint8Array.from({length:32},(_,index)=>(index*3)&255),binding=B.bindings({masterSeed:seed,canonicalUniverseIdentity:universeIdentity});
function one(index){
  const ids=B.idsForPlanet(binding,planetId,{lineageOrdinal:BigInt(index),speciesOrdinal:3n});
  const budget=B.energyBudget({phototrophicUsableEnergyU:5000000000n+BigInt(index),phototrophicCaptureEfficiencyPpm:420000n,chemotrophicUsableEnergyU:null,chemotrophicCaptureEfficiencyPpm:0n,biomassSupportEfficiencyPpm:800000n});
  return {index,lineageId:h(ids.lineageId),speciesId:h(ids.speciesId),primary:budget.primaryProductivityCeilingU.toString()};
}
const sequential=Array.from({length:12},(_,index)=>one(index)),reverse=[...Array(12).keys()].reverse().map(one).sort((a,b)=>a.index-b.index);
assert.deepEqual(sequential,reverse);

const files=['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/domains/astronomy/p3-skeleton.js','src/domains/astronomy/p3-canonical.js','src/temporal/p4-temporal.js','src/domains/planetology/p5-canonical.js','src/domains/planetology/p5-environment-v2.js','src/domains/biosphere/p6-canonical.js'];
const workerSource=`const {parentPort,workerData}=require('node:worker_threads');const fs=require('node:fs'),vm=require('node:vm');globalThis.OFU={};for(const file of workerData.files)vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});const P=OFU.p2,B=OFU.p6Biosphere,seed=Uint8Array.from(workerData.seed),uid=Uint8Array.from(workerData.uid),planet=Uint8Array.from(workerData.planet),binding=B.bindings({masterSeed:seed,canonicalUniverseIdentity:uid}),ids=B.idsForPlanet(binding,planet,{lineageOrdinal:BigInt(workerData.index),speciesOrdinal:3n}),budget=B.energyBudget({phototrophicUsableEnergyU:5000000000n+BigInt(workerData.index),phototrophicCaptureEfficiencyPpm:420000n,chemotrophicUsableEnergyU:null,chemotrophicCaptureEfficiencyPpm:0n,biomassSupportEfficiencyPpm:800000n});parentPort.postMessage({index:workerData.index,lineageId:P.hex(ids.lineageId),speciesId:P.hex(ids.speciesId),primary:budget.primaryProductivityCeilingU.toString()});`;
const parallel=await Promise.all(Array.from({length:12},(_,index)=>new Promise((resolve,reject)=>{const worker=new Worker(workerSource,{eval:true,workerData:{files,seed:[...seed],uid:[...universeIdentity],planet:[...planetId],index}});worker.once('message',resolve);worker.once('error',reject)})));
parallel.sort((a,b)=>a.index-b.index);
assert.deepEqual(sequential,parallel);
const output={status:'PASS',sequential:true,shuffled:true,workers:true,differentBatching:true,manifestHash:h(B.manifestHash()),resultCount:parallel.length,canonicalBiologyEstablished:false};
fs.mkdirSync('dist/evidence/p6',{recursive:true});fs.writeFileSync('dist/evidence/p6/worker-order.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output));

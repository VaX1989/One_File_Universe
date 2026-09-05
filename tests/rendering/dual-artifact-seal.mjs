import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

// Schema/adversarial fixtures only. These values are not runtime measurements and
// are never uploaded into the production evidence directory.
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ofu-seal-schema-'));
const source='1'.repeat(40),component='2'.repeat(64),foundation='<html>foundation schema fixture</html>',product='<html>full product schema fixture</html>';
const hash=s=>createHash('sha256').update(s).digest('hex');
const witness={p4Current:'p4',p4Replay:'p4',p6State:'INSUFFICIENT_ENVIRONMENT',p6BiologyEstablished:false};
const matrix=[['linux','x64','chromium'],['linux','x64','firefox'],['linux','x64','webkit'],['win32','x64','chromium'],['darwin','arm64','webkit']];
const metric={measurement:'MEASURED',samples:30,p50:10,p95:20,p99:30};
const records=[];
for(const [platform,arch,browser] of matrix){
 const id=[platform,arch,browser].join('-');
 const row={status:'PASS',sourceCommit:source,artifactSha256:hash(foundation),componentManifestHash:component,platform,arch,browser,backend:'webgl2',unexpectedNetworkRequests:0,pageErrors:0,canonicalWitness:witness,
  telemetry:{raf:{measurement:'MEASURED'},cpuTerrainBuild:{measurement:'MEASURED'},startup:{measurement:'MEASURED'},cacheCounts:{measurement:'MEASURED'},gpuUpload:{measurement:'MEASURED'},rendererGpuBytes:{measurement:'DERIVED'},physicalDriverVram:{measurement:'NOT MEASURABLE'}},
  performanceRegimes:Object.fromEntries(['steadyStateSurface','lodChurn','originRebasing','referenceFrameTransition','contextLossRecovery'].map(k=>[k,metric])),
  gpu:{liveMeshes:1,maxMeshes:48,liveTrackedBytes:100,maxBytes:1000,deletedBuffers:2,createdBuffers:4,liveBuffers:2,lifecycleAccountingExact:true},contextRecovery:{status:'PASS'},visual:{pixelCheck:'MEASURED',nonBackgroundPixels:30}};
 const frame={orbit:{coverage:{applicable:true,guaranteedPixels:100,clearGuaranteedPixels:0}},approach:{coverage:{applicable:true,guaranteedPixels:100,clearGuaranteedPixels:0}},close:{local:{mode:'LOCAL',framebuffer:{status:'MEASURED',cpuHits:20,cpuHitClear:0}}}};
 const full={status:'PASS',artifactScope:'FULL_WAVE_IV_PRODUCT',exactSourceSha:source,artifactSha256:hash(product),platform,arch,browser,canonicalWitness:witness,canonicalWitnessNonInterference:true,physicalAndroid:'NOT_VERIFIED',legacyCloseProbes:[{},{},{}],repeatedNavigation:Array.from({length:18},()=>({})),desktop:frame,mobile:frame};
 records.push([id+'.json',row],[id+'-full.json',full]);
}
const manifests=[['rendering-foundation-manifest.json',{sourceCommit:source,componentManifestHash:component,artifactSha256:hash(foundation),artifactBytes:Buffer.byteLength(foundation)}],['rendering-build-manifest.json',{sourceCommit:source,componentManifestHash:component,artifactSha256:hash(product),artifactBytes:Buffer.byteLength(product),waveIVRuntime:{version:'ofu-wave-iv-scale-runtime-3'},surfacePresentation:{coverageArchitecture:'FRUSTUM_GROUND_FOOTPRINT_BOUNDED'}}]];
function reset(){fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir);for(const [file,row] of [...records,...manifests])fs.writeFileSync(path.join(dir,file),JSON.stringify(row));fs.writeFileSync(path.join(dir,'One_File_Universe.html'),product);fs.writeFileSync(path.join(dir,'One_File_Universe-foundation.html'),foundation);}
function run(){return spawnSync(process.execPath,['tests/rendering/seal-production-evidence.mjs',dir],{encoding:'utf8',env:{...process.env,OFU_SOURCE_SHA:source}});}
function mutate(file,fn){const p=path.join(dir,file),value=JSON.parse(fs.readFileSync(p));fn(value);fs.writeFileSync(p,JSON.stringify(value));}
try{
 reset();const positive=run();assert.equal(positive.status,0,positive.stderr);const seal=JSON.parse(positive.stdout);assert.equal(seal.artifactSha256,hash(product));assert.equal(seal.foundationArtifactSha256,hash(foundation));
 const failures=[
  ()=>fs.unlinkSync(path.join(dir,'linux-x64-chromium-full.json')),
  ()=>mutate('linux-x64-chromium-full.json',v=>v.artifactSha256=hash(foundation)),
  ()=>mutate('linux-x64-chromium-full.json',v=>v.exactSourceSha='3'.repeat(40)),
  ()=>mutate('linux-x64-chromium-full.json',v=>v.desktop.close.local.framebuffer.cpuHits=0),
  ()=>mutate('linux-x64-chromium-full.json',v=>v.mobile.close.local.framebuffer.cpuHitClear=1),
  ()=>mutate('linux-x64-chromium-full.json',v=>v.canonicalWitness.p6BiologyEstablished=true),
  ()=>mutate('win32-x64-chromium-full.json',v=>v.platform='linux'),
  ()=>mutate('linux-x64-firefox.json',v=>v.status='FAIL'),
  ()=>mutate('linux-x64-chromium-full.json',v=>v.desktop.orbit.coverage.clearGuaranteedPixels=1),
  ()=>mutate('linux-x64-chromium-full.json',v=>v.repeatedNavigation=[]),
  ()=>mutate('linux-x64-chromium-full.json',v=>v.physicalAndroid='PASS'),
  ()=>fs.appendFileSync(path.join(dir,'One_File_Universe.html'),'tampered')
 ];
 for(const corrupt of failures){reset();corrupt();assert.notEqual(run().status,0,'corrupted dual-artifact evidence must fail closed');}
 console.log(JSON.stringify({status:'PASS',oracle:'DUAL_ARTIFACT_SEAL_SCHEMA_FIXTURES_ONLY',runtimeMeasurementClaim:false,corruptionsRejected:failures.length}));
}finally{fs.rmSync(dir,{recursive:true,force:true});}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const sourceCommit=process.env.OFU_SOURCE_SHA;
assert.match(sourceCommit||'',/^[0-9a-f]{40}$/,'OFU_SOURCE_SHA required');
const browser=process.env.BROWSER||'chromium';
const run=spawnSync(process.execPath,['tests/v1/browser-v1-product.mjs'],{
  cwd:root,
  env:process.env,
  encoding:'utf8',
  maxBuffer:16*1024*1024
});
if(run.stdout)process.stdout.write(run.stdout);
if(run.stderr)process.stderr.write(run.stderr);
if(run.status!==0)throw new Error(`v1 Living product journey failed with exit ${run.status}`);
const lines=String(run.stdout||'').trim().split(/\r?\n/).filter(Boolean);
let result=null;
for(let i=lines.length-1;i>=0;i--){
  try{const value=JSON.parse(lines[i]);if(value?.suite==='v1-browser-product'){result=value;break}}catch{}
}
assert(result,'v1 browser product evidence JSON missing');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'dist','rendering-build-manifest.json'),'utf8'));
assert.equal(manifest.sourceCommit,sourceCommit,'full product manifest source mismatch');
assert.equal(manifest.productVersion,'1.0.0');
assert.equal(manifest.releaseLine,'v1.0.0');
assert.equal(manifest.releaseStatus,'HISTORICAL_BASELINE');
assert.equal(manifest.candidateOnly,false);
assert.equal(manifest.worldConvergence?.developmentCandidate,false);
assert.equal(manifest.worldConvergence?.releaseVersionDeclared,true);
assert.equal(manifest.visualUniverse?.primarySceneProvider,'v1.scene.living-world');
assert.equal(manifest.runtime?.directFile,true);
assert.equal(manifest.runtime?.offline,true);
assert.equal(manifest.runtime?.networkRequired,false);
assert.equal(result.status,'PASS');
assert(result.cases>=84,'Living product journey must retain full release coverage');
assert.equal(result.directFile,true);
assert.equal(result.offline,true);
assert.equal(result.unexpectedNetworkRequests,0);
assert.equal(result.pageErrors,0);
assert.equal(result.physicalDevices,'NOT_VERIFIED');

const evidence={
  schema:'ofu-v1-living-browser-evidence-1',
  status:'PASS',
  suite:result.suite,
  sourceCommit,
  artifactSha256:manifest.artifactSha256,
  componentManifestHash:manifest.componentManifestHash,
  productVersion:manifest.productVersion,
  releaseLine:manifest.releaseLine,
  releaseStatus:manifest.releaseStatus,
  historicalBaseline:true,
  foregroundProvider:manifest.visualUniverse.primarySceneProvider,
  foregroundVersion:manifest.visualUniverse.version,
  browser:result.browser||browser,
  platform:process.platform,
  arch:process.arch,
  dpr:Number(process.env.DPR||1),
  cases:result.cases,
  selected:result.selected,
  discovery:result.discovery,
  gestures:result.gestures,
  micro:result.micro,
  sessionScale:result.sessionScale,
  mutatedScale:result.mutatedScale,
  restore:result.restore,
  mobile:result.mobile,
  saveHexChars:result.saveHexChars,
  directFile:result.directFile,
  offline:result.offline,
  unexpectedNetworkRequests:result.unexpectedNetworkRequests,
  pageErrors:result.pageErrors,
  physicalDevices:result.physicalDevices
};
const evidenceDir=path.resolve(process.env.OFU_RENDER_EVIDENCE_DIR||'dist/evidence/rendering-production');
fs.mkdirSync(evidenceDir,{recursive:true});
const out=path.join(evidenceDir,`v1-living-${process.platform}-${process.arch}-${evidence.browser}-dpr${evidence.dpr}.json`);
fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify(evidence));
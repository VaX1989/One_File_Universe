import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const artifact='dist/One_File_Universe.html';
const manifestPath='dist/rendering-build-manifest.json';
function runBuild(){
  execFileSync(process.execPath,['tools/build-ofu-rendering-v09.mjs'],{stdio:['ignore','pipe','inherit'],env:process.env});
  const bytes=fs.readFileSync(artifact);
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  return {bytes,manifest,hash:crypto.createHash('sha256').update(bytes).digest('hex')};
}
const first=runBuild(),second=runBuild();
assert.equal(Buffer.compare(first.bytes,second.bytes),0,'real shipping artifact must be byte-identical across repeated builds');
assert.equal(first.hash,second.hash,'real shipping artifact hash must be reproducible');
const html=second.bytes.toString('utf8');
const baseline=second.manifest.components||[];
const extensions=second.manifest.additiveComponents?.extensions||[];
const all=[...baseline,...extensions];
const v2x=extensions.filter(c=>String(c.id||'').includes('v2x')||String(c.owner||'').includes('v2x'));
const unreachableExecutable=extensions.filter(c=>{
  if(c.placement==='script')return !html.includes(`data-ofu-component="${c.id}"`);
  if(c.placement==='resource')return !html.includes(`id="ofu-resource-${c.id}"`);
  return false;
}).map(c=>c.id);
assert.equal(unreachableExecutable.length,0,'manifested executable/resource extension must be shipped in the artifact');
assert(v2x.length>0,'V2X additive components must be reachable from the shipping artifact');
assert.equal(second.manifest.artifactBytes,second.bytes.length,'manifest artifact byte count');
assert.equal(second.manifest.artifactSha256,second.hash,'manifest artifact hash');
console.log(JSON.stringify({status:'PASS',artifactBytes:second.bytes.length,artifactSha256:second.hash,manifestCount:all.length,frozenBaselineManifestCount:baseline.length,additiveManifestCount:extensions.length,v2xReachableCount:v2x.length,v2xReachableComponents:v2x.map(c=>c.id),unshippedExecutableComponents:unreachableExecutable,runtimeConsumerWitnesses:['tests/v2x-convergence/macrocosm-composition.mjs','tests/v2x-convergence/living-camera-authority.mjs','tests/v2x-convergence/living-domain-composition.mjs','tests/v2x-convergence/living-context-inspector.mjs','tests/v1/browser-v1-product.mjs']},null,2));

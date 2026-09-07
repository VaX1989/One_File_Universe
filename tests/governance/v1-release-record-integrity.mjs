import fs from 'node:fs';
import assert from 'node:assert/strict';

const file='docs/integration/V1_MASTER_CONVERGENCE_LEDGER.md';
const text=fs.readFileSync(file,'utf8');
const frozen={
  releaseSha:'38dd0d7c0ccc4a100dc3b75d3d159c6933bc4c16',
  releaseTree:'b7576ebe21b3448b69e35c9cd8d279f51e4332fb',
  tag:'v1.0.0',
  asset:'One_File_Universe.html',
  assetSha256:'013d4277da9acebcbb739275c27f6e05ccbc838840738cd2f9b03bb8f5def61a',
  assetBytes:'1512784',
  v1Run:'34056646768',
  renderingRun:'34056646916',
  reproductionRun:'34056646777',
};

for(const [name,value] of Object.entries(frozen)){
  assert(text.includes(value),`${file}: missing frozen published v1 identity field ${name}=${value}`);
}
for(const marker of ['MAIN_PROMOTION_PERFORMED','TAG_CREATED','RELEASE_PUBLISHED','V1_0_0_RELEASED']){
  assert(text.includes(marker),`${file}: missing completed release marker ${marker}`);
}
for(const stale of ['MAIN_PROMOTION_NOT_PERFORMED','RELEASE_NOT_PERFORMED','TAG_NOT_CREATED','PUBLICATION_NOT_PERFORMED']){
  assert(!text.includes(stale),`${file}: stale pre-release marker remains after v1.0.0 publication: ${stale}`);
}
assert(text.includes(`v1.0.0 -> ${frozen.releaseSha}`),`${file}: tag must be explicitly bound to frozen release SHA`);
assert(/Future development belongs to post-v1 branches and releases; it must not rewrite or relabel this published baseline\./.test(text),`${file}: immutable post-release boundary must remain explicit`);

console.log(JSON.stringify({status:'PASS',suite:'v1-release-record-integrity',file,frozen}));

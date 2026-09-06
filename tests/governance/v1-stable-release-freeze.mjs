import fs from 'node:fs';
import assert from 'node:assert/strict';

const workflow=fs.readFileSync('.github/workflows/v1-stable-release.yml','utf8');
const expected={
  tag:'v1.0.0',
  sha:'38dd0d7c0ccc4a100dc3b75d3d159c6933bc4c16',
  assetSha256:'013d4277da9acebcbb739275c27f6e05ccbc838840738cd2f9b03bb8f5def61a',
  assetBytes:'1512784',
};
let checks=0;
for(const [key,value] of Object.entries({
  RELEASE_TAG:expected.tag,
  V1_RELEASE_SHA:expected.sha,
  V1_RELEASE_ASSET_SHA256:expected.assetSha256,
  V1_RELEASE_ASSET_BYTES:expected.assetBytes,
})){
  assert(workflow.includes(`${key}: ${value}`)||workflow.includes(`${key}: '${value}'`),`${key} must freeze the published v1.0.0 identity`);
  checks++;
}
assert(/release-state:[\s\S]*publish_needed:[\s\S]*steps\.state\.outputs\.publish_needed/.test(workflow),'release-state must expose idempotent publication state');checks++;
assert(/test "\$TAG_SHA" = "\$V1_RELEASE_SHA"/.test(workflow),'existing stable tag must match frozen release SHA');checks++;
assert(/test "\$ASSET_DIGEST" = "sha256:\$V1_RELEASE_ASSET_SHA256"/.test(workflow),'existing stable asset digest must match frozen release digest');checks++;
assert(/test "\$ASSET_BYTES" = "\$V1_RELEASE_ASSET_BYTES"/.test(workflow),'existing stable asset size must match frozen release bytes');checks++;
assert(/test "\$SOURCE_SHA" = "\$V1_RELEASE_SHA"/.test(workflow),'new publication must be impossible from a post-v1 main head');checks++;
assert(/verify-publish:[\s\S]*needs:\s*release-state[\s\S]*publish_needed\s*==\s*'true'/.test(workflow),'publisher must run only when release-state proves publication is needed');checks++;
assert(/permissions:[\s\S]*contents:\s*read[\s\S]*verify-publish:[\s\S]*permissions:[\s\S]*contents:\s*write/.test(workflow),'write permission must be scoped to the publisher job');checks++;
assert(/pull_request:[\s\S]*v1-stable-release\.yml[\s\S]*v1-stable-release-freeze\.mjs/.test(workflow),'release policy changes must exercise the freeze oracle in pull requests');checks++;
console.log(JSON.stringify({status:'PASS',suite:'v1-stable-release-freeze',checks,expected}));

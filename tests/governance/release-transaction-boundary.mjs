import fs from 'node:fs';
import assert from 'node:assert/strict';

const file='.github/workflows/certified-preview-release.yml';
const text=fs.readFileSync(file,'utf8');

function stepIndex(source,name){
  const marker=`- name: ${name}`;
  const index=source.indexOf(marker);
  assert(index>=0,`${file}: missing step ${name}`);
  return index;
}

function segment(source,startName,endName){
  const start=stepIndex(source,startName),end=stepIndex(source,endName);
  assert(start<end,`${file}: ${startName} must precede ${endName}`);
  return source.slice(start,end);
}

function assertPreviewTransaction(source){
  const beforeDraft=segment(source,'Reconfirm exact live main immediately before draft creation','Stage draft release only');
  assert(/git ls-remote origin refs\/heads\/main/.test(beforeDraft),`${file}: draft boundary must re-read live main`);
  assert(/SOURCE_SHA/.test(beforeDraft),`${file}: draft boundary must bind live main to exact source SHA`);
  assert(/refs\/tags\/\$RELEASE_TAG/.test(beforeDraft),`${file}: draft boundary must recheck tag absence`);

  const draftVerify=segment(source,'Re-download remote draft asset and verify bytes/hash','Abort stale preview transaction if main moved');
  assert(/\.draft/.test(draftVerify)&&/\.prerelease/.test(draftVerify)&&/\.target_commitish/.test(draftVerify),`${file}: remote draft identity must be checked before publication`);
  assert(/SOURCE_SHA/.test(draftVerify),`${file}: remote draft target must remain bound to exact source SHA`);

  const abort=segment(source,'Abort stale preview transaction if main moved','Cleanup failed staged preview transaction');
  assert(/git ls-remote origin refs\/heads\/main/.test(abort),`${file}: publication boundary must re-read live main`);
  assert(/LIVE_MAIN/.test(abort)&&/SOURCE_SHA/.test(abort),`${file}: publication boundary must compare live main with exact source SHA`);

  const cleanup=segment(source,'Cleanup failed staged preview transaction','Publish only after verified draft');
  assert(/if:\s*failure\(\)/.test(cleanup),`${file}: failed staged transactions must trigger cleanup`);
  assert(/steps\.draft\.outputs\.release_id/.test(cleanup)&&/RELEASE_ID/.test(cleanup),`${file}: cleanup must target the exact staged release id`);
  assert(/releases\/\$RELEASE_ID[^\n]*-X DELETE/.test(cleanup),`${file}: cleanup must delete only the exact staged draft release`);
  assert(/\.draft/.test(cleanup)&&/\.target_commitish/.test(cleanup)&&/SOURCE_SHA/.test(cleanup),`${file}: cleanup must authenticate draft identity before deletion`);
  assert(/TAG_SHA/.test(cleanup)&&/TAG_SHA[^\n]*SOURCE_SHA|SOURCE_SHA[^\n]*TAG_SHA/.test(cleanup),`${file}: cleanup must authenticate tag ownership before deletion`);
  assert(/git\/refs\/tags\/\$RELEASE_TAG[^\n]*-X DELETE/.test(cleanup),`${file}: cleanup must remove only this transaction tag`);

  const publish=stepIndex(source,'Publish only after verified draft');
  assert(stepIndex(source,'Stage draft release only')<publish,`${file}: publication must follow draft staging`);
  assert(stepIndex(source,'Re-download remote draft asset and verify bytes/hash')<publish,`${file}: publication must follow remote readback`);
  assert(stepIndex(source,'Abort stale preview transaction if main moved')<publish,`${file}: live-main recheck must gate publication`);
  assert(stepIndex(source,'Cleanup failed staged preview transaction')<publish,`${file}: failure cleanup must be positioned before publication`);
  return true;
}

assert.equal(assertPreviewTransaction(text),true);

const reordered=text.replace(
  /([\s\S]*?)(      - name: Abort stale preview transaction if main moved[\s\S]*?)(      - name: Cleanup failed staged preview transaction)/,
  '$1$3\n$2'
);
assert.throws(()=>assertPreviewTransaction(reordered),/must precede|must gate publication/);

const noReleaseCleanup=text.replace('gh api "repos/$GITHUB_REPOSITORY/releases/$RELEASE_ID" -X DELETE','echo stale-preview-release');
assert.throws(()=>assertPreviewTransaction(noReleaseCleanup),/exact staged draft release/);

const noTagOwnership=text.replace('if test "$TAG_SHA" != "$SOURCE_SHA"; then','if false; then');
assert.throws(()=>assertPreviewTransaction(noTagOwnership),/authenticate tag ownership/);

console.log(JSON.stringify({status:'PASS',suite:'release-transaction-boundary',workflow:file,syntheticCases:3}));

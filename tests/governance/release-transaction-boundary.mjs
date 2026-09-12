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
  assert(/\.draft/.test(draftVerify)&&/\.prerelease/.test(draftVerify)&&/\.target_commitish/.test(draftVerify)&&/\.tag_name/.test(draftVerify),`${file}: remote draft identity must be checked before publication`);
  assert(/SOURCE_SHA/.test(draftVerify)&&/RELEASE_TAG/.test(draftVerify),`${file}: remote draft must remain bound to exact source and tag`);

  const abort=segment(source,'Abort stale preview transaction if main moved','Reconfirm staged release and tag ownership immediately before publication');
  assert(/git ls-remote origin refs\/heads\/main/.test(abort),`${file}: publication boundary must re-read live main`);
  assert(/LIVE_MAIN/.test(abort)&&/SOURCE_SHA/.test(abort),`${file}: publication boundary must compare live main with exact source SHA`);

  const ownership=segment(source,'Reconfirm staged release and tag ownership immediately before publication','Publish only after verified draft');
  assert(/releases\/\$RELEASE_ID/.test(ownership)&&/\.draft/.test(ownership)&&/\.target_commitish/.test(ownership)&&/\.tag_name/.test(ownership),`${file}: pre-publication boundary must re-authenticate the exact staged release`);
  assert(/if gh api "repos\/\$GITHUB_REPOSITORY\/git\/ref\/tags\/\$RELEASE_TAG"[^\n]*; then/.test(ownership),`${file}: pre-publication boundary must fail closed if the live release tag is occupied`);
  assert(/exit 1/.test(ownership),`${file}: occupied pre-publication tag must abort the transaction`);
  assert(!/TAG_OBJECT_SHA/.test(ownership),`${file}: draft publication must not require a tag object that GitHub has not created yet`);

  const publish=stepIndex(source,'Publish only after verified draft');
  const finalVerify=stepIndex(source,'Final published release, tag and asset verification');
  const cleanup=stepIndex(source,'Cleanup failed unpublished preview transaction');
  assert(stepIndex(source,'Stage draft release only')<publish,`${file}: publication must follow draft staging`);
  assert(stepIndex(source,'Re-download remote draft asset and verify bytes/hash')<publish,`${file}: publication must follow remote readback`);
  assert(stepIndex(source,'Abort stale preview transaction if main moved')<publish,`${file}: live-main recheck must gate publication`);
  assert(stepIndex(source,'Reconfirm staged release and tag ownership immediately before publication')<publish,`${file}: release/tag ownership must gate publication`);
  assert(publish<finalVerify,`${file}: final published verification must follow publication`);
  assert(finalVerify<cleanup,`${file}: terminal failure cleanup must remain after all publication verification steps`);

  const published=segment(source,'Final published release, tag and asset verification','Cleanup failed unpublished preview transaction');
  assert(/releases\/\$RELEASE_ID/.test(published)&&/\.draft/.test(published)&&/\.target_commitish/.test(published)&&/\.tag_name/.test(published),`${file}: final verification must read back published release identity`);
  assert(/git\/ref\/tags\/\$RELEASE_TAG/.test(published)&&/TAG_OBJECT_SHA/.test(published),`${file}: final verification must read back release tag ownership`);
  assert(/test "\$TAG_OBJECT_SHA" = "\$SOURCE_SHA"/.test(published),`${file}: final verification must bind the published tag to the exact source commit`);
  assert(/gh release download/.test(published)&&/sha256sum/.test(published)&&/cmp -s/.test(published),`${file}: final verification must re-download and byte-compare the published artifact`);

  const cleanupText=source.slice(cleanup);
  assert(/if:\s*failure\(\)/.test(cleanupText),`${file}: failed transactions must trigger terminal cleanup`);
  assert(/steps\.draft\.outputs\.release_id/.test(cleanupText)&&/RELEASE_ID/.test(cleanupText),`${file}: cleanup must target the exact staged release id`);
  assert(/\.draft/.test(cleanupText)&&/\.target_commitish/.test(cleanupText)&&/\.tag_name/.test(cleanupText)&&/SOURCE_SHA/.test(cleanupText),`${file}: cleanup must authenticate unpublished draft identity before deletion`);
  assert(/git\/ref\/tags\/\$RELEASE_TAG/.test(cleanupText)&&/TAG_OBJECT_SHA/.test(cleanupText),`${file}: cleanup must read exact tag ownership before deleting remote state`);
  assert(/test "\$TAG_OBJECT_SHA" != "\$SOURCE_SHA"/.test(cleanupText),`${file}: cleanup must refuse a tag no longer owned by this source`);
  assert(/releases\/\$RELEASE_ID[^\n]*-X DELETE/.test(cleanupText),`${file}: cleanup must delete only the exact staged draft release`);
  assert(/git\/refs\/tags\/\$RELEASE_TAG[^\n]*-X DELETE/.test(cleanupText),`${file}: cleanup must remove only this transaction tag`);
  return true;
}

assert.equal(assertPreviewTransaction(text),true);

const noPrePublishTagGuard=text.replace('if gh api "repos/$GITHUB_REPOSITORY/git/ref/tags/$RELEASE_TAG" >/dev/null 2>&1; then','if false; then');
assert.throws(()=>assertPreviewTransaction(noPrePublishTagGuard),/fail closed if the live release tag is occupied/);

const cleanupBeforePublish=text.replace(
  /(      - name: Publish only after verified draft[\s\S]*?      - name: Cleanup failed unpublished preview transaction)/,
  block=>{
    const marker='      - name: Cleanup failed unpublished preview transaction';
    const i=block.indexOf(marker);
    return block.slice(i)+'\n'+block.slice(0,i);
  }
);
assert.throws(()=>assertPreviewTransaction(cleanupBeforePublish),/terminal failure cleanup/);

const noReleaseCleanup=text.replace('gh api "repos/$GITHUB_REPOSITORY/releases/$RELEASE_ID" -X DELETE','echo stale-preview-release');
assert.throws(()=>assertPreviewTransaction(noReleaseCleanup),/exact staged draft release/);

const finalStart=stepIndex(text,'Final published release, tag and asset verification');
const finalEnd=stepIndex(text,'Cleanup failed unpublished preview transaction');
const finalSegment=text.slice(finalStart,finalEnd);
const weakenedFinal=finalSegment.replace('test "$TAG_OBJECT_SHA" = "$SOURCE_SHA"','test -n "$TAG_OBJECT_SHA"');
const noFinalSourceBinding=text.slice(0,finalStart)+weakenedFinal+text.slice(finalEnd);
assert.throws(()=>assertPreviewTransaction(noFinalSourceBinding),/published tag to the exact source commit/);

const stableFile='.github/workflows/v2-stable-release.yml';
const stableText=fs.readFileSync(stableFile,'utf8');
const stableStepIndex=name=>{
  const index=stableText.indexOf(`- name: ${name}`);
  assert(index>=0,`${stableFile}: missing step ${name}`);
  return index;
};
const stableOwnership=stableText.slice(
  stableStepIndex('Reconfirm staged release and tag ownership immediately before publication'),
  stableStepIndex('Publish only after verified draft')
);
assert(/releases\/\$RELEASE_ID/.test(stableOwnership)&&/\.draft/.test(stableOwnership)&&/\.target_commitish/.test(stableOwnership)&&/\.tag_name/.test(stableOwnership),`${stableFile}: pre-publication boundary must re-authenticate the exact staged release`);
assert(/if gh api "repos\/\$GITHUB_REPOSITORY\/git\/ref\/tags\/\$RELEASE_TAG"[^\n]*; then/.test(stableOwnership),`${stableFile}: pre-publication boundary must fail closed if the stable tag is occupied`);
assert(!/TAG_OBJECT_SHA/.test(stableOwnership),`${stableFile}: draft publication must not require a tag object that GitHub has not created yet`);

const stablePublished=stableText.slice(
  stableStepIndex('Final published release, tag and asset verification'),
  stableStepIndex('Cleanup failed unpublished V2 transaction')
);
assert(/git\/ref\/tags\/\$RELEASE_TAG/.test(stablePublished)&&/test "\$TAG_OBJECT_SHA" = "\$SOURCE_SHA"/.test(stablePublished),`${stableFile}: published stable tag must be bound to the exact source commit`);
assert(/gh release download/.test(stablePublished)&&/sha256sum/.test(stablePublished)&&/cmp -s/.test(stablePublished),`${stableFile}: final stable verification must re-download and byte-compare the published artifact`);

const stableCleanup=stableText.slice(stableStepIndex('Cleanup failed unpublished V2 transaction'));
assert(/steps\.draft\.outputs\.release_id/.test(stableCleanup)&&/TAG_EXISTS=false/.test(stableCleanup),`${stableFile}: cleanup must target the exact draft and tolerate GitHub's absent draft tag`);
assert(/if test -n "\$RELEASE_JSON"; then/.test(stableCleanup)&&/if test "\$TAG_EXISTS" = true; then/.test(stableCleanup),`${stableFile}: cleanup must independently remove only transaction-owned release and tag state`);

const weakenedStableOwnership=stableOwnership.replace('if gh api "repos/$GITHUB_REPOSITORY/git/ref/tags/$RELEASE_TAG" >/dev/null 2>&1; then','if false; then');
assert(!/if gh api "repos\/\$GITHUB_REPOSITORY\/git\/ref\/tags\/\$RELEASE_TAG"[^\n]*; then/.test(weakenedStableOwnership),`${stableFile}: synthetic occupied-tag guard removal must be detected`);

console.log(JSON.stringify({status:'PASS',suite:'release-transaction-boundary',workflows:[file,stableFile],syntheticCases:5}));

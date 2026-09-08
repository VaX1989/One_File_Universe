import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const evidenceRoot=path.resolve(process.env.EVIDENCE_DIR||'dist/evidence/founder-visual-quality');
const browser=process.env.BROWSER||'chromium';
const expected={v1:process.env.V1_SHA,v2:process.env.V2_SHA};
for(const [id,sha] of Object.entries(expected))assert.match(sha||'',/^[0-9a-f]{40}$/,`${id} SHA required`);
const FAMILY_DOMAINS={macro:['Universe','Galaxy','Region','Neighborhood','System','Planet','Surface','Human'],life:['Life'],civilization:['Civilization'],matter:['Matter','Molecular','Atomic']};
const shards={};
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const subject of ['v1','v2']){
  shards[subject]={};
  for(const family of Object.keys(FAMILY_DOMAINS)){
    const file=path.join(evidenceRoot,`shard-${family}-${subject}-${browser}.json`);
    assert(fs.existsSync(file),`missing shard ${file}`);
    const shard=JSON.parse(fs.readFileSync(file,'utf8'));
    assert.equal(shard.schema,'ofu-founder-visual-browser-shard-3',`${subject}/${family}: wrong schema`);
    assert.equal(shard.status,'SHARD_CAPTURE_COMPLETE',`${subject}/${family}: incomplete shard`);
    assert.equal(shard.subject,subject,`${subject}/${family}: subject mismatch`);
    assert.equal(shard.family,family,`${subject}/${family}: family mismatch`);
    assert.equal(shard.sourceSha,expected[subject],`${subject}/${family}: source SHA mismatch`);
    assert.deepEqual(shard.pageErrors,[],`${subject}/${family}: page errors present`);
    assert.deepEqual(shard.unexpectedNetworkRequests,[],`${subject}/${family}: network requests present`);
    shards[subject][family]=shard;
  }
  const identities=Object.values(shards[subject]).map(x=>`${x.artifactSha256}:${x.artifactBytes}`);
  assert.equal(new Set(identities).size,1,`${subject}: artifact identity drift across shards`);
}
const matrix=[];
for(const [family,domains] of Object.entries(FAMILY_DOMAINS))for(const domain of domains){
  const row={domain,family};
  for(const subject of ['v1','v2']){
    const shard=shards[subject][family];
    const forward=shard.records.find(x=>x.domain===domain&&x.direction==='forward'&&x.screenshot&&x.status==='PROVEN');
    const reverse=shard.records.find(x=>x.domain===domain&&x.direction==='reverse'&&x.status==='PROVEN');
    assert(forward,`${subject}/${domain}: forward screenshot missing`);assert(reverse,`${subject}/${domain}: reverse proof missing`);
    const screenshotPath=path.join(evidenceRoot,subject,browser,forward.screenshot);
    assert(fs.existsSync(screenshotPath),`${subject}/${domain}: screenshot file missing`);
    row[subject]={forwardStage:forward.stage,reverseStage:reverse.stage,screenshot:forward.screenshot,screenshotSha256:sha256(screenshotPath),renderReadyRevision:forward.render?.readyRevision??null,runtimeRevision:forward.revision??null};
    assert.equal(row[subject].renderReadyRevision,row[subject].runtimeRevision,`${subject}/${domain}: screenshot not renderer-settled`);
  }
  row.classification='NOT_VERIFIED';row.classificationAuthority='HUMAN_FOUNDER_REVIEW_REQUIRED';matrix.push(row);
}
assert.equal(matrix.length,13,'all 13 founder domains must aggregate');
const summary={schema:'ofu-founder-visual-differential-3',status:'CAPTURE_COMPLETE_CLASSIFICATION_PENDING',browser,loadMode:'EXACT_BYTES_SET_CONTENT',v1:{sha:expected.v1,artifactSha256:shards.v1.macro.artifactSha256,artifactBytes:shards.v1.macro.artifactBytes},v2:{sha:expected.v2,artifactSha256:shards.v2.macro.artifactSha256,artifactBytes:shards.v2.macro.artifactBytes},matrix,acceptanceLaw:'Every founder-visible targeted domain below MATERIAL_IMPROVEMENT remains an open defect. Automated pixel difference is not promoted to qualitative improvement.',createdAt:new Date().toISOString()};
fs.writeFileSync(path.join(evidenceRoot,`differential-${browser}.json`),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({schema:summary.schema,status:summary.status,browser,domains:matrix.length,v1:summary.v1,v2:summary.v2}));

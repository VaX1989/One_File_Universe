import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const sourceSha=process.env.OFU_SOURCE_SHA;
assert.match(sourceSha||'',/^[0-9a-f]{40}$/,'PRODUCT-AUDIO browser proof requires exact source SHA');

function run(args,{maxBuffer=64*1024*1024,timeout=240000}={}){
  const r=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer,timeout,env:{...process.env,OFU_SOURCE_SHA:sourceSha}});
  if(r.status!==0)throw new Error('node '+args.join(' ')+' failed\n'+(r.stdout||'')+'\n'+(r.stderr||''));
  return r.stdout;
}

run(['tools/build-ofu-rendering-v09.mjs']);
const manifest=JSON.parse(fs.readFileSync('dist/rendering-build-manifest.json','utf8'));
assert.equal(manifest.sourceCommit,sourceSha,'audio browser proof must consume exact-head artifact');
const html=fs.readFileSync('dist/One_File_Universe.html','utf8');
assert.doesNotMatch(html,/(?:src|href)=["']https?:\/\//i,'single-file audio product must not require network assets');
for(const id of ['v2x14.audio.living-context','v2x14.audio.controller'])
  assert(manifest.additiveComponents?.extensions?.some(x=>x.id===id),'built artifact missing '+id);

const out=run(['tests/v2x-14-product-experience/browser-journey.mjs']);
const last=out.trim().split(/\r?\n/).filter(Boolean).at(-1);
const evidence=JSON.parse(last);
assert.equal(evidence.status,'PASS');
assert.equal(evidence.exactSourceSha,sourceSha);
assert.equal(evidence.directFile,true);
assert.equal(evidence.zeroMandatoryNetwork,true);
assert.equal(evidence.authority,'PRESENTATION_ONLY');
assert.equal(evidence.systemicAudioUserGesture,true);
assert.equal(evidence.unsupportedAudioGraceful,true);
assert.equal(evidence.desktop.audioUserActivation,true);
assert.equal(evidence.desktop.audioMuteAfterActivation,true);
assert.equal(evidence.mobile.audioUserActivation,true);
assert.equal(evidence.mobile.audioMuteAfterActivation,true);
assert.equal(evidence.physicalDeviceEvidence,'NOT_VERIFIED');

const result={
  schema:'ofu-product-audio-browser-evidence-v1',
  prompt_id:'PRODUCT-AUDIO',
  status:'PASS',
  source_commit:sourceSha,
  direct_file:true,
  zero_mandatory_network:true,
  authority:'PRESENTATION_ONLY',
  desktop_user_activation:true,
  mobile_user_activation:true,
  mute:true,
  reduced_motion:true,
  unsupported_audio_graceful:true,
  physical_device_evidence:'NOT_VERIFIED'
};
fs.mkdirSync('dist/evidence/product',{recursive:true});
fs.writeFileSync('dist/evidence/product/product-audio-browser.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));

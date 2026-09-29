import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const read=p=>fs.readFileSync(p,'utf8');
function runNode(path){
  const r=spawnSync(process.execPath,[path],{encoding:'utf8',maxBuffer:16*1024*1024,env:{...process.env,OFU_SOURCE_SHA:process.env.OFU_SOURCE_SHA||'LOCAL-UNPINNED'}});
  if(r.status!==0)throw new Error(path+' failed\n'+(r.stdout||'')+'\n'+(r.stderr||''));
  assert.match(r.stdout,/PASS|"status":"PASS"/i,path+' must emit PASS evidence');
  return r.stdout.trim().split(/\r?\n/).at(-1);
}

const context=read('src/audio/v2x14/living-audio-context.js');
const controller=read('src/audio/v2x14/audio-controller.js');
const descriptor=JSON.parse(read('config/components/v2x-14-systemic-audio.json'));
const browser=read('tests/v2x-14-product-experience/browser-journey.mjs');
const resource=read('tests/v2x-14-product-experience/audio-resource-contract.mjs');

assert.match(context,/AUTHORITY='PRESENTATION_ONLY'/);
assert.match(controller,/AUTHORITY='PRESENTATION_ONLY'/);
assert.equal(descriptor.components.every(x=>x.authority==='PRESENTATION_ONLY'),true);
assert.doesNotMatch(context+'\n'+controller,/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|https?:\/\//,'PRODUCT-AUDIO must remain offline and package-local');
assert.match(context,/unknownAtmosphereAudible:false/);
assert.match(context,/literalVacuumSound:false/);
assert.match(context,/approachDiegeticAudio:false/);
assert.match(context,/microCrossDomainAudioSuppressed:true/);
assert.match(controller,/userActivationRequired:true/);
assert.match(controller,/navigationDependency:false/);
assert.match(controller,/accessibilityDependency:false/);
assert.match(controller,/serializedControlUpdates:true/);
assert.match(controller,/deduplicatesControlUpdates:true/);
assert.match(controller,/POLL_INTERVAL_MS=600/);
assert.match(resource,/maxConcurrentPollTimers,1/);
assert.match(resource,/audio-off mount must not poll/);
assert.match(browser,/AudioContext must remain uncreated before user activation/);
assert.match(browser,/reducedMotion:'reduce'/);
assert.match(browser,/audioUserActivation:true/);
assert.match(browser,/audioMuteAfterActivation:true/);
assert.match(browser,/unsupportedAudioGraceful:true/);
assert.match(browser,/requests\.length,0/);

const contractsEvidence=runNode('tests/v2x-14-product-experience/contracts.mjs');
const resourceEvidence=runNode('tests/v2x-14-product-experience/audio-resource-contract.mjs');

const evidence={
  schema:'ofu-product-audio-focused-evidence-v1',
  prompt_id:'PRODUCT-AUDIO',
  status:'PASS',
  source_commit:process.env.OFU_SOURCE_SHA||'LOCAL-UNPINNED',
  authority:'PRESENTATION_ONLY',
  offline:true,
  optional_user_activation:true,
  unknown_atmosphere_silent:true,
  literal_vacuum_sound:false,
  micro_cross_domain_suppressed:true,
  serialized_controls:true,
  visibility_suspend_and_dispose_covered:true,
  idle_polling:false,
  max_concurrent_poll_timers:1,
  browser_oracle_contract_present:true,
  browser_direct_file_zero_network_oracle_present:true,
  node_contract_evidence:contractsEvidence,
  resource_evidence:resourceEvidence
};
fs.mkdirSync('dist/evidence/product',{recursive:true});
fs.writeFileSync('dist/evidence/product/product-audio.json',JSON.stringify(evidence,null,2)+'\n');
console.log('PRODUCT-AUDIO focused authority/resource/offline contract: PASS');
console.log(JSON.stringify(evidence));

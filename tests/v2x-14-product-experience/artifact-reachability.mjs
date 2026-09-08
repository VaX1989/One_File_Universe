import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const sourceSha=process.env.OFU_SOURCE_SHA;if(!sourceSha)throw new Error('OFU_SOURCE_SHA required');
const manifest=JSON.parse(fs.readFileSync('dist/rendering-build-manifest.json','utf8')),artifact=fs.readFileSync('dist/One_File_Universe.html'),html=artifact.toString('utf8');
assert.equal(manifest.sourceCommit,sourceSha,'manifest must authenticate exact lane head');
assert.equal(manifest.artifactBytes,artifact.length,'manifest byte count must match real artifact');
assert.equal(manifest.artifactSha256,crypto.createHash('sha256').update(artifact).digest('hex'),'manifest hash must match real artifact');
const extensions=manifest.additiveComponents?.extensions||[],ids=['v2x14.product.discovery','v2x14.product.experience','v2x14.product.style','v2x14.audio.living-context','v2x14.audio.controller'];
for(const id of ids){const c=extensions.find(x=>x.id===id);assert(c,'manifest missing '+id);if(c.placement==='script')assert(html.includes(`data-ofu-component="${id}"`),'script not embedded: '+id);}
for(const marker of ['ofu-v2x14-direct-manipulation-observer-1','data-v2x14-input-owner','touch-action:none','overscroll-behavior:contain','maxConcurrentPollTimers','POLL_INTERVAL_MS'])assert(html.includes(marker),'built artifact lacks new V2X-14 runtime marker '+marker);
for(const forbidden of ['v2x14-skip-link','v2x14-live-location','v2x14-context','v2x14-discovery'])assert(!html.includes(`id="${forbidden}"`),'duplicate Living chrome reached artifact: '+forbidden);
console.log(JSON.stringify({schema:'ofu-v2x14-artifact-reachability-1',status:'PASS',sourceSha,artifactBytes:artifact.length,artifactSha256:manifest.artifactSha256,manifestedComponents:ids,consumer:'v1LivingProduct + living-view',directManipulationMarker:true,audioBoundMarker:true,duplicateLivingChrome:false}));

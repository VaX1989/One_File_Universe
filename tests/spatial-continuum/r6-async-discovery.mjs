import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root=process.cwd(),artifact=path.join(root,'dist','One_File_Universe_Spatial_Continuum.html'),evidenceDir=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','spatial-continuum-r6','async-discovery'));
fs.mkdirSync(evidenceDir,{recursive:true});
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(String(error.stack||error)));
page.on('console',message=>{if(message.type()==='error')errors.push('console: '+message.text())});

try{
  await page.goto(pathToFileURL(artifact).href,{waitUntil:'load'});
  await page.waitForFunction(()=>globalThis.__OFU_SPATIAL_CONTINUUM__?.snapshot?.().status==='READY',undefined,{timeout:120000});
  const initial=await page.evaluate(()=>{const snapshot=__OFU_SPATIAL_CONTINUUM__.snapshot();globalThis.__R6_HEARTBEATS__=0;globalThis.__R6_HEARTBEAT_TIMER__=setInterval(()=>globalThis.__R6_HEARTBEATS__++,1);return{windowKey:snapshot.openUniverse.galaxyStreaming.activeWindowKey,ids:snapshot.openUniverse.catalogue.map(item=>item.id),revision:snapshot.openUniverse.revision,frameSamples:snapshot.performance.samples}});
  const [initialX,initialY,initialZ]=initial.windowKey.split(',').map(BigInt),firstWindowKey=`${initialX+1n},${initialY},${initialZ}`,latestWindowKey=`${initialX+1n},${initialY+1n},${initialZ}`;

  const afterFirstRequest=await page.evaluate(()=>{const api=__OFU_SPATIAL_CONTINUUM__;globalThis.__R6_FIRST_DISCOVERY__=api.exploreGalaxyField('positiveX');const snapshot=api.snapshot();return{activeWindowKey:snapshot.openUniverse.galaxyStreaming.activeWindowKey,discovery:snapshot.openUniverse.galaxyStreaming.discovery,frameSamples:snapshot.performance.samples}});
  assert.equal(afterFirstRequest.activeWindowKey,initial.windowKey,'request admission must retain the committed visible field');
  assert.equal(afterFirstRequest.discovery.state,'DISCOVERING');
  assert.equal(afterFirstRequest.discovery.pending.windowKey,firstWindowKey);

  await page.waitForTimeout(8);
  const afterSupersession=await page.evaluate(()=>{const api=__OFU_SPATIAL_CONTINUUM__;globalThis.__R6_SECOND_DISCOVERY__=api.exploreGalaxyField('positiveY');const snapshot=api.snapshot();return{activeWindowKey:snapshot.openUniverse.galaxyStreaming.activeWindowKey,discovery:snapshot.openUniverse.galaxyStreaming.discovery,frameSamples:snapshot.performance.samples,heartbeats:globalThis.__R6_HEARTBEATS__}});
  assert.equal(afterSupersession.activeWindowKey,initial.windowKey,'supersession must not expose a partial window');
  assert.equal(afterSupersession.discovery.pending.windowKey,latestWindowKey,'successive movement intent must compose from the pending target');
  assert.ok(afterSupersession.heartbeats>0,'the event loop must yield before a newer intent supersedes discovery');

  const completed=await page.evaluate(async()=>{const [firstResult,secondResult]=await Promise.all([globalThis.__R6_FIRST_DISCOVERY__,globalThis.__R6_SECOND_DISCOVERY__]),summarize=result=>({requestId:result.requestId,status:result.status,reason:result.reason||null,probes:result.probes,slices:result.slices,items:result.items.length,window:result.window,durationMs:result.durationMs??null}),snapshot=__OFU_SPATIAL_CONTINUUM__.snapshot(),heartbeats=globalThis.__R6_HEARTBEATS__;clearInterval(globalThis.__R6_HEARTBEAT_TIMER__);return{first:summarize(firstResult),second:summarize(secondResult),heartbeats,frameSamples:snapshot.performance.samples,activeWindowKey:snapshot.openUniverse.galaxyStreaming.activeWindowKey,ids:snapshot.openUniverse.catalogue.map(item=>item.id),discovery:snapshot.openUniverse.galaxyStreaming.discovery,network:snapshot.runtimeNetworkResources,transitionLog:snapshot.transitionLog.filter(item=>item.type.startsWith('GALAXY_WINDOW_DISCOVERY')||item.type==='GALAXY_WINDOW_STREAM').slice(-8)}});
  assert.equal(completed.first.status,'CANCELLED','superseded work must resolve as cancelled');
  assert.equal(completed.second.status,'COMPLETED','the latest user intent must complete');
  assert.equal(completed.activeWindowKey,latestWindowKey,'only the latest target may become visible');
  assert.ok(completed.second.slices>1,'real discovery must cooperatively span multiple bounded slices');
  assert.ok(completed.heartbeats>1,'the browser event loop must remain responsive during discovery');
  assert.ok(completed.frameSamples>initial.frameSamples,'the visible scene must continue rendering while discovery is pending');
  assert.equal(completed.discovery.state,'IDLE');
  assert.equal(completed.discovery.scheduler.bounded,true);
  assert.equal(completed.discovery.scheduler.probesPerSlice,32);
  assert.ok(completed.discovery.cancellations>=1);
  assert.equal(completed.discovery.staleResults,0);
  assert.equal(completed.network,0);

  const explicitCancellation=await page.evaluate(async()=>{const api=__OFU_SPATIAL_CONTINUUM__,before=api.snapshot().openUniverse.galaxyStreaming.activeWindowKey;const pending=api.exploreGalaxyField('positiveZ');api.back();const result=await pending,snapshot=api.snapshot();return{before,result,after:snapshot.openUniverse.galaxyStreaming.activeWindowKey,state:snapshot.openUniverse.galaxyStreaming.discovery.state}});
  assert.equal(explicitCancellation.result.status,'CANCELLED','back navigation must cancel obsolete discovery');
  assert.equal(explicitCancellation.after,explicitCancellation.before,'cancelled discovery must not mutate the active field');
  assert.equal(explicitCancellation.state,'IDLE');
  assert.deepEqual(errors,[]);

  const output={status:'PASS',suite:'spatial-continuum-r6-async-discovery',initial,afterFirstRequest,afterSupersession,completed,explicitCancellation},serialize=value=>JSON.stringify(value,(_key,item)=>typeof item==='bigint'?String(item):item,2);
  fs.writeFileSync(path.join(evidenceDir,'async-discovery.json'),serialize(output)+'\n');
  await page.screenshot({path:path.join(evidenceDir,'settled-latest-field.png'),fullPage:true});
  console.log(serialize(output));
}finally{
  await context.close();
  await browser.close();
}

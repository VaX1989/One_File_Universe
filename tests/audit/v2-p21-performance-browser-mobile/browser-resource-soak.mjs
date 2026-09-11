import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import os from 'node:os';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium,firefox,webkit} from 'playwright';
import {immutableBrowserArtifact} from '../../helpers/immutable-browser-artifact.mjs';

const SOURCE=process.env.OFU_SOURCE_SHA;
if(!SOURCE)throw new Error('OFU_SOURCE_SHA required');
const immutableInput=immutableBrowserArtifact({consumer:'p21-resource-soak'});
const manifest=immutableInput.manifest;
assert.equal(manifest.sourceCommit,SOURCE,'shipping manifest must identify the exact audit SHA');
const DEFAULT_PRODUCT=pathToFileURL(immutableInput.artifactPath).href;
const PRODUCT=process.env.P21_PRODUCT_URL||DEFAULT_PRODUCT;
const PRODUCT_TRANSPORT=process.env.P21_PRODUCT_URL?'DIAGNOSTIC_HTTP_OVERRIDE':'IMMUTABLE_EXACT_SHIPPING_FILE_URL';
const OUT=path.resolve('dist/evidence/v2-p21-performance-browser-mobile');
fs.mkdirSync(OUT,{recursive:true});
const ENGINES={chromium,firefox,webkit};
const CYCLES=Number(process.env.P21_CYCLES||12);
assert.ok(Number.isInteger(CYCLES)&&CYCLES>=8&&CYCLES<=40,'P21_CYCLES must be 8..40');

async function openOfflineProduct(page){
 const startupConsole=[];
 const onConsole=message=>{if(message.type()==='error')startupConsole.push(message.text().slice(0,1600))};
 page.on('console',onConsole);
 try{
  // WebKit's offline transport rejects file: navigation itself. Block external
  // traffic before opening the file, then exercise the loaded product offline.
  await page.context().route(/^https?:\/\//,route=>route.abort('internetdisconnected'));
  await page.goto(PRODUCT,{waitUntil:'load'});
  try{
   await page.waitForFunction(()=>globalThis.OFU?.v1LivingProduct?.snapshot?.().initialized,undefined,{timeout:60000});
  }catch(error){
   let startupState=null;
   try{
    startupState=await page.evaluate(()=>({
     readyState:document.readyState,
     livingProduct:!!globalThis.OFU?.v1LivingProduct,
     livingRuntime:!!globalThis.OFU?.v1LivingRuntime,
     livingRenderer:!!globalThis.OFU?.v1LivingRenderer,
     planetPreview:!!globalThis.__OFU_PLANET_PREVIEW__,
     planetContext:!!globalThis.__OFU_PLANET_PREVIEW__?.ctx,
     chosenKey:!!globalThis.__OFU_PLANET_PREVIEW__?.chosen?.key,
     explorePanel:!!document.querySelector('[data-workspace-panel="explore"]'),
     livingPanel:!!document.getElementById('living-panel'),
     livingStage:!!document.getElementById('living-stage'),
     livingError:document.querySelector('.living-error')?.textContent||null
    }));
   }catch(snapshotError){startupState={diagnosticError:String(snapshotError?.message||snapshotError)}}
   const diagnostic=`startupConsole=${JSON.stringify(startupConsole)} startupState=${JSON.stringify(startupState)}`;
   console.error('P21_BOOT_DIAGNOSTICS',diagnostic);
   error.message=`${error.message} | ${diagnostic}`;
   throw error;
  }
  await page.context().setOffline(true);
  assert.equal(await page.evaluate(()=>navigator.onLine),false,'product journey must run offline');
 }finally{page.off('console',onConsole)}
}

function executableCandidates(name){
 if(process.platform!=='linux')return [];
 const roots=[process.env.PLAYWRIGHT_BROWSERS_PATH,path.join(os.homedir(),'.cache','ms-playwright')].filter(Boolean);
 const prefixes=name==='chromium'?['chromium_headless_shell-','chromium-']:name==='firefox'?['firefox-']:['webkit-'];
 const tails=name==='chromium'?['chrome-linux/headless_shell','chrome-linux/chrome','chrome-linux64/chrome']:name==='firefox'?['firefox/firefox']:['pw_run.sh'];
 const out=[];
 for(const root of new Set(roots)){
  if(!fs.existsSync(root))continue;
  for(const dir of fs.readdirSync(root).filter(x=>prefixes.some(p=>x.startsWith(p))).sort().reverse())for(const tail of tails)out.push(path.join(root,dir,tail));
 }
 return out.filter(x=>{try{fs.accessSync(x,fs.constants.X_OK);return true}catch{return false}});
}
function launchOptions(name,executablePath=null){
 const options={headless:true};
 // Use each pinned Playwright runtime's governed default graphics backend.
 // Version-specific ANGLE overrides can disable WebGL2 even when that same
 // runtime exposes it under its default launch profile.
 if(executablePath)options.executablePath=executablePath;
 return options;
}
async function launchEngine(name,engine){
 try{
  const browser=await engine.launch(launchOptions(name));
  return {browser,launcher:{status:'PLAYWRIGHT_EXPECTED_EXECUTABLE',governedExpectedExecutable:true,executable:engine.executablePath(),version:browser.version()}};
 }catch(error){
  const original=String(error?.message||error);
  if(!/Executable doesn't exist|executable.*not found|Failed to launch/i.test(original))throw error;
  const attempted=[];
  for(const executablePath of executableCandidates(name)){
   attempted.push(executablePath);
   try{
    const browser=await engine.launch(launchOptions(name,executablePath));
    return {browser,launcher:{status:'PINNED_LINUX_CACHE_EXECUTABLE_FALLBACK',governedExpectedExecutable:false,infrastructureVariance:'PLAYWRIGHT_CACHE_REVISION_SKEW',expected:engine.executablePath(),executable:executablePath,version:browser.version(),originalError:original.slice(0,600)}};
   }catch{}
  }
  throw new Error(`${name} browser runtime unavailable after bounded pinned-cache fallback; expected=${engine.executablePath()} candidates=${JSON.stringify(attempted)} original=${original.slice(0,1200)}`);
 }
}
async function framePacing(page){
 return page.evaluate(async()=>{
  const samples=[];let last=performance.now();
  await new Promise(resolve=>{let left=90;const tick=now=>{samples.push(now-last);last=now;if(--left<=0)resolve();else requestAnimationFrame(tick)};requestAnimationFrame(tick)});
  const sorted=[...samples].sort((a,b)=>a-b),pick=q=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*q))]||0;
  return {status:'MEASURED_RAF_INTERVALS',samples:samples.length,p50Ms:pick(.5),p95Ms:pick(.95),maxMs:Math.max(0,...samples),over50ms:samples.filter(x=>x>50).length};
 });
}
function slope(values){
 if(values.length<2)return null;
 const n=values.length,xb=(n-1)/2,yb=values.reduce((a,b)=>a+b,0)/n;
 let num=0,den=0;
 for(let i=0;i<n;i++){num+=(i-xb)*(values[i]-yb);den+=(i-xb)**2}
 return den?num/den:0;
}
function nondecreasing(values){return values.length>2&&values.every((v,i)=>i===0||v>=values[i-1])&&values.at(-1)>values[0]}
function plateau(values,tolerance){if(values.length<4)return true;const warm=values.slice(Math.floor(values.length/2));return Math.max(...warm)-Math.min(...warm)<=tolerance}
function range(values){return values.length?Math.max(...values)-Math.min(...values):0}

async function instrument(context){
 await context.addInitScript(()=>{
  const stats={listenerRegistrations:0,listenerRemovals:0,deadTargetObservations:0};
  const proto=EventTarget.prototype,add=proto.addEventListener,remove=proto.removeEventListener;
  const registry=new WeakMap(),records=new Set(),hasWeakRef=typeof WeakRef==='function';
  const capture=o=>typeof o==='boolean'?o:!!o?.capture;
  const retire=record=>{if(record?.live){record.live=false;records.delete(record);stats.listenerRemovals++}};
  const forgetRecord=(target,type,record)=>{const m=registry.get(target),a=m?.get(type),i=a?.findIndex(x=>x.record===record)??-1;if(i>=0){a.splice(i,1);retire(record)}};
  const forget=(target,type,entry)=>forgetRecord(target,type,entry.record);
  proto.addEventListener=function(type,listener,opts){
   if(!listener)return add.call(this,type,listener,opts);
   let m=registry.get(this);if(!m){m=new Map();registry.set(this,m)}let a=m.get(type);if(!a){a=[];m.set(type,a)}const c=capture(opts);
   if(a.some(x=>x.listener===listener&&x.capture===c))return undefined;
   const signal=typeof opts==='object'?opts?.signal:null;
   if(signal?.aborted)return add.call(this,type,listener,opts);
   const record={live:true,targetRef:hasWeakRef?new WeakRef(this):null,signalRef:signal&&hasWeakRef?new WeakRef(signal):null},once=!!(typeof opts==='object'&&opts?.once),entry={listener,capture:c,wrapped:listener,record};
   if(once){entry.wrapped=typeof listener==='function'?function(...args){forget(this,type,entry);return listener.apply(this,args)}:{handleEvent(event){forget(event.currentTarget,type,entry);return listener.handleEvent(event)}};}
   a.push(entry);records.add(record);stats.listenerRegistrations++;
   if(signal&&typeof signal.addEventListener==='function'){const targetRef=record.targetRef;add.call(signal,'abort',()=>{const target=targetRef?.deref?.();if(target)forgetRecord(target,type,record);else retire(record)},{once:true})}
   return add.call(this,type,entry.wrapped,opts);
  };
  proto.removeEventListener=function(type,listener,opts){
   const m=registry.get(this),a=m?.get(type),c=capture(opts),entry=a?.find(x=>x.listener===listener&&x.capture===c);if(entry){forget(this,type,entry);return remove.call(this,type,entry.wrapped,opts)}
   return remove.call(this,type,listener,opts);
  };
  const listenerSnapshot=()=>{
   if(!hasWeakRef)return{status:'NOT_MEASURABLE_WEAKREF_UNAVAILABLE',connectedOrGlobal:null,tracked:null,globalTargets:null,connectedDom:null,detachedDom:null,nonDom:null};
   let connectedOrGlobal=0,tracked=0,globalTargets=0,connectedDom=0,detachedDom=0,nonDom=0,dead=0;
   for(const record of [...records]){
    if(!record.live){records.delete(record);continue}
    if(record.signalRef?.deref?.()?.aborted){retire(record);continue}
    const target=record.targetRef.deref();
    if(!target){records.delete(record);record.live=false;dead++;continue}
    tracked++;
    const isGlobal=target===globalThis||target===document;
    const isDom=typeof Node==='function'&&target instanceof Node;
    const isConnectedDom=isDom&&target.isConnected;
    if(isGlobal)globalTargets++;
    else if(isConnectedDom)connectedDom++;
    else if(isDom)detachedDom++;
    else nonDom++;
    if(isGlobal||isConnectedDom)connectedOrGlobal++;
   }
   stats.deadTargetObservations+=dead;
   return{status:'MEASURED_TEST_INSTRUMENTED_CONNECTED_OR_GLOBAL',connectedOrGlobal,tracked,globalTargets,connectedDom,detachedDom,nonDom,deadTargetObservations:stats.deadTargetObservations};
  };
  const longTasks=[];
  let longTaskSupport=false;
  try{if(globalThis.PerformanceObserver?.supportedEntryTypes?.includes('longtask')){longTaskSupport=true;new PerformanceObserver(list=>{for(const e of list.getEntries())longTasks.push({startTime:e.startTime,duration:e.duration})}).observe({type:'longtask',buffered:true})}}catch{}
  globalThis.__OFU_P21_AUDIT__={stats,listenerSnapshot,longTasks,longTaskSupport};
 });
}

function trackWorkers(page){
 const state={live:0,created:0,closed:0};
 page.on('worker',worker=>{state.live++;state.created++;let open=true;worker.on('close',()=>{if(open){open=false;state.live=Math.max(0,state.live-1);state.closed++}})});
 return state;
}

async function ready(page){
 await page.waitForFunction(()=>globalThis.OFU?.v1Experience?.snapshot?.().initialized&&globalThis.OFU?.v1Session&&globalThis.OFU?.v1LivingProduct?.snapshot?.().initialized&&globalThis.OFU?.productUI&&globalThis.OFU?.waveIVScaleRuntime,{timeout:30000});
}
async function openExplore(page){await page.evaluate(()=>OFU.productUI.workspace('explore',{focus:false,announceChange:false}));await page.waitForFunction(()=>{const p=document.querySelector('[data-workspace-panel="explore"]');return !!p&&!p.hidden})}
async function waitStage(page,stage){await page.waitForFunction(s=>globalThis.OFU?.v1LivingProduct?.runtime?.snapshot?.().stage===s,stage,{timeout:15000})}
async function clickScale(page,id){await openExplore(page);const x=page.locator(`[data-living-scale="${id}"]:visible`).first();await x.waitFor({state:'visible',timeout:7000});await x.click();await waitStage(page,id)}
async function clickFirstEntity(page){await openExplore(page);const x=page.locator('#living-panel [data-living-entity]:visible').first();await x.waitFor({state:'visible',timeout:7000});await x.click()}
async function clickAction(page,id){await openExplore(page);const x=page.locator(`#living-panel [data-living-action="${id}"]:visible`).first();await x.waitFor({state:'visible',timeout:7000});await x.click()}

async function seedToHuman(page){
 await clickScale(page,'UNIVERSE');
 await clickFirstEntity(page);await waitStage(page,'GALAXY');
 await clickFirstEntity(page);await waitStage(page,'REGION');
 await clickAction(page,'deeper');await waitStage(page,'NEIGHBORHOOD');
 await clickFirstEntity(page);await waitStage(page,'SYSTEM');
 await openExplore(page);await page.locator('#living-panel #living-search-goal:visible').selectOption('BIOSPHERE');await clickAction(page,'survey');
 await page.waitForFunction(()=>{const s=OFU.v1LivingProduct.snapshot().search;return !s.running&&s.results>0},undefined,{timeout:60000});
 await page.locator('#living-panel #living-search-results .living-choice:visible').first().click();
 await page.waitForFunction(()=>OFU.v1LivingProduct.runtime.snapshot().world?.biology?.occupancy?.state==='MODELED_BIOSPHERE',undefined,{timeout:30000});
 await clickScale(page,'HUMAN');
 const material=await page.evaluate(()=>OFU.v1LivingProduct.runtime.snapshot().rows.find(x=>!['SETTLEMENT','RUIN'].includes(x.kind))?.entityId||null);
 assert.ok(material,'audit requires inspectable Living material/object');
 await page.locator(`#living-panel [data-living-entity="${material}"]:visible`).first().click();
 return material;
}

async function sample(page,cycle,workerAudit){
 const snapshot=await page.evaluate(cycle=>{
  const p=globalThis.__OFU_PLANET_PREVIEW__?.snapshot?.()||null,v=OFU.v1Providers?.snapshot?.()||{},s=OFU.v1Session.snapshot(),l=OFU.v1LivingProduct.runtime.snapshot(),r=OFU.v1LivingProduct.renderer.state(),a=globalThis.__OFU_P21_AUDIT__,listenerState=a?.listenerSnapshot?.()||null;
  const audio=globalThis.__OFU_V2X14_AUDIO__?.snapshot?.()||OFU.v2x14LivingAudioController?.instance?.()?.snapshot?.()||null;
  return {cycle,stage:l.stage,history:l.historyDepth,historyLimit:l.maxHistory,discoveryCache:l.discoveryCacheEntries,discoveryCacheLimit:l.discoveryCacheLimit,providerCache:v.cacheEntries??null,providerCacheLimit:v.cacheLimit??null,domNodes:document.querySelectorAll('*').length,canvasCount:document.querySelectorAll('canvas').length,audioElements:document.querySelectorAll('audio').length,audioRuntime:audio?.runtime?{state:audio.runtime.state,contextCount:audio.runtime.contextCount,contextCreations:audio.runtime.contextCreations,liveNodes:audio.runtime.liveNodes,peakLiveNodes:audio.runtime.peakLiveNodes,limits:audio.runtime.limits}:null,listeners:listenerState?.connectedOrGlobal??null,listenerState,longTasks:a?.longTasks.length??null,longTaskSupport:a?.longTaskSupport??false,heap:performance.memory?.usedJSHeapSize??null,sessionBytes:OFU.v1Session.exportBytes().length,canonicalMutation:s.canonicalMutation,canonicalP6Mutation:s.canonicalP6Mutation,working:p?.workingSet||null,gpu:p?.gpu||null,renderer:r};
 },cycle);
 return {...snapshot,workers:workerAudit.live,createdWorkers:workerAudit.created,closedWorkers:workerAudit.closed};
}

async function contextRecovery(page){
 await page.evaluate(()=>OFU.v1LivingProduct.runtime.scale('APPROACH'));await waitStage(page,'APPROACH');
 await page.waitForFunction(()=>{const p=OFU.v1LivingProduct,s=p.runtime.snapshot(),r=p.snapshot();return s.stage==='APPROACH'&&r.uiError===null&&r.render.readyRevision===s.revision},undefined,{timeout:30000});
 const result=await page.evaluate(async()=>{
  const product=OFU.v1LivingProduct,canvas=document.getElementById('living-gl'),gl=canvas?.getContext?.('webgl2'),ext=gl?.getExtension?.('WEBGL_lose_context');
  if(!gl)return{status:'NOT_MEASURABLE_BACKEND_NOT_WEBGL2'};
  if(!ext)return{status:'NOT_MEASURABLE_EXTENSION_UNAVAILABLE'};
  const runtime=()=>{const s=product.runtime.snapshot();return{revision:s.revision,stage:s.stage,semanticScale:s.semanticScale,world:s.world?.planetIdentity||null,body:s.body?.canonicalId||s.body?.entityId||null,historyDepth:s.historyDepth}};
  const before=runtime(),previous=product.renderer.state().gpu,previousRestores=previous?.measurements?.restores??0;
  const waitEvent=(name,timeout)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(name+' timeout')),timeout);canvas.addEventListener(name,()=>{clearTimeout(timer);resolve(true)},{once:true})});
  const lost=waitEvent('webglcontextlost',4000);ext.loseContext();await lost;await new Promise(resolve=>setTimeout(resolve,0));
  const lostGpu=product.renderer.state().gpu;
  if(!lostGpu?.contextLost)throw new Error('Living WebGL2 backend did not enter context-lost state');
  if((lostGpu.allocatedPrograms??0)!==0||(lostGpu.allocatedBuffers??0)!==0||(lostGpu.allocatedTextures??0)!==0)throw new Error('Living WebGL2 lost-resource accounting remained live');
  let restoreEventObserved=false;canvas.addEventListener('webglcontextrestored',()=>{restoreEventObserved=true},{once:true});ext.restoreContext();
  const deadline=performance.now()+10000;let afterGpu=null;
  while(performance.now()<deadline){const gpu=product.renderer.state().gpu;if(gpu&&!gpu.contextLost&&gpu.frame>(previous?.frame||0)&&(gpu.measurements?.restores??0)>=previousRestores+1){afterGpu=gpu;break}await new Promise(resolve=>requestAnimationFrame(resolve))}
  if(!afterGpu)throw new Error('Living WebGL2 backend did not recover within bounded deadline');
  return{status:'MEASURED',before,after:runtime(),restoreEventObserved,lostGpu:{allocatedPrograms:lostGpu.allocatedPrograms,allocatedBuffers:lostGpu.allocatedBuffers,allocatedTextures:lostGpu.allocatedTextures},gpu:{frameBefore:previous?.frame||0,frameAfter:afterGpu.frame,allocatedPrograms:afterGpu.allocatedPrograms,allocatedBuffers:afterGpu.allocatedBuffers,allocatedTextures:afterGpu.allocatedTextures,restoresBefore:previousRestores,restoresAfter:afterGpu.measurements?.restores??null}};
 });
 if(result.status==='MEASURED'){
  assert.deepEqual(result.after,result.before,'context recovery must preserve runtime identity and history');
  assert.deepEqual(result.lostGpu,{allocatedPrograms:0,allocatedBuffers:0,allocatedTextures:0},'context loss must zero live GPU-resource accounting');
  assert.ok(result.gpu.frameAfter>result.gpu.frameBefore,'context recovery must redraw');
  assert.ok(result.gpu.restoresAfter>=result.gpu.restoresBefore+1,'context recovery restore accounting must advance');
  assert.ok((result.gpu.allocatedPrograms??0)>0&&(result.gpu.allocatedBuffers??0)>0&&(result.gpu.allocatedTextures??0)>0,'context recovery must recreate executable GPU resources');
  assert.ok((result.gpu.allocatedPrograms??0)<=2&&(result.gpu.allocatedBuffers??0)<=1&&(result.gpu.allocatedTextures??0)<=1,'context recovery resource inventory exceeded shipping bounds');
 }
 await page.evaluate(()=>OFU.v1LivingProduct.runtime.scale('HUMAN'));await waitStage(page,'HUMAN');
 return result;
}

async function desktopSoak(browserName,browser){
 const context=await browser.newContext({viewport:{width:1280,height:800}});await instrument(context);const page=await context.newPage(),workerAudit=trackWorkers(page);const errors=[],externalRequests=[];page.on('pageerror',e=>errors.push(String(e?.message||e).slice(0,800)));page.on('request',r=>{if(/^https?:/i.test(r.url()))externalRequests.push(r.url())});
 const startupStart=Date.now();await openOfflineProduct(page);await ready(page);const startupMs=Date.now()-startupStart;const material=await seedToHuman(page);const samples=[];const transitionMs=[];
 for(let cycle=0;cycle<CYCLES;cycle++){
  const t0=Date.now();
  const pre=await page.evaluate(()=>OFU.v1Session.hex(OFU.v1Session.exportBytes()));await clickScale(page,'UNIVERSE');await page.evaluate(h=>OFU.v1Session.importBytes(OFU.v1Session.unhex(h)),pre);await waitStage(page,'HUMAN');
  await page.evaluate(id=>{const L=OFU.v1LivingProduct.runtime,s=L.snapshot();if(s.selectedObjectId!==id)L.selectObject(id);L.enterMicro(id);L.deeper();L.deeper();L.deeper();L.scale('HUMAN')},material);await waitStage(page,'HUMAN');
  const post=await page.evaluate(()=>OFU.v1Session.hex(OFU.v1Session.exportBytes()));await clickScale(page,'UNIVERSE');await page.evaluate(h=>OFU.v1Session.importBytes(OFU.v1Session.unhex(h)),post);await waitStage(page,'HUMAN');
  transitionMs.push(Date.now()-t0);samples.push(await sample(page,cycle,workerAudit));
 }
 for(const s of samples){assert.equal(s.stage,'HUMAN');assert.ok(s.history<=s.historyLimit);assert.ok(s.discoveryCache<=s.discoveryCacheLimit);if(s.providerCache!=null&&s.providerCacheLimit!=null)assert.ok(s.providerCache<=s.providerCacheLimit);assert.ok(s.sessionBytes<1048576);assert.equal(s.canonicalMutation,false);assert.equal(s.canonicalP6Mutation,false);if(s.working){assert.ok((s.working.activePatches??0)<=28);assert.ok((s.working.cpuMeshes??0)<=64)}}
 const warm=samples.slice(Math.floor(samples.length/3));const fields=['domNodes','canvasCount','listeners','workers'];const plateauEvidence={};for(const f of fields){const vals=warm.map(x=>x[f]).filter(Number.isFinite);plateauEvidence[f]={values:vals,slope:slope(vals),nondecreasing:nondecreasing(vals),plateau:plateau(vals,f==='listeners'?8:f==='domNodes'?16:2)};assert.equal(plateauEvidence[f].plateau,true,`${browserName} ${f} failed bounded plateau ${JSON.stringify(vals)}`);assert.equal(plateauEvidence[f].nondecreasing,false,`${browserName} ${f} showed monotonic growth ${JSON.stringify(vals)}`)}
 const heap=warm.map(x=>x.heap).filter(Number.isFinite);let heapEvidence={status:'NOT_MEASURABLE'};if(heap.length){const first=heap[0],last=heap.at(-1),limit=Math.max(first*2,first+64*1024*1024);heapEvidence={status:'MEASURED_BROWSER_JS_HEAP_ONLY',first,last,max:Math.max(...heap),slope:slope(heap),nondecreasing:nondecreasing(heap),limit};assert.ok(last<=limit,`${browserName} JS heap exceeded conservative soak bound`)}
 const contextLoss=await contextRecovery(page);
 assert.equal(errors.length,0,`${browserName} page errors: ${errors.join('\n')}`);assert.equal(externalRequests.length,0,`${browserName} unexpected external requests: ${externalRequests.join('\n')}`);
 const longTask=await page.evaluate(()=>{const a=globalThis.__OFU_P21_AUDIT__;return a.longTaskSupport?{status:'MEASURED',count:a.longTasks.length,totalMs:a.longTasks.reduce((n,x)=>n+x.duration,0),maxMs:Math.max(0,...a.longTasks.map(x=>x.duration))}:{status:'NOT_MEASURABLE_UNSUPPORTED_ENTRY_TYPE'}});
 const pacing=await framePacing(page);
 const audioBounds=warm.map(x=>x.audioRuntime).filter(Boolean);for(const a of audioBounds){if(a.limits){assert.ok((a.contextCount??0)<=a.limits.audioContexts);assert.ok((a.liveNodes??0)<=a.limits.liveNodes)}}
 const evidence={browser:browserName,cycles:CYCLES,universeMicroUniverseRoundTrips:CYCLES,startupMs,transitionMs,transitionP95:[...transitionMs].sort((a,b)=>a-b)[Math.min(transitionMs.length-1,Math.floor(transitionMs.length*.95))],framePacing:pacing,plateau:plateauEvidence,heap:heapEvidence,longTasks:longTask,contextLoss,audio:{status:audioBounds.length?'MEASURED_RUNTIME_SNAPSHOT':'NOT_MEASURABLE_RUNTIME_SNAPSHOT_UNAVAILABLE',samples:audioBounds},offline:true,externalRequests,samples};await context.close();return evidence;
}

async function mobileAndA11y(browserName,browser){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});await instrument(context);const page=await context.newPage(),workerAudit=trackWorkers(page);const errors=[],externalRequests=[];page.on('pageerror',e=>errors.push(String(e?.message||e).slice(0,800)));page.on('request',r=>{if(/^https?:/i.test(r.url()))externalRequests.push(r.url())});await openOfflineProduct(page);await ready(page);await page.waitForFunction(()=>document.documentElement.dataset.ofuMobile==='true',{timeout:10000});
 await clickScale(page,'ORBIT');const before=await page.evaluate(()=>{const product=OFU.v1LivingProduct,runtime=product.runtime.snapshot(),pacing=product.runtime.navigationPacingSnapshot(),renderer=product.renderer.state(),canvas=document.getElementById('living-view'),rect=canvas?.getBoundingClientRect(),style=canvas&&getComputedStyle(canvas);if(!canvas||!rect||rect.width<=0||rect.height<=0||style.display==='none'||style.visibility==='hidden')throw new Error('active Living viewport is not visible');return{stage:runtime.stage,semanticScale:runtime.semanticScale,coordinate:runtime.navigationCoordinate,inputEvents:pacing.inputEvents,renderFrames:renderer.metrics.frames}});
 await page.evaluate(()=>{const c=document.getElementById('living-view'),r=c.getBoundingClientRect(),ev=(type,id,x,y)=>c.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',clientX:x,clientY:y,bubbles:true,cancelable:true,isPrimary:id===2101,buttons:type==='pointerup'?0:1})),cy=r.top+r.height*.5,cx=r.left+r.width*.5;ev('pointerdown',2101,cx-30,cy);ev('pointerdown',2102,cx+30,cy);ev('pointermove',2101,cx-68,cy);ev('pointermove',2102,cx+68,cy);ev('pointerup',2102,cx+68,cy);ev('pointerup',2101,cx-68,cy)});await page.waitForFunction(before=>{const product=OFU.v1LivingProduct,runtime=product.runtime.snapshot(),pacing=product.runtime.navigationPacingSnapshot(),input=product.snapshot().input,renderer=product.renderer.state();return pacing.inputEvents>before.inputEvents&&input.activePointers===0&&runtime.navigationCoordinate>before.coordinate&&runtime.stage!==before.stage&&runtime.semanticScale===OFU.v1LivingRuntime.SCALE_FOR_STAGE[runtime.stage]&&renderer.readyRevision===runtime.revision},before,{timeout:10000});const pinch=await page.evaluate(()=>{const product=OFU.v1LivingProduct,runtime=product.runtime.snapshot(),pacing=product.runtime.navigationPacingSnapshot(),renderer=product.renderer.state();return{stage:runtime.stage,semanticScale:runtime.semanticScale,expectedSemanticScale:OFU.v1LivingRuntime.SCALE_FOR_STAGE[runtime.stage],coordinate:runtime.navigationCoordinate,inputEvents:pacing.inputEvents,renderFrames:renderer.metrics.frames,uiError:product.snapshot().uiError}});assert.ok(pinch.inputEvents>before.inputEvents,'mobile pinch must route through the canonical Living input owner');assert.ok(pinch.coordinate>before.coordinate&&pinch.stage!==before.stage,'mobile pinch must cross a visible Living scale boundary');assert.equal(pinch.semanticScale,pinch.expectedSemanticScale);assert.ok(pinch.renderFrames>before.renderFrames,'mobile pinch must advance the active renderer');assert.equal(pinch.uiError,null,'mobile pinch must not leave a hidden rendering failure');
 const sizes=[{width:844,height:390},{width:390,height:844},{width:700,height:320},{width:320,height:700},{width:390,height:844}];const resize=[];for(const size of sizes){await page.setViewportSize(size);await page.waitForTimeout(60);const browserState=await page.evaluate(()=>{const listenerState=globalThis.__OFU_P21_AUDIT__?.listenerSnapshot?.()||null;return{w:innerWidth,h:innerHeight,stage:OFU.v1LivingProduct.runtime.snapshot().stage,dom:document.querySelectorAll('*').length,listeners:listenerState?.connectedOrGlobal??null,listenerState,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}});resize.push({...browserState,workers:workerAudit.live,createdWorkers:workerAudit.created,closedWorkers:workerAudit.closed});const s=resize.at(-1);assert.equal(s.stage,pinch.stage);assert.equal(s.overflow,false)}
 assert.ok(range(resize.map(x=>x.dom).filter(Number.isFinite))<=16,`${browserName} mobile resize DOM growth exceeded bounded range`);assert.ok(range(resize.map(x=>x.listeners).filter(Number.isFinite))<=8,`${browserName} mobile resize listener growth exceeded bounded range`);assert.ok(range(resize.map(x=>x.workers).filter(Number.isFinite))<=2,`${browserName} mobile resize worker growth exceeded bounded range`);
 assert.equal(errors.length,0,`${browserName} mobile errors: ${errors.join('\n')}`);assert.equal(externalRequests.length,0,`${browserName} mobile unexpected external requests: ${externalRequests.join('\n')}`);await context.close();
 const reduced=await browser.newContext({viewport:{width:1024,height:768},reducedMotion:'reduce'});const rp=await reduced.newPage(),reducedExternal=[];rp.on('request',r=>{if(/^https?:/i.test(r.url()))reducedExternal.push(r.url())});await openOfflineProduct(rp);await ready(rp);const reducedMotion=await rp.evaluate(()=>({media:matchMedia('(prefers-reduced-motion: reduce)').matches,snapshot:globalThis.__OFU_V1X10_ACCESSIBILITY__?.snapshot?.().reducedMotion??null}));assert.equal(reducedMotion.media,true);if(reducedMotion.snapshot!=null)assert.equal(reducedMotion.snapshot,true);assert.equal(reducedExternal.length,0,`${browserName} reduced-motion unexpected external requests: ${reducedExternal.join('\n')}`);await reduced.close();return{method:'BROWSER_POINTER_EVENT_EMULATION',physicalDeviceVerified:false,pinch:true,resizeOrientation:resize,reducedMotion,offline:true};
}

const results={schema:'ofu-v2-p21-performance-browser-mobile-evidence-1',status:'PASS',exactSourceSha:SOURCE,authority:'MEASURED_RUNTIME_EVIDENCE',productTransport:PRODUCT_TRANSPORT,claims:{driverVram:'NOT_MEASURABLE',physicalGpuMemory:'NOT_MEASURABLE',physicalMobileDevices:'NOT_VERIFIED',jsHeap:'ENGINE_EXPOSED_ONLY',listenerCount:'TEST_INSTRUMENTED_CONNECTED_OR_GLOBAL_EVENTTARGET_REGISTRATIONS',detachedTargetListeners:'DIAGNOSTIC_ONLY_GC_NONDETERMINISTIC',workerCount:'PLAYWRIGHT_PAGE_WORKER_LIFECYCLE',audioNodes:'PRODUCT_RUNTIME_SNAPSHOT_ONLY',framePacing:'REQUEST_ANIMATION_FRAME_INTERVALS',fallbackBrowserBinary:'EXPLICITLY_RECORDED_INFRASTRUCTURE_VARIANCE_NOT_GOVERNED_EXPECTED_EXECUTABLE'},cycles:CYCLES,browsers:{}};
for(const [name,engine] of Object.entries(ENGINES)){const launched=await launchEngine(name,engine),browser=launched.browser;try{results.browsers[name]={launcher:launched.launcher,desktop:await desktopSoak(name,browser),mobile:await mobileAndA11y(name,browser)}}finally{await browser.close()}}
results.artifactInput=immutableInput.verify();
fs.writeFileSync(path.join(OUT,'exact-browser-resource-soak.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({status:results.status,schema:results.schema,exactSourceSha:SOURCE,productTransport:PRODUCT_TRANSPORT,cycles:CYCLES,browsers:Object.fromEntries(Object.entries(results.browsers).map(([k,v])=>[k,{launcher:v.launcher.status,version:v.launcher.version,startupMs:v.desktop.startupMs,p95Ms:v.desktop.transitionP95,frameP95Ms:v.desktop.framePacing.p95Ms,heap:v.desktop.heap.status,longTasks:v.desktop.longTasks.status,contextLoss:v.desktop.contextLoss.status,audio:v.desktop.audio.status,mobile:true}]))}));

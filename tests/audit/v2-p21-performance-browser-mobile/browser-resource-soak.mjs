import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import os from 'node:os';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium,firefox,webkit} from 'playwright';

const SOURCE=process.env.OFU_SOURCE_SHA;
if(!SOURCE)throw new Error('OFU_SOURCE_SHA required');
const manifest=JSON.parse(fs.readFileSync('dist/rendering-build-manifest.json','utf8'));
assert.equal(manifest.sourceCommit,SOURCE,'shipping manifest must identify the exact audit SHA');
const DEFAULT_PRODUCT=pathToFileURL(path.resolve('dist/One_File_Universe.html')).href;
const PRODUCT=process.env.P21_PRODUCT_URL||DEFAULT_PRODUCT;
const PRODUCT_TRANSPORT=process.env.P21_PRODUCT_URL?'DIAGNOSTIC_HTTP_OVERRIDE':'EXACT_SHIPPING_FILE_URL';
const OUT=path.resolve('dist/evidence/v2-p21-performance-browser-mobile');
fs.mkdirSync(OUT,{recursive:true});
const ENGINES={chromium,firefox,webkit};
const CYCLES=Number(process.env.P21_CYCLES||12);
assert.ok(Number.isInteger(CYCLES)&&CYCLES>=8&&CYCLES<=40,'P21_CYCLES must be 8..40');

function executableCandidates(name){
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
async function launchEngine(name,engine){
 try{return {browser:await engine.launch({headless:true}),launcher:{status:'PLAYWRIGHT_EXPECTED_EXECUTABLE',executable:engine.executablePath()}}}
 catch(error){
  const original=String(error?.message||error);
  if(!/Executable doesn't exist|executable.*not found|Failed to launch/i.test(original))throw error;
  const attempted=[];
  for(const executablePath of executableCandidates(name)){
   attempted.push(executablePath);
   try{return {browser:await engine.launch({headless:true,executablePath}),launcher:{status:'PINNED_CACHE_EXECUTABLE_FALLBACK',expected:engine.executablePath(),executable:executablePath,originalError:original.slice(0,600)}}}catch{}
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

async function instrument(context){
 await context.addInitScript(()=>{
  const active={listeners:0,workers:0,createdWorkers:0};
  const proto=EventTarget.prototype,add=proto.addEventListener,remove=proto.removeEventListener;
  const registry=new WeakMap();
  const capture=o=>typeof o==='boolean'?o:!!o?.capture;
  const forget=(target,type,entry)=>{const m=registry.get(target),a=m?.get(type),i=a?.indexOf(entry)??-1;if(i>=0){a.splice(i,1);active.listeners=Math.max(0,active.listeners-1)}};
  proto.addEventListener=function(type,listener,opts){
   if(!listener)return add.call(this,type,listener,opts);
   let m=registry.get(this);if(!m){m=new Map();registry.set(this,m)}let a=m.get(type);if(!a){a=[];m.set(type,a)}const c=capture(opts);
   if(a.some(x=>x.listener===listener&&x.capture===c))return add.call(this,type,listener,opts);
   const once=!!(typeof opts==='object'&&opts?.once),entry={listener,capture:c,wrapped:listener};
   if(once){entry.wrapped=typeof listener==='function'?function(...args){forget(this,type,entry);return listener.apply(this,args)}:{handleEvent(event){forget(event.currentTarget,type,entry);return listener.handleEvent(event)}};}
   a.push(entry);active.listeners++;
   const signal=typeof opts==='object'?opts?.signal:null;if(signal&&typeof signal.addEventListener==='function')add.call(signal,'abort',()=>forget(this,type,entry),{once:true});
   return add.call(this,type,entry.wrapped,opts);
  };
  proto.removeEventListener=function(type,listener,opts){
   const m=registry.get(this),a=m?.get(type),c=capture(opts),entry=a?.find(x=>x.listener===listener&&x.capture===c);if(entry){forget(this,type,entry);return remove.call(this,type,entry.wrapped,opts)}
   return remove.call(this,type,listener,opts);
  };
  const NativeWorker=globalThis.Worker;
  if(NativeWorker){globalThis.Worker=class extends NativeWorker{constructor(...args){super(...args);active.workers++;active.createdWorkers++;const terminate=this.terminate.bind(this);let live=true;this.terminate=(...xs)=>{if(live){live=false;active.workers--}return terminate(...xs)}}};}
  const longTasks=[];
  let longTaskSupport=false;
  try{if(globalThis.PerformanceObserver?.supportedEntryTypes?.includes('longtask')){longTaskSupport=true;new PerformanceObserver(list=>{for(const e of list.getEntries())longTasks.push({startTime:e.startTime,duration:e.duration})}).observe({type:'longtask',buffered:true})}}catch{}
  globalThis.__OFU_P21_AUDIT__={active,longTasks,longTaskSupport};
 });
}

async function ready(page){
 await page.waitForFunction(()=>OFU?.v1Experience?.snapshot?.().initialized&&OFU?.v1Session&&OFU?.v1LivingProduct?.snapshot?.().initialized&&OFU?.productUI&&OFU?.waveIVScaleRuntime,{timeout:30000});
}
async function openExplore(page){await page.evaluate(()=>OFU.productUI.workspace('explore',{focus:false,announceChange:false}));await page.waitForFunction(()=>!document.querySelector('[data-workspace-panel="explore"]').hidden)}
async function waitStage(page,stage){await page.waitForFunction(s=>OFU.v1LivingProduct.runtime.snapshot().stage===s,stage,{timeout:15000})}
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

async function sample(page,cycle){
 return page.evaluate(cycle=>{
  const p=globalThis.__OFU_PLANET_PREVIEW__?.snapshot?.()||null,v=OFU.v1Providers?.snapshot?.()||{},s=OFU.v1Session.snapshot(),l=OFU.v1LivingProduct.runtime.snapshot(),r=OFU.v1LivingProduct.renderer.state(),a=globalThis.__OFU_P21_AUDIT__;
  const audio=globalThis.__OFU_V2X14_AUDIO__?.snapshot?.()||OFU.v2x14LivingAudioController?.instance?.()?.snapshot?.()||null;
  return {cycle,stage:l.stage,history:l.historyDepth,historyLimit:l.maxHistory,discoveryCache:l.discoveryCacheEntries,discoveryCacheLimit:l.discoveryCacheLimit,providerCache:v.cacheEntries??null,providerCacheLimit:v.cacheLimit??null,domNodes:document.querySelectorAll('*').length,canvasCount:document.querySelectorAll('canvas').length,audioElements:document.querySelectorAll('audio').length,audioRuntime:audio?.runtime?{state:audio.runtime.state,contextCount:audio.runtime.contextCount,contextCreations:audio.runtime.contextCreations,liveNodes:audio.runtime.liveNodes,peakLiveNodes:audio.runtime.peakLiveNodes,limits:audio.runtime.limits}:null,listeners:a?.active.listeners??null,workers:a?.active.workers??null,createdWorkers:a?.active.createdWorkers??null,longTasks:a?.longTasks.length??null,longTaskSupport:a?.longTaskSupport??false,heap:performance.memory?.usedJSHeapSize??null,sessionBytes:OFU.v1Session.exportBytes().length,canonicalMutation:s.canonicalMutation,canonicalP6Mutation:s.canonicalP6Mutation,working:p?.workingSet||null,gpu:p?.gpu||null,renderer:r};
 },cycle);
}

async function desktopSoak(browserName,browser){
 const context=await browser.newContext({viewport:{width:1280,height:800}});await instrument(context);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e?.message||e).slice(0,800)));
 const startupStart=Date.now();await page.goto(PRODUCT,{waitUntil:'load'});await ready(page);const startupMs=Date.now()-startupStart;const material=await seedToHuman(page);const samples=[];const transitionMs=[];
 for(let cycle=0;cycle<CYCLES;cycle++){
  const t0=Date.now();
  await page.evaluate(id=>{const L=OFU.v1LivingProduct.runtime,s=L.snapshot();if(s.selectedObjectId!==id)L.selectObject(id);L.enterMicro(id);L.deeper();L.deeper();L.deeper();L.scale('HUMAN')},material);
  await waitStage(page,'HUMAN');
  if(cycle%3===0){const save=await page.evaluate(()=>OFU.v1Session.hex(OFU.v1Session.exportBytes()));await page.evaluate(()=>OFU.v1LivingProduct.runtime.scale('UNIVERSE'));await waitStage(page,'UNIVERSE');await page.evaluate(h=>OFU.v1Session.importBytes(OFU.v1Session.unhex(h)),save);await waitStage(page,'HUMAN')}
  transitionMs.push(Date.now()-t0);samples.push(await sample(page,cycle));
 }
 for(const s of samples){assert.equal(s.stage,'HUMAN');assert.ok(s.history<=s.historyLimit);assert.ok(s.discoveryCache<=s.discoveryCacheLimit);if(s.providerCache!=null&&s.providerCacheLimit!=null)assert.ok(s.providerCache<=s.providerCacheLimit);assert.ok(s.sessionBytes<1048576);assert.equal(s.canonicalMutation,false);assert.equal(s.canonicalP6Mutation,false);if(s.working){assert.ok((s.working.activePatches??0)<=28);assert.ok((s.working.cpuMeshes??0)<=64)}}
 const warm=samples.slice(Math.floor(samples.length/3));const fields=['domNodes','canvasCount','listeners','workers'];const plateauEvidence={};for(const f of fields){const vals=warm.map(x=>x[f]).filter(Number.isFinite);plateauEvidence[f]={values:vals,slope:slope(vals),nondecreasing:nondecreasing(vals),plateau:plateau(vals,f==='listeners'?8:f==='domNodes'?16:2)};assert.equal(plateauEvidence[f].plateau,true,`${browserName} ${f} failed bounded plateau ${JSON.stringify(vals)}`)}
 const heap=warm.map(x=>x.heap).filter(Number.isFinite);let heapEvidence={status:'NOT_MEASURABLE'};if(heap.length){const first=heap[0],last=heap.at(-1),limit=Math.max(first*2,first+64*1024*1024);heapEvidence={status:'MEASURED_BROWSER_JS_HEAP_ONLY',first,last,max:Math.max(...heap),slope:slope(heap),nondecreasing:nondecreasing(heap),limit};assert.ok(last<=limit,`${browserName} JS heap exceeded conservative soak bound`)}
 const contextLoss=await page.evaluate(async()=>{const canvas=document.getElementById('planet-view'),gl=canvas?.getContext?.('webgl2');if(!gl)return{status:'NOT_MEASURABLE_BACKEND_NOT_WEBGL2'};const ext=gl.getExtension('WEBGL_lose_context');if(!ext)return{status:'NOT_MEASURABLE_EXTENSION_UNAVAILABLE'};const before=OFU.v1LivingProduct.runtime.snapshot().stage;ext.loseContext();await new Promise(r=>setTimeout(r,80));ext.restoreContext();await new Promise(r=>setTimeout(r,180));return{status:'MEASURED',before,after:OFU.v1LivingProduct.runtime.snapshot().stage,isLost:gl.isContextLost()}});if(contextLoss.status==='MEASURED'){assert.equal(contextLoss.after,contextLoss.before);assert.equal(contextLoss.isLost,false)}
 assert.equal(errors.length,0,`${browserName} page errors: ${errors.join('\n')}`);
 const longTask=await page.evaluate(()=>{const a=globalThis.__OFU_P21_AUDIT__;return a.longTaskSupport?{status:'MEASURED',count:a.longTasks.length,totalMs:a.longTasks.reduce((n,x)=>n+x.duration,0),maxMs:Math.max(0,...a.longTasks.map(x=>x.duration))}:{status:'NOT_MEASURABLE_UNSUPPORTED_ENTRY_TYPE'}});
 const pacing=await framePacing(page);
 const audioBounds=warm.map(x=>x.audioRuntime).filter(Boolean);for(const a of audioBounds){if(a.limits){assert.ok((a.contextCount??0)<=a.limits.audioContexts);assert.ok((a.liveNodes??0)<=a.limits.liveNodes)}}
 const evidence={browser:browserName,cycles:CYCLES,startupMs,transitionMs,transitionP95:[...transitionMs].sort((a,b)=>a-b)[Math.min(transitionMs.length-1,Math.floor(transitionMs.length*.95))],framePacing:pacing,plateau:plateauEvidence,heap:heapEvidence,longTasks:longTask,contextLoss,audio:{status:audioBounds.length?'MEASURED_RUNTIME_SNAPSHOT':'NOT_MEASURABLE_RUNTIME_SNAPSHOT_UNAVAILABLE',samples:audioBounds},samples};await context.close();return evidence;
}

async function mobileAndA11y(browserName,browser){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});await instrument(context);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e?.message||e).slice(0,800)));await page.goto(PRODUCT,{waitUntil:'load'});await ready(page);await page.waitForFunction(()=>document.documentElement.dataset.ofuMobile==='true',{timeout:10000});
 await page.click('[data-render-stage="orbit"]');await page.waitForFunction(()=>OFU.waveIVScaleRuntime.snapshot().semanticScale==='orbit');const before=await page.evaluate(()=>({stage:OFU.v1LivingProduct.runtime.snapshot().stage,pinch:OFU.waveIVInputRouter.state.pinchIntents}));
 await page.evaluate(()=>{const c=document.getElementById('planet-view'),r=c.getBoundingClientRect(),ev=(type,id,x,y)=>c.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',clientX:x,clientY:y,bubbles:true,cancelable:true,isPrimary:id===1,buttons:type==='pointerup'?0:1})),cy=r.top+r.height*.5,cx=r.left+r.width*.5;ev('pointerdown',1,cx-30,cy);ev('pointerdown',2,cx+30,cy);ev('pointermove',1,cx-58,cy);ev('pointermove',2,cx+58,cy);ev('pointerup',2,cx+58,cy);ev('pointerup',1,cx-58,cy)});await page.waitForTimeout(80);const pinch=await page.evaluate(()=>OFU.waveIVInputRouter.state.pinchIntents);assert.ok(pinch>before.pinch,'mobile pinch must route through canonical input owner');
 const sizes=[{width:844,height:390},{width:390,height:844},{width:700,height:320},{width:320,height:700},{width:390,height:844}];const resize=[];for(const size of sizes){await page.setViewportSize(size);await page.waitForTimeout(60);resize.push(await page.evaluate(()=>({w:innerWidth,h:innerHeight,stage:OFU.v1LivingProduct.runtime.snapshot().stage,dom:document.querySelectorAll('*').length,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1})));assert.equal(resize.at(-1).overflow,false)}
 assert.equal(errors.length,0,`${browserName} mobile errors: ${errors.join('\n')}`);await context.close();
 const reduced=await browser.newContext({viewport:{width:1024,height:768},reducedMotion:'reduce'});const rp=await reduced.newPage();await rp.goto(PRODUCT,{waitUntil:'load'});await ready(rp);const reducedMotion=await rp.evaluate(()=>({media:matchMedia('(prefers-reduced-motion: reduce)').matches,snapshot:globalThis.__OFU_V1X10_ACCESSIBILITY__?.snapshot?.().reducedMotion??null}));assert.equal(reducedMotion.media,true);if(reducedMotion.snapshot!=null)assert.equal(reducedMotion.snapshot,true);await reduced.close();return{method:'BROWSER_POINTER_EVENT_EMULATION',physicalDeviceVerified:false,pinch:true,resizeOrientation:resize,reducedMotion};
}

const results={schema:'ofu-v2-p21-performance-browser-mobile-evidence-1',status:'PASS',exactSourceSha:SOURCE,authority:'MEASURED_RUNTIME_EVIDENCE',productTransport:PRODUCT_TRANSPORT,claims:{driverVram:'NOT_MEASURABLE',physicalGpuMemory:'NOT_MEASURABLE',physicalMobileDevices:'NOT_VERIFIED',jsHeap:'ENGINE_EXPOSED_ONLY',listenerCount:'TEST_INSTRUMENTED_EVENTTARGET_REGISTRATION_BALANCE',workerCount:'TEST_INSTRUMENTED_CONSTRUCTOR_TERMINATION_BALANCE',audioNodes:'PRODUCT_RUNTIME_SNAPSHOT_ONLY',framePacing:'REQUEST_ANIMATION_FRAME_INTERVALS'},cycles:CYCLES,browsers:{}};
for(const [name,engine] of Object.entries(ENGINES)){const launched=await launchEngine(name,engine),browser=launched.browser;try{results.browsers[name]={launcher:launched.launcher,desktop:await desktopSoak(name,browser),mobile:await mobileAndA11y(name,browser)}}finally{await browser.close()}}
fs.writeFileSync(path.join(OUT,'exact-browser-resource-soak.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({status:results.status,schema:results.schema,exactSourceSha:SOURCE,productTransport:PRODUCT_TRANSPORT,cycles:CYCLES,browsers:Object.fromEntries(Object.entries(results.browsers).map(([k,v])=>[k,{launcher:v.launcher.status,startupMs:v.desktop.startupMs,p95Ms:v.desktop.transitionP95,frameP95Ms:v.desktop.framePacing.p95Ms,heap:v.desktop.heap.status,longTasks:v.desktop.longTasks.status,contextLoss:v.desktop.contextLoss.status,audio:v.desktop.audio.status,mobile:true}]))}));
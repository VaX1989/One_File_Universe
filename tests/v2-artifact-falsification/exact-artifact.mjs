import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {emittedComponent,loadComponents} from '../../tools/extensions/components.mjs';
import {bundleLifeShippingRuntime} from '../../src/v2x-08-life-ecology-evolution-embodiment/shipping-bundle.mjs';

const ROOT=process.cwd();
const ARTIFACT='dist/One_File_Universe.html';
const MANIFEST='dist/rendering-build-manifest.json';
const REPORT='dist/evidence/v2-exact-artifact-falsification/report.json';
const BASE_POINTER='docs/parallel/V2_PARALLEL_BASE_CURRENT.json';
const AUTHORIZED_BASE_SHA='2977c11a0ac97eba8fd7b6b7df9c958ea1a2d9a7';
const AUTHORIZED_BASE_TREE='99e6b5ff6229d9c34d381e778c5689bf2367d256';
const OWNERSHIP='docs/parallel/V2X_OWNERSHIP_MATRIX.json';
const MAX_LIST=32;
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const normalized=text=>String(text).replace(/\r\n?/g,'\n');
const exists=rel=>fs.existsSync(path.join(ROOT,rel));
const read=rel=>fs.readFileSync(path.join(ROOT,rel));
const readText=rel=>normalized(fs.readFileSync(path.join(ROOT,rel),'utf8'));
const compact=list=>list.length<=MAX_LIST?list:[...list.slice(0,MAX_LIST),`... ${list.length-MAX_LIST} more`];
const isV2x=c=>/v2x/i.test(`${c.id||''} ${c.owner||''} ${c.source||''} ${(c.provides||[]).join(' ')}`);

function build(){
  execFileSync(process.execPath,['tools/build-ofu-rendering-v09.mjs'],{cwd:ROOT,env:process.env,stdio:['ignore','pipe','inherit']});
  const bytes=read(ARTIFACT),manifest=JSON.parse(readText(MANIFEST));
  return {bytes,html:normalized(bytes.toString('utf8')),manifest,hash:sha256(bytes)};
}

function descriptorBytes(d){
  for(const key of ['emittedBytes','embeddedBytes','inputBytes','bytes'])if(Number.isSafeInteger(d?.[key]))return d[key];
  return 0;
}

function extractScripts(html){
  const out=[];const re=/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;let m;
  while((m=re.exec(html))){
    const attrs=m[1]||'',code=m[2]||'';
    if(/\btype\s*=\s*["']application\/json["']/i.test(attrs)||/\bsrc\s*=/i.test(attrs)||!code.trim())continue;
    const codeOffset=m.index+m[0].indexOf(code),line=html.slice(0,codeOffset).split('\n').length;
    const id=(attrs.match(/\bdata-ofu-component\s*=\s*["']([^"']+)["']/i)||[])[1]||null;
    out.push({id,attrs,code,line});
  }
  return out;
}

function parseScripts(html){
  const failures=[];
  for(const [index,s] of extractScripts(html).entries()){
    try{new vm.Script(s.code,{filename:s.id?`component:${s.id}`:`inline:${index}`});}
    catch(error){
      const stack=String(error?.stack||error);const m=stack.match(/:(\d+)(?::(\d+))?\)?(?:\n|$)/);
      const scriptLine=m?Number(m[1]):null,scriptColumn=m?.[2]?Number(m[2]):null;
      failures.push({componentId:s.id,scriptIndex:index,message:String(error?.message||error),scriptLine,scriptColumn,artifactLine:scriptLine?s.line+scriptLine-1:s.line,stack:stack.slice(0,1200)});
    }
  }
  return failures;
}

function exportNames(source){
  const names=new Set();
  const patterns=[/(?:\bO|\bOFU|root\.OFU|globalThis\.OFU)\.([A-Za-z_$][\w$]*)\s*=/g,/(?:\bO|\bOFU|root\.OFU|globalThis\.OFU)\[['"]([^'"]+)['"]\]\s*=/g];
  for(const re of patterns){let m;while((m=re.exec(source)))names.add(m[1]);}
  return [...names].sort();
}

function externalTokenUse(html,component,token){
  const emitted=emittedComponent(component);
  const withoutOwn=html.includes(emitted)?html.replace(emitted,''):html;
  return withoutOwn.includes(token);
}

function developedInventory(plan,html){
  const matrix=JSON.parse(readText(OWNERSHIP));
  const bySource=new Map();
  for(const c of plan){const list=bySource.get(c.source)||[];list.push(c.id);bySource.set(c.source,list);}
  const lifeBundlePath='src/v2x-08-life-ecology-evolution-embodiment/shipping-runtime.js',lifeBundleInputs=new Set(['model.js','embodiment.js','renderer.js','evolution.js','succession.js','provider.js','viewport-bridge.js','shipping-adapter.js'].map(name=>'src/v2x-08-life-ecology-evolution-embodiment/'+name)),lifeBundleComponent=plan.find(c=>c.source===lifeBundlePath),lifeBundleValid=readText(lifeBundlePath).trimEnd()===bundleLifeShippingRuntime().trimEnd(),lifeBundleEmitted=Boolean(lifeBundleComponent&&html.includes(emittedComponent(lifeBundleComponent)));
  const items=[];
  for(const [laneId,lane] of Object.entries(matrix.lanes||{})){
    if(!/^V2X-(?:0[1-9]|1[0-6])$/.test(laneId))continue;
    for(const rel of lane.allowedPatterns||[]){
      if(!/^(?:src|assets|data|config\/extensions)\//.test(rel)||/[?*\[\]]/.test(rel)||!exists(rel))continue;
      const bytes=read(rel),text=/\.(?:js|mjs|json|css|glsl|wgsl|html|txt|md)$/i.test(rel)?normalized(bytes.toString('utf8')).trimEnd():null;
      const componentIds=bySource.get(rel)||[];
      const exactArtifactInclusion=text?html.includes(text)||html.includes(text.replace(/<\/script/gi,'<\\/script')):false;
      const deterministicBundleInput=laneId==='V2X-08'&&lifeBundleInputs.has(rel)&&lifeBundleValid&&lifeBundleEmitted;
      items.push({laneId,path:rel,bytes:bytes.length,sha256:sha256(bytes),componentIds,manifested:componentIds.length>0,exactArtifactInclusion,deterministicBundleInput,bundledBy:deterministicBundleInput?lifeBundleComponent.id:null});
    }
  }
  items.sort((a,b)=>a.laneId.localeCompare(b.laneId)||a.path.localeCompare(b.path));
  return items;
}

async function browserAudit(){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.addInitScript(() => {
    const audit=globalThis.__OFU_EXACT_AUDIT={active:null,ofuReads:[],ofuWrites:[],eventRegistrations:[],eventExecutions:[],rafRegistrations:[],draws:[],mutations:[]};
    const owner=()=>document.currentScript?.dataset?.ofuComponent||audit.active||'baseline';
    const bounded=(arr,value,max=10000)=>{if(arr.length<max)arr.push(value);};
    const target={};
    globalThis.OFU=new Proxy(target,{
      get(t,p,r){if(typeof p==='string')bounded(audit.ofuReads,{property:p,consumer:owner()});return Reflect.get(t,p,r);},
      set(t,p,v,r){if(typeof p==='string')bounded(audit.ofuWrites,{property:p,producer:owner(),type:typeof v});return Reflect.set(t,p,v,r);}
    });
    const nativeAdd=EventTarget.prototype.addEventListener,nativeRemove=EventTarget.prototype.removeEventListener,targetMaps=new WeakMap();
    const captureOf=o=>typeof o==='boolean'?o:!!o?.capture;
    function mapFor(target,type,capture){let byKey=targetMaps.get(target);if(!byKey){byKey=new Map();targetMaps.set(target,byKey);}const key=String(type)+':'+String(capture);let map=byKey.get(key);if(!map){map=new WeakMap();byKey.set(key,map);}return map;}
    EventTarget.prototype.addEventListener=function(type,listener,options){
      const component=owner();bounded(audit.eventRegistrations,{type:String(type),component});
      if(!listener||(typeof listener!=='function'&&typeof listener.handleEvent!=='function'))return nativeAdd.call(this,type,listener,options);
      const capture=captureOf(options),map=mapFor(this,type,capture);let wrapped=map.get(listener);
      if(!wrapped){wrapped=function(event){const previous=audit.active;audit.active=component;bounded(audit.eventExecutions,{type:String(event?.type||type),component});try{return typeof listener==='function'?listener.call(this,event):listener.handleEvent(event);}finally{audit.active=previous;}};map.set(listener,wrapped);}
      return nativeAdd.call(this,type,wrapped,options);
    };
    EventTarget.prototype.removeEventListener=function(type,listener,options){const map=listener&&mapFor(this,type,captureOf(options));return nativeRemove.call(this,type,map?.get(listener)||listener,options);};
    const nativeRAF=globalThis.requestAnimationFrame?.bind(globalThis);
    if(nativeRAF)globalThis.requestAnimationFrame=function(callback){const component=owner();bounded(audit.rafRegistrations,{component});return nativeRAF(time=>{const previous=audit.active;audit.active=component;try{return callback(time);}finally{audit.active=previous;}});};
    const wrapMethod=(proto,name,kind)=>{if(!proto||typeof proto[name]!=='function')return;const original=proto[name];proto[name]=function(...args){bounded(audit[kind],{method:name,component:owner()});return original.apply(this,args);};};
    for(const name of ['fillRect','strokeRect','fill','stroke','drawImage','fillText','strokeText','putImageData','clearRect'])wrapMethod(globalThis.CanvasRenderingContext2D?.prototype,name,'draws');
    for(const proto of [globalThis.WebGLRenderingContext?.prototype,globalThis.WebGL2RenderingContext?.prototype])for(const name of ['drawArrays','drawElements','clear'])wrapMethod(proto,name,'draws');
    for(const [proto,name] of [[Node.prototype,'appendChild'],[Node.prototype,'insertBefore'],[Node.prototype,'replaceChild'],[Element.prototype,'insertAdjacentHTML'],[Element.prototype,'setAttribute']])wrapMethod(proto,name,'mutations');
  });
  const pageErrors=[],externalRequests=[];
  page.on('pageerror',error=>pageErrors.push({message:String(error?.message||error),stack:String(error?.stack||'').slice(0,1600)}));
  page.on('request',request=>{const url=request.url();if(/^https?:/i.test(url))externalRequests.push({method:request.method(),url});});
  const url=pathToFileURL(path.resolve(ROOT,ARTIFACT)).href;
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(300);
  const before=await page.evaluate(() => {
    const storage=which=>{try{const s=globalThis[which];return Object.fromEntries(Object.keys(s).sort().map(k=>[k,s.getItem(k)]));}catch{return{}}};
    const canvases=[...document.querySelectorAll('canvas')].map(c=>{const r=c.getBoundingClientRect();return{width:r.width,height:r.height,left:r.left,top:r.top,visible:r.width>1&&r.height>1};});
    const controls=[...document.querySelectorAll('button,[role="button"],a[href],input,select,textarea')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>1&&r.height>1&&s.visibility!=='hidden'&&s.display!=='none';}).length;
    return {title:document.title,bodyTextBytes:new TextEncoder().encode(document.body?.innerText||'').length,canvases,visibleControls:controls,componentScripts:[...document.querySelectorAll('script[data-ofu-component]')].map(s=>s.dataset.ofuComponent),resources:[...document.querySelectorAll('script[id^="ofu-resource-"]')].map(s=>s.id.slice('ofu-resource-'.length)),ofuKeys:Object.keys(globalThis.OFU||{}).sort(),localStorage:storage('localStorage'),sessionStorage:storage('sessionStorage'),audit:globalThis.__OFU_EXACT_AUDIT};
  });
  const beforeShot=await page.screenshot({type:'png'}),actionStart=before.audit.eventExecutions.length,drawStart=before.audit.draws.length,mutationStart=before.audit.mutations.length;
  const target=before.canvases.filter(c=>c.visible).sort((a,b)=>b.width*b.height-a.width*a.height)[0];
  if(target){await page.mouse.move(Math.max(1,target.left+target.width/2),Math.max(1,target.top+target.height/2));await page.mouse.wheel(0,72);await page.waitForTimeout(200);}
  const afterShot=await page.screenshot({type:'png'});
  const afterAction=await page.evaluate(()=>{const storage=which=>{try{const s=globalThis[which];return Object.fromEntries(Object.keys(s).sort().map(k=>[k,s.getItem(k)]));}catch{return{}}};return{audit:globalThis.__OFU_EXACT_AUDIT,ofuKeys:Object.keys(globalThis.OFU||{}).sort(),localStorage:storage('localStorage'),sessionStorage:storage('sessionStorage')}});
  const action={performed:!!target,target:target||null,eventExecutions:afterAction.audit.eventExecutions.slice(actionStart),draws:afterAction.audit.draws.slice(drawStart),mutations:afterAction.audit.mutations.slice(mutationStart),beforeScreenshotSha256:sha256(beforeShot),afterScreenshotSha256:sha256(afterShot),pixelDeltaObserved:Buffer.compare(beforeShot,afterShot)!==0};
  await page.reload({waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(300);
  const revisit=await page.evaluate(()=>{const storage=which=>{try{const s=globalThis[which];return Object.fromEntries(Object.keys(s).sort().map(k=>[k,s.getItem(k)]));}catch{return{}}};return{ofuKeys:Object.keys(globalThis.OFU||{}).sort(),localStorage:storage('localStorage'),sessionStorage:storage('sessionStorage'),componentScripts:[...document.querySelectorAll('script[data-ofu-component]')].map(s=>s.dataset.ofuComponent)}});
  await browser.close();
  const runtimeExports=new Set(afterAction.ofuKeys);
  const readsByProperty=new Map();for(const r of afterAction.audit.ofuReads){if(!readsByProperty.has(r.property))readsByProperty.set(r.property,new Set());readsByProperty.get(r.property).add(r.consumer);}
  const activeComponents=new Set([...afterAction.audit.eventRegistrations,...afterAction.audit.rafRegistrations,...afterAction.audit.draws,...afterAction.audit.mutations].map(x=>x.component).filter(Boolean));
  return {pageErrors,externalRequests,before:{...before,audit:undefined},action,revisit,runtimeExports,readsByProperty,activeComponents,audit:afterAction.audit};
}

const pointer=exists(BASE_POINTER)?JSON.parse(readText(BASE_POINTER)):null;
if(pointer){assert.equal(pointer.status,'READY_FOR_MASSIVE_PARALLEL_EXECUTION','parallel base pointer must be READY');assert.equal(pointer.baseSha,AUTHORIZED_BASE_SHA,'parallel base SHA changed');assert.equal(pointer.baseTree,AUTHORIZED_BASE_TREE,'parallel base tree changed');}
const sourceSha=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
const sourceTree=execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:ROOT,encoding:'utf8'}).trim();
const authenticatedBaseTree=execFileSync('git',['rev-parse',AUTHORIZED_BASE_SHA+'^{tree}'],{cwd:ROOT,encoding:'utf8'}).trim();
assert.equal(authenticatedBaseTree,AUTHORIZED_BASE_TREE,'authorized base tree mismatch');
execFileSync('git',['merge-base','--is-ancestor',AUTHORIZED_BASE_SHA,sourceSha],{cwd:ROOT,stdio:'ignore'});
const first=build(),second=build();
const reproducible=Buffer.compare(first.bytes,second.bytes)===0&&first.hash===second.hash&&JSON.stringify(first.manifest)===JSON.stringify(second.manifest);
const html=second.html,plan=loadComponents(ROOT),extensions=second.manifest.additiveComponents?.extensions||[],descriptorById=new Map(extensions.map(d=>[d.id,d]));
const artifactMissing=[],manifestMismatches=[];
for(const c of plan){
  const d=descriptorById.get(c.id);if(!d)manifestMismatches.push({id:c.id,reason:'missing-final-manifest-descriptor'});
  else for(const field of ['source','sourceSha256'])if(d[field]!==undefined&&d[field]!==c[field])manifestMismatches.push({id:c.id,reason:`descriptor-${field}-mismatch`,expected:c[field],actual:d[field]});
  if(!html.includes(emittedComponent(c)))artifactMissing.push({id:c.id,source:c.source,placement:c.placement});
}
const parseFailures=parseScripts(html);
const developed=developedInventory(plan,html),unshippedDeveloped=developed.filter(x=>!x.manifested&&!x.exactArtifactInclusion&&!x.deterministicBundleInput);
const sourceToComponents=new Map();for(const c of plan){const list=sourceToComponents.get(c.source)||[];list.push(c);sourceToComponents.set(c.source,list);}
const duplicateSources=[...sourceToComponents.entries()].filter(([,cs])=>cs.length>1).map(([source,cs])=>({source,componentIds:cs.map(c=>c.id)}));
const hashGroups=new Map();for(const c of plan){const list=hashGroups.get(c.sourceSha256)||[];list.push(c);hashGroups.set(c.sourceSha256,list);}
const duplicateImplementations=[...hashGroups.entries()].filter(([,cs])=>cs.length>1&&new Set(cs.map(c=>c.source)).size>1).map(([hash,cs])=>({sha256:hash,sources:[...new Set(cs.map(c=>c.source))],componentIds:cs.map(c=>c.id)}));
const browser=await browserAudit();
const inbound=new Map(plan.map(c=>[c.id,[]]));for(const c of plan)for(const dep of c.dependencies||[])if(inbound.has(dep))inbound.get(dep).push(c.id);
const visibleEffectOwners=new Set([...browser.audit.draws,...browser.audit.mutations].map(x=>x.component).filter(Boolean));
const actionOwners=new Set([...browser.action.eventExecutions,...browser.action.draws,...browser.action.mutations].map(x=>x.component).filter(Boolean));
const components=plan.map(c=>{
  const source=c.content??readText(c.source),exports=exportNames(source),presentExports=exports.filter(name=>browser.runtimeExports.has(name)),runtimeReads=presentExports.flatMap(name=>[...(browser.readsByProperty.get(name)||[])].filter(consumer=>consumer!==c.id).map(consumer=>({export:name,consumer}))),staticTokenConsumers=exports.filter(name=>externalTokenUse(html,c,name)),active=browser.activeComponents.has(c.id),v2x=isV2x(c),actualConsumer=runtimeReads.length>0||active,consumerIds=new Set(runtimeReads.map(r=>r.consumer)),visibleOrActionEvidence=visibleEffectOwners.has(c.id)||actionOwners.has(c.id)||[...consumerIds].some(id=>visibleEffectOwners.has(id)||actionOwners.has(id));
  return {id:c.id,owner:c.owner,source:c.source,authority:c.authority,placement:c.placement,provides:c.provides,emittedBytes:descriptorById.get(c.id)?.emittedBytes||Buffer.byteLength(emittedComponent(c)),v2x,exports,runtimeExports:presentExports,runtimeReads,staticTokenConsumers,inboundDependencies:inbound.get(c.id)||[],runtimeActiveSideEffect:active,actualConsumer,visibleOrActionEvidence,artifactIncluded:!artifactMissing.some(x=>x.id===c.id)};
});
const deadShipping=components.filter(c=>c.v2x&&c.placement==='script'&&c.artifactIncluded&&c.exports.length>0&&c.runtimeExports.length>0&&!c.actualConsumer&&c.staticTokenConsumers.length===0).map(c=>({id:c.id,source:c.source,exports:c.runtimeExports}));
const linkedButUnexecuted=components.filter(c=>c.v2x&&c.placement==='script'&&c.artifactIncluded&&!c.actualConsumer&&(c.staticTokenConsumers.length>0||c.inboundDependencies.length>0)).map(c=>({id:c.id,source:c.source,staticTokenConsumers:c.staticTokenConsumers,inboundDependencies:c.inboundDependencies}));
const verticalIncomplete=components.filter(c=>c.v2x&&c.placement==='script'&&c.artifactIncluded&&(!c.actualConsumer||!c.visibleOrActionEvidence)).map(c=>({id:c.id,source:c.source,reason:!c.actualConsumer?(c.staticTokenConsumers.length||c.inboundDependencies.length?'LINKED_NOT_EXECUTED_IN_EXACT_ARTIFACT_BROWSER':'NO_ACTUAL_CONSUMER_OBSERVED'):'CONSUMER_OBSERVED_BUT_NO_VISIBLE_OR_ACTION_CONSEQUENCE_CHAIN'}));
const legacyFallbacks=components.filter(c=>/legacy/i.test(`${c.id} ${c.source} ${(c.provides||[]).join(' ')}`)).map(c=>({id:c.id,source:c.source,provides:c.provides}));
const baseline=second.manifest.components||[],baselineBytes=baseline.reduce((n,d)=>n+descriptorBytes(d),0),additiveBytes=extensions.reduce((n,d)=>n+descriptorBytes(d),0);
const bytesByOwner={},bytesBySubsystem={};for(const c of components){bytesByOwner[c.owner]=(bytesByOwner[c.owner]||0)+c.emittedBytes;const parts=c.source.split('/'),subsystem=parts.slice(0,Math.min(parts.length,3)).join('/');bytesBySubsystem[subsystem]=(bytesBySubsystem[subsystem]||0)+c.emittedBytes;}
const componentScriptIds=new Set(browser.before.componentScripts),resourceIds=new Set(browser.before.resources);
const runtimeMarkerMissing=plan.filter(c=>(c.placement==='script'&&!componentScriptIds.has(c.id))||(c.placement==='resource'&&!resourceIds.has(c.id))).map(c=>c.id);
const revisitStable=JSON.stringify(browser.before.ofuKeys)===JSON.stringify(browser.revisit.ofuKeys)&&JSON.stringify([...componentScriptIds].sort())===JSON.stringify(browser.revisit.componentScripts.sort());
const storageObserved=Object.keys(browser.before.localStorage).length+Object.keys(browser.before.sessionStorage).length>0;
const storageKeysStable=JSON.stringify(Object.keys(browser.before.localStorage).sort())===JSON.stringify(Object.keys(browser.revisit.localStorage).sort())&&JSON.stringify(Object.keys(browser.before.sessionStorage).sort())===JSON.stringify(Object.keys(browser.revisit.sessionStorage).sort());
const hardFailures=[];
if(!reproducible)hardFailures.push('NON_REPRODUCIBLE_EXACT_ARTIFACT');
if(second.manifest.artifactBytes!==second.bytes.length||second.manifest.artifactSha256!==second.hash)hardFailures.push('MANIFEST_ARTIFACT_IDENTITY_MISMATCH');
if(artifactMissing.length)hardFailures.push('MANIFESTED_COMPONENT_MISSING_FROM_HTML');
if(manifestMismatches.length)hardFailures.push('COMPONENT_MANIFEST_MISMATCH');
if(parseFailures.length)hardFailures.push('GENERATED_SCRIPT_PARSE_FAILURE');
if(browser.pageErrors.length)hardFailures.push('EXACT_ARTIFACT_PAGEERROR');
if(browser.externalRequests.length)hardFailures.push('EXTERNAL_NETWORK_REQUEST');
if(runtimeMarkerMissing.length)hardFailures.push('RUNTIME_MARKER_MISSING');
if(unshippedDeveloped.length)hardFailures.push('DEVELOPED_SOURCE_UNSHIPPED_WITHOUT_DISPOSITION');
if(duplicateSources.length)hardFailures.push('DUPLICATE_SHIPPING_SOURCE');
if(duplicateImplementations.length)hardFailures.push('DUPLICATE_IMPLEMENTATION_BYTES');
if(deadShipping.length)hardFailures.push('DEAD_SHIPPING_EXPORT');
if(verticalIncomplete.length)hardFailures.push('V2_VERTICAL_REACHABILITY_NOT_PROVEN');
if(!browser.before.canvases.some(c=>c.visible))hardFailures.push('NO_VISIBLE_LIVING_CANVAS');
if(!browser.before.visibleControls)hardFailures.push('NO_VISIBLE_USER_CONTROL');
if(!browser.action.performed)hardFailures.push('NO_LIVING_POINTER_ACTION_TARGET');
if(browser.action.performed&&!browser.action.eventExecutions.length)hardFailures.push('USER_ACTION_NOT_CONSUMED');
if(!revisitStable)hardFailures.push('RUNTIME_REVISIT_NOT_STABLE');
if(storageObserved&&!storageKeysStable)hardFailures.push('PERSISTENCE_KEYS_NOT_STABLE_ON_REVISIT');
const report={schema:'ofu-v2-exact-artifact-falsification-1',status:hardFailures.length?'FAIL':'PASS',sourceSha,sourceTree,authorizedBase:{sha:AUTHORIZED_BASE_SHA,tree:AUTHORIZED_BASE_TREE,status:pointer?.status||'READY_AUTHENTICATED_LIVE_POINTER_METADATA_NOT_IN_EXECUTABLE_BASE',pointerPresentAtLaneHead:!!pointer},artifact:{path:ARTIFACT,bytes:second.bytes.length,sha256:second.hash,reproducible,manifestBytes:second.manifest.artifactBytes,manifestSha256:second.manifest.artifactSha256},composition:{baselineComponentCount:baseline.length,additiveComponentCount:extensions.length,baselineAttributedBytes:baselineBytes,additiveAttributedBytes:additiveBytes,bytesByOwner,bytesBySubsystem},browser:{pageErrors:browser.pageErrors,externalRequests:browser.externalRequests,visibleCanvasCount:browser.before.canvases.filter(c=>c.visible).length,visibleControls:browser.before.visibleControls,runtimeExportCount:browser.runtimeExports.size,userAction:browser.action,revisitStable,storageObserved,storageKeysStable},developedSource:{count:developed.length,unshippedWithoutDisposition:unshippedDeveloped},reachability:{components,deadShipping,linkedButUnexecuted,verticalIncomplete,runtimeMarkerMissing},integrity:{artifactMissing,manifestMismatches,parseFailures,duplicateSources,duplicateImplementations,legacyFallbacks},historicalDelta:{basis:'frozen baseline manifest vs additive extension manifest in exact current artifact',v1BaselineComponents:baseline.length,v2AdditiveComponents:extensions.length,attributedByteDelta:additiveBytes},hardFailures};
fs.mkdirSync(path.dirname(path.join(ROOT,REPORT)),{recursive:true});fs.writeFileSync(path.join(ROOT,REPORT),JSON.stringify(report,null,2)+'\n');
const summary={schema:report.schema,status:report.status,sourceSha,sourceTree,artifact:report.artifact,counts:{developed:developed.length,unshippedDeveloped:unshippedDeveloped.length,components:components.length,v2xComponents:components.filter(c=>c.v2x).length,deadShipping:deadShipping.length,linkedButUnexecuted:linkedButUnexecuted.length,verticalIncomplete:verticalIncomplete.length,parseFailures:parseFailures.length,pageErrors:browser.pageErrors.length,externalRequests:browser.externalRequests.length},hardFailures,unshippedDeveloped:compact(unshippedDeveloped.map(x=>x.path)),deadShipping:compact(deadShipping.map(x=>x.id)),verticalIncomplete:compact(verticalIncomplete.map(x=>x.id)),browserAction:{performed:browser.action.performed,eventExecutions:browser.action.eventExecutions.length,draws:browser.action.draws.length,mutations:browser.action.mutations.length,pixelDeltaObserved:browser.action.pixelDeltaObserved},reportPath:REPORT};
console.log(JSON.stringify(summary));
if(hardFailures.length)process.exitCode=1;

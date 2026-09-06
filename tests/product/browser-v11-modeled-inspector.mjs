import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const sourceSha=process.env.OFU_SOURCE_SHA;if(!sourceSha)throw new Error('OFU_SOURCE_SHA required');
const manifest=JSON.parse(fs.readFileSync('dist/rendering-build-manifest.json','utf8'));assert.equal(manifest.sourceCommit,sourceSha,'exact source build required');
const file=path.resolve('dist/One_File_Universe.html');assert(fs.existsSync(file),'shipping single-file product required');
const evidenceDir=path.resolve('dist/evidence/product-v11');fs.mkdirSync(evidenceDir,{recursive:true});
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();
const errors=[],requests=[];page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,500)));page.on('request',r=>requests.push({url:r.url(),type:r.resourceType(),nav:r.isNavigationRequest()}));
const url=pathToFileURL(file).href;
try{
 await page.goto(url,{waitUntil:'load'});
 await page.waitForFunction(()=>__OFU_BASELINE_REPORT__?.status==='READY'&&OFU?.pxProduct?.snapshot().registry.bindingsSealed&&OFU?.inspectorTest?.state?.current?.type==='Planet'&&OFU?.productUI,{},{timeout:30000});
 const before=await page.evaluate(()=>OFU.pxProduct.captured());
 await page.evaluate(()=>OFU.productUI.workspace('inspect',{focus:false,announceChange:false}));
 await page.waitForFunction(()=>document.getElementById('inspector-modeled-state')?.textContent==='model-derived',{},{timeout:20000});
 const first=await page.evaluate(()=>{
  const I=OFU.inspectorTest.state.current,result=OFU.pxProduct.inspect('v1.inspector.world'),facts=[...document.querySelectorAll('#inspector-modeled-facts .fact')].map(n=>({label:n.querySelector('dt')?.textContent||'',value:n.querySelector('dd')?.textContent||''}));
  return{inspectorId:OFU.p2.hex(I.r.id),provider:result.provider,providerSelection:result.selection.target.entityId,authority:result.authority.class,canonicalPromotion:result.value.canonicalPromotion,state:document.getElementById('inspector-modeled-state')?.textContent,copy:document.getElementById('inspector-modeled-copy')?.textContent,facts,language:OFU.v09InspectorLanguage?.state,afterCapture:OFU.pxProduct.captured()};
 });
 assert.equal(first.provider,'v1.inspector.world');assert.equal(first.providerSelection,first.inspectorId,'modeled provider must follow canonical Inspector selection');assert.equal(first.authority,'MODEL_DERIVED_SIMULATION');assert.equal(first.canonicalPromotion,false);assert.equal(first.state,'model-derived');assert.match(first.copy,/scenario/i);assert.match(first.copy,/separate from canonical P5\/P6 conclusions/i);assert(first.facts.some(x=>x.label==='Authority'&&x.value==='MODEL_DERIVED_SIMULATION'),'visible modeled authority required');assert(first.facts.length>=4,'modeled Inspector should expose useful scenario facts');assert.equal(first.afterCapture.canonicalDigest,before.canonicalDigest,'modeled inspection must not mutate selected canonical digest');assert.equal(first.afterCapture.p4Digest,before.p4Digest,'modeled inspection must not mutate P4 history');assert(first.language?.modeledInvocations>=1,'product runtime must actually consume modeled provider');
 await page.evaluate(()=>OFU.productUI.workspace('explore',{focus:false,announceChange:false}));
 const targetCount=await page.evaluate(()=>OFU.v08ExploreNavigation?.state?.targets?.length||0);
 let selectionUpdate='single-target';
 if(targetCount>1){
  const old=first.inspectorId,index=await page.evaluate(()=>OFU.v08ExploreNavigation.state.selectedIndex===0?1:0);
  await page.click(`[data-explore-target="${index}"]`);
  await page.waitForFunction(old=>OFU.inspectorTest?.state?.current?.type==='Planet'&&OFU.p2.hex(OFU.inspectorTest.state.current.r.id)!==old,old,{timeout:20000});
  await page.evaluate(()=>OFU.productUI.workspace('inspect',{focus:false,announceChange:false}));
  await page.waitForFunction(old=>document.getElementById('inspector-modeled-state')?.textContent==='model-derived'&&OFU.pxProduct.inspect('v1.inspector.world').selection.target.entityId!==old,old,{timeout:20000});
  const second=await page.evaluate(()=>{const I=OFU.inspectorTest.state.current,r=OFU.pxProduct.inspect('v1.inspector.world');return{inspectorId:OFU.p2.hex(I.r.id),providerSelection:r.selection.target.entityId,authority:r.authority.class,state:document.getElementById('inspector-modeled-state')?.textContent,modeledKey:OFU.v09InspectorLanguage.state.modeledKey}});
  assert.equal(second.providerSelection,second.inspectorId);assert.equal(second.authority,'MODEL_DERIVED_SIMULATION');assert.equal(second.state,'model-derived');assert(second.modeledKey?.startsWith(second.inspectorId+'|'),'modeled Inspector cache key must move with canonical selection');selectionUpdate='verified';
 }
 const unexpected=requests.filter(r=>!(r.nav&&r.type==='document'&&r.url===url)&&!['data:','blob:','about:'].some(p=>r.url.startsWith(p)));assert.equal(unexpected.length,0,JSON.stringify(unexpected));assert.deepEqual(errors,[]);
 const evidence={status:'PASS',exactSourceSha:sourceSha,product:'v1.1 modeled Inspector',provider:'v1.inspector.world',authority:'MODEL_DERIVED_SIMULATION',canonicalPromotion:false,visibleAuthority:true,providerSelectionMatchesCanonicalInspector:true,selectionUpdate,canonicalNonInterference:true,p4NonInterference:true,directFile:true,offline:true};fs.writeFileSync(path.join(evidenceDir,'modeled-inspector.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}finally{await context.close();await browser.close()}

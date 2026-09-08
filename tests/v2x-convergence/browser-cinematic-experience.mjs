import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const artifact=path.resolve('dist/One_File_Universe.html');
const out=path.resolve('dist/evidence/cinematic');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const evidence={version:'ofu-v2-cinematic-browser-evidence-1',browser:'chromium',browserVersion:browser.version(),frames:[],network:[],authority:'MEASURED_RUNTIME_EVIDENCE'};

async function boot(viewport,{reducedMotion='no-preference',name='desktop'}={}){
 const context=await browser.newContext({viewport,reducedMotion});
 const page=await context.newPage();
 const badRequests=[],errors=[];
 page.on('request',r=>{const u=r.url();if(!u.startsWith('file:')&&!u.startsWith('blob:')&&!u.startsWith('data:')&&!u.startsWith('about:'))badRequests.push(u);});
 page.on('pageerror',e=>errors.push(String(e.message||e)));
 await page.goto(pathToFileURL(artifact).href,{waitUntil:'load'});
 await page.waitForFunction(()=>OFU?.v1LivingProduct?.snapshot?.().initialized&&OFU?.v2CinematicExperience?.snapshot?.().active&&OFU?.v2CinematicDepth?.snapshot?.().active,{timeout:30000});
 await page.evaluate(()=>OFU.productUI.workspace('explore',{focus:false,announceChange:false}));
 await page.waitForFunction(()=>!document.querySelector('[data-workspace-panel="explore"]').hidden);
 async function waitStage(stage){await page.waitForFunction(s=>OFU.v1LivingProduct.runtime.snapshot().stage===s,stage,{timeout:30000});await page.waitForFunction(()=>{const p=OFU.v1LivingProduct.snapshot(),s=OFU.v1LivingProduct.runtime.snapshot();return p.uiError===null&&p.render.readyRevision===s.revision;},{timeout:30000});}
 async function frame(label){
  await page.waitForTimeout(reducedMotion==='reduce'?20:360);
  const state=await page.evaluate(()=>{
   const stage=document.getElementById('living-stage'),canvas=document.getElementById('living-view'),depth=document.getElementById('v2-cinematic-depth'),title=document.getElementById('living-titlebar'),rail=document.getElementById('living-rail'),sr=stage.getBoundingClientRect(),cr=canvas.getBoundingClientRect(),tr=title.getBoundingClientRect(),rr=rail.getBoundingClientRect(),d=depth.getContext('2d').getImageData(0,0,depth.width,depth.height).data;let depthNonEmpty=0;for(let i=3;i<d.length;i+=Math.max(4,Math.floor(d.length/4096/4)*4))if(d[i])depthNonEmpty++;
   return {stage:stage.dataset.stage,regime:stage.dataset.cinematicRegime,phase:stage.dataset.cinematicPhase,quality:stage.dataset.cinematicQuality,guidance:stage.dataset.cinematicGuidance,stageRect:{left:sr.left,right:sr.right,top:sr.top,bottom:sr.bottom,width:sr.width,height:sr.height},canvasRect:{left:cr.left,right:cr.right,top:cr.top,bottom:cr.bottom,width:cr.width,height:cr.height},titleRect:{left:tr.left,right:tr.right,top:tr.top,bottom:tr.bottom},railRect:{left:rr.left,right:rr.right,top:rr.top,bottom:rr.bottom,height:rr.height},overflow:document.documentElement.scrollWidth-innerWidth,cinema:OFU.v2CinematicExperience.snapshot(),depth:OFU.v2CinematicDepth.snapshot(),render:OFU.v1LivingProduct.snapshot().render,depthNonEmpty,depthStyle:{pointerEvents:getComputedStyle(depth).pointerEvents,mixBlendMode:getComputedStyle(depth).mixBlendMode},reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
  });
  assert.equal(state.cinema.semanticMutation,false);assert.equal(state.cinema.cameraAuthority,false);assert.equal(state.cinema.navigationAuthority,false);assert.equal(state.cinema.networkResources,0);assert.equal(state.depth.semanticMutation,false);assert.equal(state.depth.networkResources,0);assert.equal(state.depth.continuousAnimation,false);assert.equal(state.depth.maxStars,42);assert.equal(state.depthStyle.pointerEvents,'none');assert(state.stageRect.width>0&&state.stageRect.height>0);assert(Math.abs(state.stageRect.width-state.canvasRect.width)<2&&Math.abs(state.stageRect.height-state.canvasRect.height)<2,'world canvas must own the full cinematic stage');assert(state.railRect.left>=state.stageRect.left-1&&state.railRect.right<=state.stageRect.right+1,'scale rail must remain inside stage');assert(state.titleRect.bottom<state.railRect.top,'title safe zone must not collide with depth rail');assert(state.overflow<=1,'cinematic staging must not introduce horizontal overflow');assert(state.render.networkResources===0);assert(state.depthNonEmpty>0,'bounded depth compositor must contribute visible pixels');
  const file=`${name}-${label}-${state.stage.toLowerCase()}.png`;await page.locator('#living-stage').screenshot({path:path.join(out,file)});evidence.frames.push({profile:name,label,file,...state});return state;
 }
 return {context,page,waitStage,frame,badRequests,errors};
}

try{
 const desktop=await boot({width:1440,height:900},{name:'desktop'});await desktop.waitStage('UNIVERSE');let s=await desktop.frame('01-open');assert.equal(s.regime,'MACRO');assert.equal(s.phase,'SETTLED');assert.equal(s.guidance,'VISIBLE');
 await desktop.page.locator('#living-view').dispatchEvent('pointerdown',{pointerId:1,pointerType:'mouse',buttons:1,clientX:500,clientY:400});await desktop.page.waitForFunction(()=>document.getElementById('living-stage').dataset.cinematicGuidance==='DISMISSED');assert.equal(await desktop.page.locator('#v2-cinematic-guide').isHidden(),true,'first-run guidance must yield immediately to user input');
 for(const target of ['GALAXY','REGION','SYSTEM']){await desktop.page.locator(`[data-living-scale="${target}"]`).click();await desktop.waitStage(target);}s=await desktop.frame('02-system');assert.equal(s.regime,'SYSTEM');assert.equal(s.guidance,'DISMISSED');
 await desktop.page.evaluate(()=>{const r=OFU.v1LivingProduct.runtime,s=r.snapshot(),row=s.rows.find(x=>x.kind==='planet')||s.rows.find(x=>x.kind==='moon');if(!row)throw new Error('system has no modeled world for cinematic witness');r.enterBody(row);});await desktop.waitStage('ORBIT');await desktop.page.evaluate(()=>OFU.v1LivingProduct.runtime.approach());await desktop.waitStage('APPROACH');s=await desktop.frame('03-approach');assert.equal(s.regime,'PLANETARY');assert(s.render.gpu===null||s.render.gpu.authority==='PRESENTATION_ONLY');
 const solid=await desktop.page.evaluate(()=>!['GAS_GIANT','ICE_GIANT'].includes(OFU.v1LivingProduct.runtime.snapshot().world.planetology.bulkPriorClass));if(solid){await desktop.page.evaluate(()=>OFU.v1LivingProduct.runtime.at(0,0,{stage:'GLOBAL_SURFACE'}));await desktop.waitStage('GLOBAL_SURFACE');await desktop.page.evaluate(()=>OFU.v1LivingProduct.runtime.scale('REGIONAL_SURFACE'));await desktop.waitStage('REGIONAL_SURFACE');s=await desktop.frame('04-surface');assert.equal(s.regime,'SURFACE');await desktop.page.evaluate(()=>OFU.v1LivingProduct.runtime.scale('LOCAL_SURFACE'));await desktop.waitStage('LOCAL_SURFACE');await desktop.page.evaluate(()=>OFU.v1LivingProduct.runtime.scale('HUMAN'));await desktop.waitStage('HUMAN');s=await desktop.frame('05-human');assert.equal(s.regime,'LOCAL');
 const enteredMicro=await desktop.page.evaluate(()=>{const r=OFU.v1LivingProduct.runtime,s=r.snapshot(),row=s.local?.objects?.find(x=>!['SETTLEMENT','RUIN'].includes(x.kind));if(!row)return false;r.selectObject(row.entityId);r.enterMicro();return true;});if(enteredMicro){await desktop.waitStage('MATERIAL');s=await desktop.frame('06-matter');assert.equal(s.regime,'MICRO');await desktop.page.evaluate(()=>OFU.v1LivingProduct.runtime.deeper());const microStage=await desktop.page.evaluate(()=>OFU.v1LivingProduct.runtime.snapshot().stage);await desktop.waitStage(microStage);s=await desktop.frame('07-micro');assert.equal(s.regime,'MICRO');}}
 assert.equal(desktop.badRequests.length,0,desktop.badRequests.join('\n'));assert.equal(desktop.errors.length,0,desktop.errors.join('\n'));await desktop.context.close();

 const mobile=await boot({width:390,height:844},{name:'mobile'});await mobile.waitStage('UNIVERSE');s=await mobile.frame('01-open');assert.equal(s.quality,'BALANCED');assert(s.railRect.height>=44,'mobile navigation surface must retain touch size');assert(s.stageRect.left>=-1&&s.stageRect.right<=390+1);await mobile.context.close();assert.equal(mobile.badRequests.length,0);assert.equal(mobile.errors.length,0);

 const reduced=await boot({width:1180,height:780},{name:'reduced',reducedMotion:'reduce'});await reduced.waitStage('UNIVERSE');s=await reduced.frame('01-open');assert.equal(s.reduced,true);assert.equal(s.phase,'SETTLED','reduced-motion arrival must not retain cinematic interpolation');await reduced.page.locator('[data-living-scale="GALAXY"]').click();await reduced.waitStage('GALAXY');s=await reduced.frame('02-galaxy');assert.equal(s.phase,'SETTLED');await reduced.context.close();assert.equal(reduced.badRequests.length,0);assert.equal(reduced.errors.length,0);

 evidence.network=[];evidence.summary={status:'PASS',frameCount:evidence.frames.length,profiles:['desktop','mobile','reduced'],singleFile:true,requiredRuntimeNetwork:0,cinematicAuthority:'PRESENTATION_ONLY'};fs.writeFileSync(path.join(out,'cinematic-browser-evidence.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence.summary));
}finally{await browser.close();}

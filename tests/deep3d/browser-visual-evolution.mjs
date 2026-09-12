import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {immutableBrowserArtifact} from '../helpers/immutable-browser-artifact.mjs';

const BASELINE_SHA='4c12e93a216ca386177671c24dc06d63f3713021';
const CANDIDATE_SHA=process.env.OFU_SOURCE_SHA;
assert.match(CANDIDATE_SHA||'',/^[0-9a-f]{40}$/,'OFU_SOURCE_SHA exact candidate required');
const root=process.cwd(),out=path.resolve('dist/evidence/deep3d-visual-evolution',CANDIDATE_SHA),baselineOut=path.join(out,'baseline'),candidateOut=path.join(out,'candidate');
fs.mkdirSync(baselineOut,{recursive:true});fs.mkdirSync(candidateOut,{recursive:true});
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const currentInput=immutableBrowserArtifact({consumer:'deep3d-visual-evolution'});
const tempParent=fs.mkdtempSync(path.join(os.tmpdir(),'ofu-deep3d-ab-')),baselineRoot=path.join(tempParent,'baseline');
const run=(file,args,{cwd=root,env=process.env}={})=>execFileSync(file,args,{cwd,env,stdio:['ignore','pipe','pipe'],encoding:'utf8'});
let baselineAttached=false;

const STAGES=['UNIVERSE','GALAXY','REGION','NEIGHBORHOOD','SYSTEM','ORBIT','APPROACH','GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN','MATERIAL','MICROSTRUCTURE','MOLECULAR','ATOMIC'];
const MOTION_STAGES=new Set(['UNIVERSE','GALAXY','NEIGHBORHOOD','SYSTEM','APPROACH','GLOBAL_SURFACE','HUMAN','MICROSTRUCTURE']);
const PLANET_STAGES=new Set(['ORBIT','APPROACH']);
const slug=value=>String(value).toLowerCase().replaceAll('_','-');

async function openProduct(browser,url,label){
 const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,reducedMotion:'reduce'}),page=await context.newPage(),errors=[],external=[];
 page.on('pageerror',error=>errors.push(String(error?.message||error)));
 page.on('request',request=>{if(/^https?:/i.test(request.url()))external.push(request.url())});
 await context.route(/^https?:\/\//,route=>route.abort('internetdisconnected'));
 await page.goto(url,{waitUntil:'load'});
 await page.waitForFunction(()=>globalThis.OFU?.v1LivingProduct?.snapshot?.().initialized===true,undefined,{timeout:60000});
 await context.setOffline(true);
 assert.equal(await page.evaluate(()=>navigator.onLine),false,label+' must execute offline after direct-file boot');
 return {context,page,errors,external};
}

async function navigate(page,stage,expectDeep3d){
 await page.evaluate(target=>{
  const runtime=OFU.v1LivingProduct.runtime,current=runtime.snapshot();
  if(target==='MATERIAL'){
   if(current.stage!=='HUMAN')runtime.scale('HUMAN');
   const state=runtime.snapshot(),object=state.local?.objects?.find(item=>!['SETTLEMENT','RUIN'].includes(item.kind));
   if(!object)throw new Error('deterministic local material source unavailable');
   if(state.selectedObjectId!==object.entityId)runtime.selectObject(object.entityId);
   runtime.enterMicro(object.entityId);return;
  }
  if(['MICROSTRUCTURE','MOLECULAR','ATOMIC'].includes(target)){
   let guard=5;while(runtime.snapshot().stage!==target&&guard-->0)runtime.deeper();
   if(runtime.snapshot().stage!==target)throw new Error('unable to reach '+target);return;
  }
  if(current.stage!==target)runtime.scale(target);
 },stage);
 await page.waitForFunction(({target,expectDeep3d})=>{
  const product=OFU.v1LivingProduct,state=product.runtime.snapshot(),render=product.renderer.state(),ui=product.snapshot();
  if(state.stage!==target||ui.uiError!==null||render.readyRevision!==state.revision)return false;
  return !expectDeep3d||(render.deep3d?.primaryScale===target&&String(render.primaryPixelBackend||'').startsWith('DEEP3D'));
 },{target:stage,expectDeep3d},{timeout:60000});
 await page.waitForTimeout(80);
}

async function snapshot(page){
 return page.evaluate(()=>{
  const product=OFU.v1LivingProduct,state=product.runtime.snapshot(),render=product.renderer.state(),deep=render.deep3d||null,witness=deep?.lastWitness||null,v2=witness?.v2x13||null,planet=deep?.planet||null,resources=deep?.backend?.v2x13?.resourceManager||null,wrap=document.getElementById('living-canvas-wrap'),macro=document.getElementById('v2-cinematic-macro'),macroState=OFU.v2CinematicMacroDirector?.snapshot?.()||null,z=node=>Number(getComputedStyle(node).zIndex)||0;
  let framebuffer=null;try{framebuffer=product.renderer.capturePrimaryVisualSignal?.()||null}catch{}
  return {
   stage:state.stage,semanticScale:state.semanticScale,revision:state.revision,identity:state.node?.canonicalId||state.node?.entityId||null,selection:state.selectedObjectId||state.body?.canonicalId||state.system?.canonicalId||null,rows:state.rows?.length||0,
   uiError:product.snapshot().uiError,readyRevision:render.readyRevision,frameCount:render.metrics?.frames??null,pickCount:render.pickCount??product.render?.pickCount??0,primaryBackend:render.primaryPixelBackend||null,legacyCanvasPixelsPrimary:deep?.legacyCanvasPixelsPrimary??null,cameraAuthority:deep?.cameraAuthority||render.cameraReadOnly?.authority||null,selectionAuthority:deep?.selectionAuthority||null,
   sceneFingerprint:witness?.sceneFingerprint||planet?.sceneFingerprint||null,packetCount:witness?.packetCount??null,presentationBounds:witness?.presentationBounds||null,depthTest:v2?.depthTest??(planet?.lastWitness?.delegateResult?.admission?.kind==='GLOBE'),lighting:v2?.lighting??(['ORBIT','APPROACH'].includes(state.stage)),drawCalls:v2?.drawCalls??planet?.lastWitness?.delegateResult?.measurements?.drawCalls??null,vertices:v2?.vertices??null,indices:v2?.indices??null,frameBytes:v2?.frameBytes??null,domainCounts:v2?.domainCounts??null,
   resources:resources?{live:resources.liveResources,trackedBytes:resources.trackedBytes,maxTrackedBytes:resources.maxTrackedBytes,accountingExact:resources.accountingExact}:null,framebuffer,layering:{wrapZ:z(wrap),macroZ:z(macro),macroHidden:macro?.hidden??true,deep3dDominates:!macro||macro.hidden||z(wrap)>z(macro),macroNormalPrimaryPath:macroState?.normalPrimaryPath??null,macroLayerRole:macroState?.layerRole??null},
   canvases:[...document.querySelectorAll('#living-canvas-wrap canvas')].map(canvas=>{const style=getComputedStyle(canvas),rect=canvas.getBoundingClientRect();return{id:canvas.id,hidden:canvas.hidden,display:style.display,visibility:style.visibility,opacity:style.opacity,zIndex:style.zIndex,width:rect.width,height:rect.height}})
  };
 });
}

async function motion(page){
 const canvas=page.locator('#living-view'),box=await canvas.boundingBox();assert.ok(box&&box.width>100&&box.height>100,'Living input canvas must be visible');
 const x=box.x+box.width*.54,y=box.y+box.height*.48;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+62,y-36,{steps:5});await page.mouse.up();await page.waitForTimeout(180);
}

async function capture(browser,url,label,directory,expectDeep3d){
 const opened=await openProduct(browser,url,label),rows=[];
 try{
  for(let index=0;index<STAGES.length;index++){
   const stage=STAGES[index];await navigate(opened.page,stage,expectDeep3d);
   const before=await snapshot(opened.page),prefix=String(index+1).padStart(2,'0')+'-'+slug(stage),staticPath=path.join(directory,prefix+'-static.png'),staticBytes=await opened.page.locator('#living-canvas-wrap').screenshot({path:staticPath}),staticSha256=sha(staticBytes);
   let dynamic=null;if(MOTION_STAGES.has(stage)){await motion(opened.page);const after=await snapshot(opened.page),motionPath=path.join(directory,prefix+'-motion.png'),motionBytes=await opened.page.locator('#living-canvas-wrap').screenshot({path:motionPath});dynamic={screenshot:path.relative(out,motionPath).replaceAll('\\','/'),sha256:sha(motionBytes),changed:sha(motionBytes)!==staticSha256,frameAdvanced:Number(after.frameCount)>Number(before.frameCount),sceneFingerprintStable:after.sceneFingerprint===before.sceneFingerprint,framebufferChanged:Boolean(before.framebuffer&&after.framebuffer&&before.framebuffer.signature!==after.framebuffer.signature),after};}
   rows.push({stage,screenshot:path.relative(out,staticPath).replaceAll('\\','/'),sha256:staticSha256,static:before,dynamic});
  }
  await opened.page.evaluate(()=>OFU.v1LivingProduct.runtime.scale('UNIVERSE'));await navigate(opened.page,'UNIVERSE',expectDeep3d);
  const reverse=await snapshot(opened.page);assert.equal(reverse.stage,'UNIVERSE');
  assert.equal(opened.errors.length,0,label+' page errors: '+opened.errors.join('\n'));assert.equal(opened.external.length,0,label+' external requests: '+opened.external.join('\n'));
  return {label,rows,reverse,errors:opened.errors,externalRequests:opened.external,directFile:true,offlineRuntime:true};
 }finally{await opened.context.close()}
}

try{
 run('git',['worktree','add','--detach',baselineRoot,BASELINE_SHA]);baselineAttached=true;
 run(process.execPath,['tools/build-ofu-rendering-v09.mjs'],{cwd:baselineRoot,env:{...process.env,OFU_SOURCE_SHA:BASELINE_SHA}});
 const baselineArtifact=path.join(baselineRoot,'dist','One_File_Universe.html'),baselineManifest=JSON.parse(fs.readFileSync(path.join(baselineRoot,'dist','rendering-build-manifest.json'),'utf8')),baselineBytes=fs.readFileSync(baselineArtifact);
 assert.equal(baselineManifest.sourceCommit,BASELINE_SHA);assert.equal(baselineManifest.artifactSha256,sha(baselineBytes));
 const browser=await chromium.launch({headless:true});let baseline,candidate;
 try{baseline=await capture(browser,pathToFileURL(baselineArtifact).href,'pre-deep3d-baseline',baselineOut,false);candidate=await capture(browser,pathToFileURL(currentInput.artifactPath).href,'deep3d-candidate',candidateOut,true)}finally{await browser.close()}
 const matrix=STAGES.map(stage=>{
  const before=baseline.rows.find(row=>row.stage===stage),after=candidate.rows.find(row=>row.stage===stage),planet=PLANET_STAGES.has(stage),bounds=after.static.presentationBounds,motionRow=after.dynamic;
  const deep3dPrimary=String(after.static.primaryBackend||'').startsWith('DEEP3D')&&after.static.legacyCanvasPixelsPrimary===false,materiallyDifferent=before.sha256!==after.sha256,depth=planet||Boolean(bounds&&bounds.nonDegenerateAxes===3),volumetric=planet||Boolean(bounds?.volumetric),parallax=!MOTION_STAGES.has(stage)||Boolean(motionRow?.changed&&(motionRow.frameAdvanced||motionRow.framebufferChanged)),bounded=!after.static.resources||after.static.resources.accountingExact===true&&after.static.resources.trackedBytes<=after.static.resources.maxTrackedBytes,continuity=after.static.uiError===null&&after.static.readyRevision===after.static.revision,layerOwnership=after.static.layering.deep3dDominates&&after.static.layering.macroNormalPrimaryPath===false;
  const fb=after.static.framebuffer,coverage=planet?null:Number(fb?.coveragePpm||0),visualBounds=fb?.bounds||null,macro=['UNIVERSE','GALAXY','REGION','NEIGHBORHOOD'].includes(stage),surface=['GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE'].includes(stage),local=stage==='HUMAN',micro=['MATERIAL','MICROSTRUCTURE','MOLECULAR','ATOMIC'].includes(stage),sparseMaterial=stage==='MATERIAL',minCoverage=macro?5000:stage==='SYSTEM'?8000:surface?70000:local?90000:micro?1000:0,minWidthFraction=sparseMaterial ? .035 : micro ? .05 : .08,minHeightFraction=sparseMaterial ? .035 : .045,framed=planet||Boolean(visualBounds&&visualBounds.width>=fb.width*minWidthFraction&&visualBounds.height>=fb.height*minHeightFraction),centered=!sparseMaterial||Boolean(visualBounds&&(visualBounds.minX+visualBounds.maxX)/2>fb.width*.35&&(visualBounds.minX+visualBounds.maxX)/2<fb.width*.65&&(visualBounds.minY+visualBounds.maxY)/2>fb.height*.25&&(visualBounds.minY+visualBounds.maxY)/2<fb.height*.75),grounded=!surface&&!local||Boolean(visualBounds&&visualBounds.minY<fb.height*.28&&visualBounds.maxY<fb.height*.92),lit=planet||macro||after.static.lighting===true,rich=(planet||macro)?Number(after.static.packetCount)>=3:stage==='SYSTEM'?Number(after.static.packetCount)>=4:surface?Number(after.static.packetCount)>=1:local?Number(after.static.packetCount)>=3:micro?Number(after.static.packetCount)>=(sparseMaterial?2:1):true,meaningful=planet||coverage>=minCoverage&&framed&&centered&&grounded&&lit&&rich;
  const verdict=deep3dPrimary&&materiallyDifferent&&depth&&parallax&&bounded&&continuity&&layerOwnership&&meaningful?'PASS':planet&&deep3dPrimary&&depth&&parallax&&bounded&&continuity&&layerOwnership?'PASS_SPECIALIZED_PLANET_CONTINUITY':'FAIL';
  return {stage,deep3dPrimary,materiallyDifferent,depth,volumetric,parallax,coveragePpm:coverage,minCoveragePpm:minCoverage,framed,centered,grounded,lit,layerOwnership,lod:'BOUNDED_PROVIDER_DERIVED',visualRichness:after.static.packetCount??'SPECIALIZED_PLANET_GLOBE',continuity,resourceBounded:bounded,meaningful,verdict,baselineScreenshot:before.screenshot,candidateScreenshot:after.screenshot};
 });
 fs.writeFileSync(path.join(out,'comparison-diagnostics.json'),JSON.stringify({schema:'ofu-deep3d-visual-evolution-diagnostics-1',baselineSha:BASELINE_SHA,candidateSha:CANDIDATE_SHA,matrix},null,2)+'\n');
 for(const row of matrix){assert.equal(row.deep3dPrimary,true,row.stage+' must use a Deep3D primary product path');assert.equal(row.depth,true,row.stage+' must expose three-axis depth structure');assert.equal(row.parallax,true,row.stage+' deterministic camera sequence must visibly change the composed scene');assert.equal(row.layerOwnership,true,row.stage+' Deep3D pixels must dominate any cinematic underlay');assert.equal(row.meaningful,true,row.stage+' must meet scale-specific framing, coverage, lighting, and richness criteria');assert.equal(row.resourceBounded,true,row.stage+' resource accounting must remain bounded');assert.notEqual(row.verdict,'FAIL',row.stage+' failed Deep3D visual evolution')}
 const biologicalCellular={stage:'BIOLOGICAL_CELLULAR',verdict:'NOT_APPLICABLE_NO_DISTINCT_SHIPPING_STAGE',authority:'MODELED_BIOLOGY_REMAINS_SOURCE_CONTEXT; NO CELLULAR GEOMETRY IS FABRICATED'};
 const verified=currentInput.verify(),evidence={schema:'ofu-deep3d-visual-evolution-evidence-1',status:'PASS',baseline:{sha:BASELINE_SHA,tree:run('git',['rev-parse',BASELINE_SHA+'^{tree}']).trim(),artifactBytes:baselineBytes.length,artifactSha256:sha(baselineBytes)},candidate:{sha:CANDIDATE_SHA,tree:run('git',['rev-parse',CANDIDATE_SHA+'^{tree}']).trim(),artifactBytes:verified.bytes,artifactSha256:verified.sha256,artifactHashBeforeEqualsAfter:verified.hashBeforeEqualsAfter},browser:{engine:'chromium',version:chromium.name(),viewport:{width:1280,height:800},dpr:1,reducedMotion:true},deterministicInputs:{seed:'PRODUCT_CANONICAL_DEFAULT',cameraSequence:'OFU-DEEP3D-AB-POINTER-DRAG-1',qualityProfile:'DESKTOP_BOUNDED',networkRequired:false},matrix:[...matrix,biologicalCellular],baselineRun:baseline,candidateRun:candidate,claims:{semanticDeterminism:true,pixelIdentityClaim:false,physicalCoordinateClaim:false,scientificAuthorityPromotion:false,singleCameraAuthority:true,legacyCanvasNormalPrimaryPath:false},limitations:['GPU raster bytes are browser/backend specific; semantic scene fingerprints and bounds are the deterministic witnesses.','Biological/cellular rendering is not claimed as a separate shipping stage when the selected modeled source does not authorize it.','Human visual review complements this executable gate and is not replaced by raw pixel difference.']};
 fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
 const header='| Scale | Deep3D primary | A/B materially different | Depth | Volumetric | Parallax | Coverage ppm | Framed | Grounded | Layer ownership | LOD | Visual richness | Continuity | Verdict |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n',body=matrix.map(row=>`| ${row.stage} | ${row.deep3dPrimary?'YES':'NO'} | ${row.materiallyDifferent?'YES':'NO'} | ${row.depth?'YES':'NO'} | ${row.volumetric?'YES':'NO'} | ${row.parallax?'YES':'NO'} | ${row.coveragePpm??'SPECIALIZED'} | ${row.framed?'PASS':'FAIL'} | ${row.grounded?'PASS':'FAIL'} | ${row.layerOwnership?'PASS':'FAIL'} | ${row.lod} | ${row.visualRichness} | ${row.continuity?'PASS':'FAIL'} | ${row.verdict} |`).join('\n');
 fs.writeFileSync(path.join(out,'matrix.md'),'# Deep3D visual evolution — exact A/B\n\nBaseline `'+BASELINE_SHA+'` vs candidate `'+CANDIDATE_SHA+'`.\n\n'+header+body+'\n\nBiological/cellular: '+biologicalCellular.verdict+'.\n');
 console.log(JSON.stringify({status:evidence.status,schema:evidence.schema,baseline:evidence.baseline,candidate:evidence.candidate,scales:matrix.length,passes:matrix.filter(row=>row.verdict.startsWith('PASS')).length,evidence:path.relative(root,path.join(out,'evidence.json')).replaceAll('\\','/')}));
}finally{
 if(baselineAttached)try{run('git',['worktree','remove','--force',baselineRoot])}catch{}
 try{fs.rmSync(tempParent,{recursive:true,force:true})}catch{}
}

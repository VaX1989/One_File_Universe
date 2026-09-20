import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {
  createProductPathDiagnostics,
  enterSupportedOrbit,
  enterHumanWithSelectedSample,
  requestTravelAccepted,
  waitForSemanticStage
} from './r6-w0-phase2-product-path.mjs';

const root=process.cwd();
const artifact=path.join(root,'dist','One_File_Universe_Spatial_Continuum.html');
const evidenceDir=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','product-visual-continuity'));
fs.mkdirSync(evidenceDir,{recursive:true});
assert.ok(fs.existsSync(artifact),'build:continuum must run before PRODUCT-VISUAL-CONTINUITY');

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}});
const page=await context.newPage();
const diagnostics=createProductPathDiagnostics(page,{evidenceDir,suite:'product-visual-continuity'});
const errors=[];
page.on('pageerror',e=>errors.push(String(e.stack||e)));
page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
const snap=()=>page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());

function invariant(state,label,{worldIdentity=null,surfaceIdentity=null,sourceSampleIdentity=null}={}){
  assert.equal(state.render.sceneCount,1,label+': exactly one scene');
  assert.equal(state.render.cameraCount,1,label+': exactly one camera');
  assert.equal(state.render.rendererOwnedPicking,true,label+': picking remains renderer-owned');
  if(state.runtimeNetworkResources!==undefined)assert.equal(state.runtimeNetworkResources,0,label+': no runtime network resource');
  if(worldIdentity!==null)assert.equal(state.worldIdentity,worldIdentity,label+': world identity continuity');
  if(surfaceIdentity!==null&&state.openUniverse?.surfaceIdentity!==null&&state.openUniverse?.surfaceIdentity!==undefined)
    assert.equal(state.openUniverse.surfaceIdentity,surfaceIdentity,label+': surface identity continuity');
  if(sourceSampleIdentity!==null&&state.sourceSampleIdentity!==null&&state.sourceSampleIdentity!==undefined)
    assert.equal(state.sourceSampleIdentity,sourceSampleIdentity,label+': source sample continuity');
}

async function temporalTravel(stage,identity,label=stage){
  const before=await snap();
  invariant(before,label+':before',identity);
  const {after}=await requestTravelAccepted(page,stage,{diagnostics,label});
  const target=Number(after.state.scale.targetCoordinate);
  let previous=Number(after.state.scale.coordinate);
  const direction=Math.sign(target-previous);
  const frames=[{stage:after.state.scale.semanticStage,targetStage:after.state.scale.targetStage,coordinate:previous,moving:after.state.scale.moving}];
  invariant(after,label+':request',identity);
  const deadline=Date.now()+25000;
  while(Date.now()<deadline){
    const state=await snap();
    const coordinate=Number(state.state.scale.coordinate);
    invariant(state,label+':frame-'+frames.length,identity);
    if(direction>0)assert.ok(coordinate+1e-9>=previous,label+': no reverse jump while moving inward');
    if(direction<0)assert.ok(coordinate-1e-9<=previous,label+': no reverse jump while moving outward');
    assert.ok(Math.abs(target-coordinate)<=Math.abs(target-previous)+1e-7,label+': every sampled frame converges toward target');
    previous=coordinate;
    frames.push({stage:state.state.scale.semanticStage,targetStage:state.state.scale.targetStage,coordinate,moving:state.state.scale.moving});
    if(state.state.scale.semanticStage===stage&&state.state.scale.moving===false)break;
    await page.waitForTimeout(16);
  }
  const settled=await waitForSemanticStage(page,stage,{timeout:1000});
  invariant(settled,label+':settled',identity);
  assert.equal(settled.state.scale.targetStage,stage,label+': committed target stage');
  assert.equal(settled.state.scale.moving,false,label+': semantic visual settlement');
  assert.ok(frames.length>=1,label+': temporal witness exists');
  fs.writeFileSync(path.join(evidenceDir,'timeline-'+label.toLowerCase().replaceAll('_','-')+'.json'),JSON.stringify(frames,null,2)+'\n');
  return settled;
}

try{
  await page.goto(pathToFileURL(artifact).href,{waitUntil:'load'});
  await page.waitForFunction(()=>globalThis.__OFU_SPATIAL_CONTINUUM__?.snapshot?.().status==='READY',undefined,{timeout:120000});

  const orbit=await enterSupportedOrbit(page,{diagnostics,timeout:30000});
  const macroSettled=new Set(diagnostics.timeline.filter(x=>String(x.step).endsWith(':settled')).map(x=>x.state?.stage));
  for(const stage of ['GALAXY','REGION','NEIGHBORHOOD','SYSTEM','ORBIT'])
    assert.ok(macroSettled.has(stage),'macro path must visibly settle '+stage);
  invariant(orbit,'orbit');
  const worldIdentity=orbit.worldIdentity;
  assert.ok(worldIdentity,'ORBIT establishes selected world identity');

  let state=await temporalTravel('APPROACH',{worldIdentity},'APPROACH');
  state=await temporalTravel('GLOBAL_SURFACE',{worldIdentity},'GLOBAL_SURFACE');
  const coarseSurfaceIdentity=state.openUniverse?.surfaceIdentity||null;
  state=await temporalTravel('REGIONAL_SURFACE',{worldIdentity,surfaceIdentity:coarseSurfaceIdentity},'REGIONAL_SURFACE');
  state=await temporalTravel('LOCAL_SURFACE',{worldIdentity,surfaceIdentity:coarseSurfaceIdentity},'LOCAL_SURFACE');

  const human=await enterHumanWithSelectedSample(page,{diagnostics,timeout:30000});
  // HUMAN arrival is a representation handoff and must preserve the selected coarse surface exactly.
  invariant(human.human,'HUMAN:pre-sample',{worldIdentity,surfaceIdentity:coarseSurfaceIdentity});
  const sourceSampleIdentity=human.sampleId;
  assert.ok(sourceSampleIdentity,'HUMAN establishes exact source sample');
  // Selecting a concrete ROCK is an intentional semantic refinement, not a representation teleport.
  // It may refine SURFACE_LOCATION while the same planet ancestry and exact sample identity remain stable.
  invariant(human.state,'HUMAN:sample-selected',{worldIdentity,sourceSampleIdentity});
  assert.equal(human.state.openUniverse?.focusId,sourceSampleIdentity,'HUMAN selected sample remains the exact focus');
  assert.equal(human.state.openUniverse?.focusKind,'ROCK','HUMAN selected source sample retains its governed kind');
  const refinedSurfaceIdentity=human.state.openUniverse?.surfaceIdentity||null;
  assert.ok(refinedSurfaceIdentity,'sample selection establishes an exact refined surface location');
  const refinedAddress=String(human.state.openUniverse?.currentAddress?.serialized||human.state.openUniverse?.currentAddress||'');
  assert.ok(refinedAddress.includes('/planet:'+worldIdentity+'/'),'refined sample address preserves exact planet ancestry');
  assert.ok(refinedAddress.includes('/surface_location:'+refinedSurfaceIdentity+'/'),'refined sample address binds its exact local surface');
  assert.ok(refinedAddress.endsWith('/rock:'+sourceSampleIdentity),'refined sample address terminates at the exact source sample');

  for(const stage of ['MATERIAL','MICROSTRUCTURE','MOLECULAR','ATOMIC'])
    state=await temporalTravel(stage,{worldIdentity,surfaceIdentity:refinedSurfaceIdentity,sourceSampleIdentity},stage);

  for(const stage of ['MOLECULAR','MICROSTRUCTURE','MATERIAL','HUMAN'])
    state=await temporalTravel(stage,{worldIdentity,surfaceIdentity:refinedSurfaceIdentity,sourceSampleIdentity},'REVERSE_'+stage);
  for(const stage of ['LOCAL_SURFACE','REGIONAL_SURFACE','GLOBAL_SURFACE','ORBIT'])
    state=await temporalTravel(stage,{worldIdentity},'REVERSE_'+stage);

  // Interrupt a long inward flight and demand an outward SYSTEM recovery.
  await temporalTravel('UNIVERSE',{worldIdentity,sourceSampleIdentity},'REVERSE_UNIVERSE');
  const beforeInterrupt=await snap();
  const req=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.travelTo('ATOMIC'));
  assert.ok(req===true||req?.targetStage==='ATOMIC'||req?.semanticStage==='ATOMIC','ATOMIC interrupt flight accepted');
  await page.waitForFunction(()=>{const s=__OFU_SPATIAL_CONTINUUM__.snapshot();return s.state.scale.targetStage==='ATOMIC'&&s.state.scale.moving===true},undefined,{timeout:10000});
  const during=await snap();
  invariant(during,'interrupt:atomic-flight',{worldIdentity,sourceSampleIdentity});
  assert.ok(during.state.scale.coordinate<14,'interrupt witness occurs before ATOMIC arrival');
  const reverseReq=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.travelTo('SYSTEM'));
  assert.ok(reverseReq===true||reverseReq?.targetStage==='SYSTEM'||reverseReq?.semanticStage==='SYSTEM','SYSTEM reversal accepted during inward flight');
  const recovered=await waitForSemanticStage(page,'SYSTEM',{timeout:25000});
  invariant(recovered,'interrupt:recovered',{worldIdentity,sourceSampleIdentity});
  assert.equal(recovered.state.scale.moving,false);
  assert.deepEqual(errors,[],'visual continuity emits no page/console errors');

  const report={
    schema:'ofu-product-visual-continuity-evidence-v1',
    prompt_id:'PRODUCT-VISUAL-CONTINUITY',
    status:'PASS',
    source_sha:process.env.OFU_SOURCE_SHA||null,
    path:['UNIVERSE','GALAXY','REGION','NEIGHBORHOOD','SYSTEM','ORBIT','APPROACH','GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN','MATERIAL','MICROSTRUCTURE','MOLECULAR','ATOMIC'],
    reverse_verified:true,
    interruption_verified:true,
    one_scene:true,
    one_camera:true,
    renderer_owned_picking:true,
    world_identity:worldIdentity,
    surface_identity:{coarse:coarseSurfaceIdentity,refined:refinedSurfaceIdentity},
    source_sample_identity:sourceSampleIdentity,
    offline_direct_file:true,
    authority:'PRESENTATION_ONLY',
    physical_gpu_evidence:false,
    before_interrupt:{stage:beforeInterrupt.state.scale.semanticStage,coordinate:beforeInterrupt.state.scale.coordinate},
    during_interrupt:{stage:during.state.scale.semanticStage,targetStage:during.state.scale.targetStage,coordinate:during.state.scale.coordinate},
    recovered:{stage:recovered.state.scale.semanticStage,coordinate:recovered.state.scale.coordinate}
  };
  fs.writeFileSync(path.join(evidenceDir,'product-visual-continuity-results.json'),JSON.stringify(report,null,2)+'\n');
  console.log('PRODUCT_VISUAL_CONTINUITY='+JSON.stringify(report));
}finally{
  await context.close();
  await browser.close();
}

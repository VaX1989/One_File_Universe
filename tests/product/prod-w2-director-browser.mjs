import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {createDirector,createJourneyDescriptor} from '../../src/product/exploration/director/governed-director.js';
import {createProductPathDiagnostics,enterSupportedOrbit} from '../spatial-continuum/r6-w0-phase2-product-path.mjs';

const root=process.cwd();
const artifact=path.join(root,'dist','One_File_Universe_Spatial_Continuum.html');
const evidenceDir=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','prod-w2-director-browser'));
fs.mkdirSync(evidenceDir,{recursive:true});

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}});
const page=await context.newPage();
await page.emulateMedia({reducedMotion:'reduce'});
const errors=[],network=[];
page.on('pageerror',error=>errors.push(String(error.stack||error)));
page.on('console',message=>{if(message.type()==='error')errors.push('console: '+message.text())});
page.on('request',request=>{if(/^https?:/i.test(request.url()))network.push(request.url())});
const diagnostics=createProductPathDiagnostics(page,{evidenceDir:path.join(evidenceDir,'path'),suite:'prod-w2-director-browser'});

try{
  await page.goto(pathToFileURL(artifact).href,{waitUntil:'load'});
  await page.waitForFunction(()=>globalThis.__OFU_SPATIAL_CONTINUUM__?.snapshot?.().status==='READY',undefined,{timeout:120000});
  const capability=await page.evaluate(()=>({
    travelTo:typeof __OFU_SPATIAL_CONTINUUM__.travelTo,
    waitForSettled:typeof __OFU_SPATIAL_CONTINUUM__.waitForSettled,
    createBookmark:typeof __OFU_SPATIAL_CONTINUUM__.createBookmark,
    restoreBookmark:typeof __OFU_SPATIAL_CONTINUUM__.restoreBookmark
  }));
  assert.deepEqual(capability,{travelTo:'function',waitForSettled:'function',createBookmark:'function',restoreBookmark:'function'},'Director requires existing Continuum navigation/bookmark authority');

  const orbit=await enterSupportedOrbit(page,{diagnostics,timeout:30000});
  const worldIdentity=orbit.worldIdentity;
  assert.ok(worldIdentity,'browser journey requires an authoritative world identity');

  const stages=['APPROACH','GLOBAL_SURFACE','APPROACH'];
  const plans=stages.map((stage,index)=>({
    contract:'ofu-prod-w1-atlas-revisit-plan-1',
    authority:'REFERENCE_ONLY',
    atlasEntryId:'obs-browser-'+String(index).padStart(16,'0'),
    kind:'PLACE',
    subject:{canonicalId:worldIdentity},
    temporalRef:null,
    scientificFingerprintRef:null,
    returnRef:{authority:'PRESENTATION_ONLY',semanticScale:stage,distanceIntentRadii:stage==='APPROACH'?1.5:1},
    exactTemporalStateReference:false,
    presentationHintOnly:true,
    mutatesWorld:false,
    mutatesSelection:false,
    mutatesCamera:false
  }));
  const route={id:'route-browser-0000000000000001',label:'Browser authority journey',entryIds:plans.map(x=>x.atlasEntryId)};
  const atlas={
    getRoute:id=>id===route.id?route:null,
    revisitPlan:id=>plans.find(x=>x.atlasEntryId===id)??(()=>{throw new Error('unknown browser Atlas entry')})()
  };
  const descriptor=createJourneyDescriptor({atlas,routeId:route.id});

  const navigator={
    snapshot:()=>page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot()),
    captureBookmark:()=>page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.createBookmark()),
    restoreBookmark:bookmark=>page.evaluate(value=>__OFU_SPATIAL_CONTINUUM__.restoreBookmark(value),bookmark),
    navigateAtlasPlan:plan=>page.evaluate(stage=>__OFU_SPATIAL_CONTINUUM__.travelTo(stage),plan.returnRef.semanticScale),
    waitForSettled:()=>page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.waitForSettled(30000))
  };

  const director=createDirector({atlas,navigator});
  const before=await navigator.snapshot();
  assert.equal(before.render.sceneCount,1);
  assert.equal(before.render.cameraCount,1);
  assert.equal(before.render.rendererOwnedPicking,true);
  assert.equal(before.runtimeNetworkResources,0);

  const result=await director.run(descriptor,{reducedMotion:true});
  assert.equal(result.status,'COMPLETE');
  assert.equal(result.completedStops,3);
  assert.equal(result.final.worldIdentity,worldIdentity);
  assert.equal(result.final.semanticStage,'APPROACH');
  assert.equal(result.final.sceneCount,1);
  assert.equal(result.final.cameraCount,1);
  assert.equal(result.final.rendererOwnedPicking,true);
  assert.equal(result.final.runtimeNetworkResources,0);
  assert.equal(result.captures.length,3);

  const restored=await director.restore(result.originBookmark);
  assert.equal(restored.semanticStage,before.state.scale.semanticStage);
  assert.equal(restored.worldIdentity,worldIdentity);
  assert.equal(restored.sceneCount,1);
  assert.equal(restored.cameraCount,1);
  assert.equal(restored.rendererOwnedPicking,true);
  assert.deepEqual(network,[]);
  assert.deepEqual(errors,[]);

  const output={
    schema:'ofu-prod-w2-director-browser-v1',
    status:'PASS',
    descriptorId:descriptor.descriptorId,
    routeStops:descriptor.stops.length,
    worldIdentity,
    startStage:before.state.scale.semanticStage,
    finalStage:result.final.semanticStage,
    restoredStage:restored.semanticStage,
    captures:result.captures.length,
    reducedMotionMedia:true,
    invariants:{sceneCount:1,cameraCount:1,rendererOwnedPicking:true,runtimeNetworkResources:0},
    directFile:true,
    networkRequests:network.length
  };
  fs.writeFileSync(path.join(evidenceDir,'prod-w2-director-browser-results.json'),JSON.stringify(output,null,2)+'\n');
  console.log(JSON.stringify(output));
}finally{
  await context.close();
  await browser.close();
}

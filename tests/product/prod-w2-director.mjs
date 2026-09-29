import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  W1_OBSERVATION_KIND,
  createCanonicalEntityRef,
  createReturnRef,
  createSavedObservation
} from '../../src/product/contracts/w1-observation-contracts.js';
import {createAtlasCore} from '../../src/product/w1/atlas-core.js';
import {
  DIRECTOR_AUTHORITY,
  DIRECTOR_CAPTURE_AUTHORITY,
  DIRECTOR_DESCRIPTOR_CONTRACT,
  createDirector,
  createJourneyDescriptor
} from '../../src/product/exploration/director/governed-director.js';

const h=n=>n.toString(16).padStart(64,'0');
const subject=createCanonicalEntityRef({
  universeId:'director-universe',
  entityKind:'planet',
  canonicalId:h(1),
  canonicalKey:{galaxyX:1,galaxyY:2,galaxyZ:3,sectorX:4,sectorY:5,sectorZ:6,siteX:7,siteY:8,siteZ:9,orbitSlot:2}
});
const atlas=createAtlasCore({limits:{maxEntries:8,maxRoutes:4,maxRouteStops:8,maxSerializedBytes:65536}});
const stages=['ORBIT','APPROACH','GLOBAL_SURFACE'];
const entries=stages.map((semanticScale,index)=>atlas.saveObservation(createSavedObservation({
  kind:W1_OBSERVATION_KIND.PLACE,
  subject,
  label:'Director stop '+index,
  returnRef:createReturnRef({semanticScale,distanceIntentRadii:1.25+index*0.25})
})));
const route=atlas.createRoute({label:'Governed scientific journey',entryIds:entries.map(x=>x.id)});

const descriptor=createJourneyDescriptor({atlas,routeId:route.id});
assert.equal(descriptor.contract,DIRECTOR_DESCRIPTOR_CONTRACT);
assert.equal(descriptor.authority,DIRECTOR_AUTHORITY);
assert.equal(descriptor.stops.length,3);
assert.equal(descriptor.capture.authority,DIRECTOR_CAPTURE_AUTHORITY);
assert.equal(descriptor.mutations.cameraAuthority,false);
assert.equal(descriptor.mutations.timeline,false);
assert.equal(descriptor.networkRequired,false);

const restoredAtlas=createAtlasCore({initialBundle:atlas.exportBundle()});
assert.deepEqual(createJourneyDescriptor({atlas:restoredAtlas,routeId:route.id}),descriptor,'journey descriptor must be byte/digest deterministic across Atlas restore');

function fakeNavigator({abortAfter=null,violateCamera=false}={}){
  let state={
    state:{scale:{semanticStage:'ORBIT',targetStage:'ORBIT',moving:false}},
    worldIdentity:h(1),
    openUniverse:{focusId:h(1)},
    render:{sceneCount:1,cameraCount:1,rendererOwnedPicking:true},
    runtimeNetworkResources:0
  };
  let navigations=0,restores=0,reducedMotionCalls=0;
  return {
    snapshot:async()=>structuredClone(state),
    captureBookmark:async()=>structuredClone(state),
    restoreBookmark:async bookmark=>{state=structuredClone(bookmark);restores++},
    navigateAtlasPlan:async(plan,{reducedMotion}={})=>{
      navigations++;
      if(reducedMotion)reducedMotionCalls++;
      state.state.scale.semanticStage=plan.returnRef.semanticScale;
      state.state.scale.targetStage=plan.returnRef.semanticScale;
      state.worldIdentity=plan.subject.canonicalId;
      state.openUniverse.focusId=plan.subject.canonicalId;
      if(violateCamera)state.render.cameraCount=2;
      if(abortAfter&&navigations>=abortAfter)abortAfter.controller.abort();
    },
    waitForSettled:async()=>{},
    metrics:()=>({navigations,restores,reducedMotionCalls,state:structuredClone(state)})
  };
}

const nav=fakeNavigator(),director=createDirector({atlas,navigator:nav});
const result=await director.run(descriptor,{reducedMotion:false});
assert.equal(result.status,'COMPLETE');
assert.equal(result.completedStops,3);
assert.equal(result.final.semanticStage,'GLOBAL_SURFACE');
assert.equal(result.final.worldIdentity,h(1));
assert.equal(result.captures.length,3);
assert.ok(result.captures.every(x=>x.authority===DIRECTOR_CAPTURE_AUTHORITY));
assert.equal(nav.metrics().navigations,3);
assert.equal(nav.metrics().restores,0);

const restored=await director.restore(result.originBookmark);
assert.equal(restored.semanticStage,'ORBIT');
assert.equal(restored.worldIdentity,h(1));
assert.equal(nav.metrics().restores,1);

const reduced=fakeNavigator(),reducedDirector=createDirector({atlas,navigator:reduced});
const reducedResult=await reducedDirector.run(descriptor,{reducedMotion:true});
assert.equal(reducedResult.status,'COMPLETE');
assert.equal(reducedResult.final.semanticStage,result.final.semanticStage);
assert.equal(reducedResult.final.worldIdentity,result.final.worldIdentity);
assert.equal(reduced.metrics().reducedMotionCalls,3,'reduced-motion preference must be delegated to existing navigation authority');

const controller=new AbortController();
const cancelNav=fakeNavigator(),originalNavigate=cancelNav.navigateAtlasPlan.bind(cancelNav);let first=true;
cancelNav.navigateAtlasPlan=async(plan,options)=>{await originalNavigate(plan,options);if(first){first=false;controller.abort()}};
const cancelDirector=createDirector({atlas,navigator:cancelNav});
const cancelled=await cancelDirector.run(descriptor,{signal:controller.signal});
assert.equal(cancelled.status,'CANCELLED_RESTORED');
assert.equal(cancelled.completedStops,1);
assert.equal(cancelled.restored.semanticStage,'ORBIT');
assert.equal(cancelled.restored.worldIdentity,h(1));
assert.equal(cancelNav.metrics().restores,1);

const badNav=fakeNavigator({violateCamera:true}),badDirector=createDirector({atlas,navigator:badNav});
await assert.rejects(()=>badDirector.run(descriptor),/more than one camera/);
assert.equal(badNav.metrics().restores,1,'authority violation must restore origin');

const tampered=JSON.parse(JSON.stringify(descriptor));
tampered.stops[0].subjectCanonicalId=h(9);
await assert.rejects(()=>director.run(tampered),/hash\/content mismatch/);
assert.throws(()=>createJourneyDescriptor({atlas,routeId:'route-0000000000000000'}),/unknown Atlas route/);
assert.throws(()=>createDirector({atlas,navigator:{}}),/navigation authority adapter is incomplete/);

const source=fs.readFileSync(new URL('../../src/product/exploration/director/governed-director.js',import.meta.url),'utf8');
for(const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'new BABYLON', 'new THREE', 'requestAnimationFrame(', 'setInterval(']){
  assert.equal(source.includes(forbidden),false,'Director must not create network/render/camera/idle-loop authority: '+forbidden);
}

console.log(JSON.stringify({
  schema:'ofu-prod-w2-director-test-v1',
  status:'PASS',
  descriptorId:descriptor.descriptorId,
  descriptorHash:descriptor.descriptorHash,
  stops:descriptor.stops.length,
  captures:result.captures.length,
  cancellation:'CANCELLED_RESTORED',
  restoration:'PASS',
  reducedMotion:'DELEGATED_EQUIVALENT_DESTINATIONS',
  oneScene:true,
  oneCamera:true,
  rendererOwnedPicking:true,
  networkRequired:false
}));

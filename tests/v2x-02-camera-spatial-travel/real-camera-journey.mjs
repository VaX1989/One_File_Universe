import {assert,camera,O,close} from '../v1x-01-camera-scale-frames/support.mjs';
await import('../../src/rendering/v1/transition-runtime.js');
await import('../../src/v2x-02-camera-spatial-travel/continuous-travel.js');
const V=O.v2x02ContinuousTravel,S=O.v1xSemanticDistance;
assert.equal(V.VERSION,'ofu-v2x02-continuous-travel-2');
assert.equal(V.AUTHORITY,'PRESENTATION_ONLY');
assert.equal(V.normalizedWheelPixels(1,{deltaMode:1}),40,'one converged line unit must normalize to forty pixels');
assert.equal(V.normalizedWheelPixels(40,{deltaMode:0}),40,'line and pixel inputs must share one semantic delta');
close(V.intentDeltaLog10({kind:'wheel',deltaY:1,deltaMode:1}),S.wheelDeltaLog10(40),1e-15);
assert.equal(V.normalizedWheelPixels(1e9,{deltaMode:2,pagePixels:1e9}),300,'hostile page wheel input must be bounded before semantic conversion');

function samePose(actual,expected,message='camera pose must be restored'){
 assert.equal(actual.frameId,expected.frameId,message+' frame');
 assert.deepEqual(actual.position,expected.position,message+' position');
 for(let i=0;i<4;i++)close(actual.orientation[i],expected.orientation[i],1e-9);
}
function converge(ctl,band,{maxStepLog10=.16,source='journey'}={}){
 let guard=0,result;do{result=ctl.advanceToBand(band,{maxStepLog10,source});if(++guard>256)throw new Error(source+' did not converge');}while(!result.arrived);return result;
}

const {camera:c}=camera({band:'system',selectionToken:'planet:v2x02-stable'}),ctl=V.createController({camera:c,maxLookRadians:Math.PI,maxPendingLogDelta:.9}),initial=c.snapshot(),selection=initial.selectionToken;
for(let i=0;i<24;i++)ctl.wheel(1,{deltaMode:0,source:'hires-wheel'});
assert.equal(c.snapshot().logDistanceM,initial.logDistanceM,'high-resolution wheel deltas accumulate until frame flush');
assert(ctl.snapshot().pending.distanceLog10M>0);ctl.flush({source:'wheel-frame'});assert(c.snapshot().logDistanceM>initial.logDistanceM,'wheel out is monotonic');
let before=c.snapshot().logDistanceM;for(let i=0;i<10;i++)ctl.pinch(1.01,{source:'hires-pinch'});ctl.flush({source:'pinch-frame'});assert(c.snapshot().logDistanceM<before,'pinch apart is monotonic inward');
before=c.snapshot().logDistanceM;ctl.keyboard(-1,{source:'keyboard-in'});ctl.flush({source:'keyboard-frame'});assert(c.snapshot().logDistanceM<before,'keyboard zoom-in converges on frozen semantic-distance authority');assert.equal(c.snapshot().selectionToken,selection);

ctl.observeContext({parentLineage:['galaxy:stable','system:stable','planet:v2x02-stable'],approachVector:[0,0,-1],surfaceTarget:{kind:'PRESENTATION_TARGET',u:.25,v:.75},historyToken:'p4:opaque-read-only'});
const systemAnchor=ctl.captureReverseAnchor('system-entry'),systemState=c.snapshot();assert.equal(systemAnchor.selectionToken,selection);assert.equal(systemAnchor.context.historyToken,'p4:opaque-read-only');
converge(ctl,'human',{source:'inward-reversible-journey'});const human=c.snapshot();assert.equal(human.semanticScale,'human');assert.equal(human.pose.frameId,'human');assert.equal(human.selectionToken,selection);assert(human.logDistanceM<systemState.logDistanceM);
const reverseJourney=ctl.rewindToAnchor('system-entry',{source:'reverse-to-system'});assert.equal(reverseJourney.restored,true);assert(reverseJourney.operationsReversed>0);const returned=c.snapshot();close(returned.logDistanceM,systemState.logDistanceM,1e-9);assert.equal(returned.semanticScale,systemState.semanticScale);samePose(returned.pose,systemState.pose,'cross-frame rewind');assert.equal(returned.selectionToken,selection);assert.equal(reverseJourney.selectionInvariant,true);

const maneuverAnchor=ctl.captureReverseAnchor('maneuver'),maneuverState=c.snapshot();assert.equal(maneuverAnchor.selectionToken,selection);ctl.queueLook({yawRadians:.31,pitchRadians:-.17,source:'orbit'});ctl.flush({source:'orbit-frame'});ctl.fly(4,{right:1.5,up:-.25,source:'fly-forward'});ctl.distance(.08,{source:'fine-distance'});ctl.flush({source:'fine-distance-frame'});assert.notDeepEqual(c.snapshot().pose.position,maneuverState.pose.position);const reverseManeuver=ctl.rewindToAnchor('maneuver',{source:'reverse-maneuver'});assert.equal(reverseManeuver.restored,true);assert(reverseManeuver.operationsReversed>=3);close(c.snapshot().logDistanceM,maneuverState.logDistanceM,1e-9);samePose(c.snapshot().pose,maneuverState.pose,'same-frame maneuver rewind');

let getterCalls=0;const getterBacked={};Object.defineProperty(getterBacked,'danger',{enumerable:true,get(){getterCalls++;return 1;}});assert.throws(()=>ctl.observeContext({surfaceTarget:getterBacked}),/accessor-backed/);assert.equal(getterCalls,0,'context validation must not invoke getters');
const cyclic={kind:'cycle'};cyclic.self=cyclic;assert.throws(()=>ctl.observeContext({surfaceTarget:cyclic}),/cyclic/);
const {camera:depthCamera}=camera({band:'system'}),depthCtl=V.createController({camera:depthCamera,maxJsonDepth:3});const deep={};deep.a={b:{c:{d:1}}};assert.throws(()=>depthCtl.observeContext({surfaceTarget:deep}),/depth budget/);
const {camera:smallContextCamera}=camera({band:'system'}),smallContextCtl=V.createController({camera:smallContextCamera,maxContextBytes:256});const smallBefore=smallContextCtl.snapshot().context;assert.throws(()=>smallContextCtl.observeContext({surfaceTarget:{payload:'x'.repeat(600)}}),/maxContextBytes/);assert.deepEqual(smallContextCtl.snapshot().context,smallBefore,'failed context admission must be atomic');

const {camera:frameCamera}=camera({band:'system',selectionToken:'planet:frame'}),frameCtl=V.createController({camera:frameCamera});frameCtl.captureReverseAnchor('pre-frame');converge(frameCtl,'orbit',{source:'frame-cross'});assert(frameCamera.snapshot().referenceReturnDepth>0,'cross-frame travel should hold a precision return witness');frameCtl.fly(1,{source:'post-frame-spatial-mutation'});assert.equal(frameCtl.snapshot().reverseDepth,0,'spatial mutation after frame handoff must invalidate stale reverse anchors');assert.match(frameCtl.snapshot().lastReverseInvalidation.reason,/spatial-mutation-invalidates-reference-return/);

const {camera:externalCamera}=camera({band:'system',selectionToken:'planet:external'}),externalCtl=V.createController({camera:externalCamera});externalCtl.captureReverseAnchor('external');externalCamera.look({yawRadians:.1,pitchRadians:0,source:'external-owner'});const externalReverse=externalCtl.rewindToAnchor('external');assert.equal(externalReverse.restored,false);assert.equal(externalReverse.reason,'NO_ANCHOR');assert.equal(externalCtl.snapshot().metrics.externalCameraMutations,1);assert.equal(externalCtl.snapshot().cameraDrift,false);

const {camera:selectionCamera}=camera({band:'system',selectionToken:'planet:selection-a'}),selectionCtl=V.createController({camera:selectionCamera});selectionCtl.captureReverseAnchor('selection');selectionCtl.distance(.05);selectionCtl.flush();selectionCamera.observeSelection('planet:selection-b',{sourceContract:'test-read-only-selection'});const selectionBefore=selectionCamera.snapshot();assert.throws(()=>selectionCtl.rewindToAnchor('selection'),/selection no longer matches/);const selectionAfter=selectionCamera.snapshot();close(selectionAfter.logDistanceM,selectionBefore.logDistanceM,1e-12);samePose(selectionAfter.pose,selectionBefore.pose,'selection mismatch must fail before camera mutation');

const {camera:boundedCamera}=camera({band:'system'}),boundedCtl=V.createController({camera:boundedCamera,maxReverseBytes:1024,maxReverseOperations:4,maxContextDepth:64});for(let i=0;i<12;i++)boundedCtl.captureReverseAnchor('bounded-'+i);assert(boundedCtl.snapshot().resourceBounds.reverseBytes<=boundedCtl.snapshot().resourceBounds.maxReverseBytes);assert(boundedCtl.snapshot().metrics.reverseEvictions>0,'old anchors must be evicted under byte pressure');boundedCtl.captureReverseAnchor('journal-cap');for(let i=0;i<6;i++){boundedCtl.distance(.001,{source:'bounded-journal'});boundedCtl.flush();}assert(boundedCtl.snapshot().resourceBounds.reverseBytes<=1024);assert.equal(boundedCtl.snapshot().reverseDepth,0,'journal overflow must invalidate reverse capability rather than grow unbounded');assert(boundedCtl.snapshot().metrics.reverseInvalidations>0);

const beforeInterrupt=c.snapshot().logDistanceM;ctl.wheel(120,{source:'interrupted-wheel'});ctl.focusReset();ctl.flush({source:'post-focus'});assert.equal(c.snapshot().logDistanceM,beforeInterrupt,'focus reset discards pending travel without camera jump');
const normalPlan=ctl.transitionSample('human',.5);assert(normalPlan&&normalPlan.globalProgress>.49&&normalPlan.globalProgress<.51);ctl.setReducedMotion(true);assert.equal(ctl.transitionSample('human',.5).globalProgress,0);assert.equal(ctl.transitionSample('human',1).globalProgress,1);
const finalState=ctl.snapshot();assert(finalState.metrics.boundaryCrossings>0);assert(finalState.resourceBounds.contextBytes<=finalState.resourceBounds.maxContextBytes);assert(finalState.resourceBounds.reverseBytes<=finalState.resourceBounds.maxReverseBytes);assert.equal(finalState.camera.selectionToken,selection);
console.log(JSON.stringify({status:'PASS',oracle:'v2x02-real-camera-journey-oracle-2',distanceAuthority:'logDistanceM',semanticDistanceContract:S.VERSION,crossInputMonotonic:true,rawWheelParity:true,executableReverseJourney:true,exactManeuverRewind:true,strictBoundedContext:true,externalMutationInvalidation:true,selectionFailClosed:true,referenceWitnessSafety:true,resourceBounded:true,reducedMotionParity:true,selectionInvariant:true,authority:'PRESENTATION_ONLY'}));

(function(root){
'use strict';
const O=root.OFU=root.OFU||{},F=O.v1xReferenceFrames,S=O.v1xSemanticDistance,T=O.v1PresentationTransitions||null;
if(!F||!S||!O.v1xCameraAuthority)throw new Error('V2X-02 continuous travel requires frozen V1X camera/reference-frame/semantic-distance authorities');
const VERSION='ofu-v2x02-continuous-travel-2';
const AUTHORITY='PRESENTATION_ONLY';
const PROVIDER_ID='v2x02.interaction.continuous-travel';
const DEFAULT_LINE_PIXELS=40,DEFAULT_PAGE_PIXELS=480,DEFAULT_MAX_WHEEL_PIXELS=300;
const BAND_TO_PRESENTATION=Object.freeze({galaxy:'GALAXY',galactic_region:'REGION',stellar_neighborhood:'NEIGHBORHOOD',system:'SYSTEM',orbit:'ORBIT',approach:'APPROACH',global_surface:'GLOBAL_SURFACE',regional_surface:'REGIONAL_SURFACE',local_surface:'LOCAL_SURFACE',human:'HUMAN'});
const encoder=new TextEncoder();
function finite(value,label='value'){const n=Number(value);if(!Number.isFinite(n))throw new TypeError(label+' must be finite');return n;}
function positive(value,label='value'){const n=finite(value,label);if(!(n>0))throw new RangeError(label+' must be positive');return n;}
function boundedInteger(value,label,min,max){const n=Math.trunc(finite(value,label));if(n<min||n>max)throw new RangeError(label+' must be between '+min+' and '+max);return n;}
function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
function utf8Bytes(value){return encoder.encode(String(value)).length;}
function token(value,label='token',max=512){const s=String(value??'');if(!s||s.length>max)throw new TypeError(label+' required');return s;}
function finiteVec3(value,label='vector'){if(!Array.isArray(value)||value.length!==3)throw new TypeError(label+' must contain three values');return Object.freeze(value.map((v,i)=>finite(v,label+'['+i+']')));}
function strictJson(value,label='context',{maxBytes=4096,maxDepth=12,maxNodes=256,maxKeys=64}={}){
 const byteLimit=boundedInteger(maxBytes,label+' maxBytes',1,65536),depthLimit=boundedInteger(maxDepth,label+' maxDepth',1,32),nodeLimit=boundedInteger(maxNodes,label+' maxNodes',1,2048),keyLimit=boundedInteger(maxKeys,label+' maxKeys',1,256);let nodes=0,observedDepth=0;const seen=new WeakSet();
 function walk(v,depth,path){
  if(depth>depthLimit)throw new RangeError(label+' exceeds JSON depth budget at '+path);observedDepth=Math.max(observedDepth,depth);
  if(v===null)return null;const type=typeof v;
  if(type==='string'||type==='boolean')return v;
  if(type==='number'){if(!Number.isFinite(v))throw new TypeError(label+' contains non-finite number at '+path);return v;}
  if(type!=='object')throw new TypeError(label+' contains non-JSON value at '+path);
  if(seen.has(v))throw new TypeError(label+' contains cyclic object graph at '+path);seen.add(v);nodes++;if(nodes>nodeLimit)throw new RangeError(label+' exceeds JSON node budget');
  let out;
  if(Array.isArray(v)){
   const keys=Object.keys(v);if(keys.length!==v.length)throw new TypeError(label+' arrays must be dense and free of enumerable side properties at '+path);out=[];
   for(let i=0;i<v.length;i++){const descriptor=Object.getOwnPropertyDescriptor(v,String(i));if(!descriptor||!('value'in descriptor)||descriptor.get||descriptor.set)throw new TypeError(label+' contains accessor-backed array value at '+path+'['+i+']');out.push(walk(descriptor.value,depth+1,path+'['+i+']'));}
  }else{
   const proto=Object.getPrototypeOf(v);if(proto!==Object.prototype&&proto!==null)throw new TypeError(label+' objects must be plain JSON records at '+path);if(Object.getOwnPropertySymbols(v).length)throw new TypeError(label+' must not contain symbol keys');const keys=Object.keys(v);if(keys.length>keyLimit)throw new RangeError(label+' exceeds object-key budget at '+path);out={};
   for(const key of keys){const descriptor=Object.getOwnPropertyDescriptor(v,key);if(!descriptor||!('value'in descriptor)||descriptor.get||descriptor.set)throw new TypeError(label+' contains accessor-backed value at '+path+'.'+key);Object.defineProperty(out,key,{value:walk(descriptor.value,depth+1,path+'.'+key),enumerable:true,writable:false,configurable:false});}
  }
  seen.delete(v);return Object.freeze(out);
 }
 const normalized=walk(value,0,'$'),text=JSON.stringify(normalized),bytes=utf8Bytes(text);if(bytes>byteLimit)throw new RangeError(label+' exceeds bounded JSON budget');return Object.freeze({value:normalized,bytes,nodes,maxDepth:observedDepth});
}
function normalizeLineage(value){if(value==null)return Object.freeze([]);if(!Array.isArray(value)||value.length>64)throw new TypeError('parentLineage must be a bounded array');return Object.freeze(value.map((v,i)=>token(v,'parentLineage['+i+']',256)));}
function normalizeDeltaMode(mode){const n=Math.trunc(finite(mode,'deltaMode'));if(![0,1,2].includes(n))throw new RangeError('deltaMode must be 0, 1 or 2');return n;}
function normalizedWheelPixels(deltaY,{deltaMode=0,linePixels=DEFAULT_LINE_PIXELS,pagePixels=DEFAULT_PAGE_PIXELS,maxPixels=DEFAULT_MAX_WHEEL_PIXELS}={}){
 const mode=normalizeDeltaMode(deltaMode),line=positive(linePixels,'linePixels'),page=clamp(positive(pagePixels,'pagePixels'),240,600),limit=positive(maxPixels,'maxPixels'),multiplier=mode===1?line:mode===2?page:1;return clamp(finite(deltaY,'wheel delta')*multiplier,-limit,limit);
}
function intentDeltaLog10(intent,{linePixels=DEFAULT_LINE_PIXELS,pagePixels=DEFAULT_PAGE_PIXELS,maxWheelPixels=DEFAULT_MAX_WHEEL_PIXELS}={}){
 if(!intent||typeof intent!=='object')throw new TypeError('travel intent required');const kind=String(intent.kind||'');
 if(kind==='wheel')return S.wheelDeltaLog10(normalizedWheelPixels(intent.deltaY,{deltaMode:intent.deltaMode??0,linePixels,pagePixels,maxPixels:maxWheelPixels}));
 if(kind==='pinch')return S.pinchDeltaLog10(positive(intent.ratio,'pinch ratio'));
 if(kind==='keyboard')return S.keyboardDeltaLog10(finite(intent.direction,'keyboard direction'));
 if(kind==='distance')return finite(intent.deltaLog10M,'deltaLog10M');
 throw new Error('unsupported continuous travel intent: '+kind);
}
function planIntent(payload={}){
 if(!payload||typeof payload!=='object')throw new TypeError('travel payload required');const current=finite(payload.currentLogDistanceM,'currentLogDistanceM'),min=finite(payload.minLogDistanceM??-18,'minLogDistanceM'),max=finite(payload.maxLogDistanceM??30,'maxLogDistanceM');if(!(min<max))throw new RangeError('travel bounds inverted');
 const requested=intentDeltaLog10(payload.intent||payload,{linePixels:payload.linePixels??DEFAULT_LINE_PIXELS,pagePixels:payload.pagePixels??DEFAULT_PAGE_PIXELS,maxWheelPixels:payload.maxWheelPixels??DEFAULT_MAX_WHEEL_PIXELS}),inputLimit=positive(payload.maxInputLogDelta??.9,'maxInputLogDelta'),bounded=clamp(requested,-inputLimit,inputLimit),next=clamp(current+bounded,min,max);
 let semanticScale=payload.currentSemanticScale?String(payload.currentSemanticScale):null;
 if(payload.referenceRadiusM!=null){const model=S.createScaleModel({referenceRadiusM:positive(payload.referenceRadiusM,'referenceRadiusM'),minLogDistanceM:min,maxLogDistanceM:max});semanticScale=model.deriveBand(next,{previous:semanticScale||null});}
 return Object.freeze({contract:VERSION,authority:AUTHORITY,semanticDistanceContract:S.VERSION,distanceAuthorityKey:'logDistanceM',fromLogDistanceM:current,toLogDistanceM:next,requestedDeltaLog10M:requested,appliedDeltaLog10M:next-current,inputClamped:Math.abs(requested-bounded)>1e-15,semanticScale,canonicalMutation:false,selectionMutation:false,historyMutation:false,cameraPathIsPhysicalTrajectory:false});
}
function createController({camera,reducedMotion=false,maxPendingLogDelta=.9,maxLookRadians=.35,maxTranslationUnits=1e6,maxContextDepth=64,maxContextBytes=8192,maxReverseBytes=65536,maxReverseOperations=128,maxJsonDepth=12,maxJsonNodes=256,linePixels=DEFAULT_LINE_PIXELS,pagePixels=DEFAULT_PAGE_PIXELS,maxWheelPixels=DEFAULT_MAX_WHEEL_PIXELS}={}){
 if(!camera||typeof camera.snapshot!=='function'||typeof camera.applyDistanceDelta!=='function'||typeof camera.look!=='function'||typeof camera.translateLocal!=='function')throw new TypeError('frozen V1X camera authority instance required');
 const pendingLimit=positive(maxPendingLogDelta,'maxPendingLogDelta'),lookLimit=positive(maxLookRadians,'maxLookRadians'),translationLimit=positive(maxTranslationUnits,'maxTranslationUnits'),contextLimit=boundedInteger(maxContextDepth,'maxContextDepth',1,64),contextByteLimit=boundedInteger(maxContextBytes,'maxContextBytes',256,32768),reverseByteLimit=boundedInteger(maxReverseBytes,'maxReverseBytes',1024,65536),journalLimit=boundedInteger(maxReverseOperations,'maxReverseOperations',1,256),jsonDepthLimit=boundedInteger(maxJsonDepth,'maxJsonDepth',1,32),jsonNodeLimit=boundedInteger(maxJsonNodes,'maxJsonNodes',1,2048),wheelLine=positive(linePixels,'linePixels'),wheelPage=clamp(positive(pagePixels,'pagePixels'),240,600),wheelLimit=positive(maxWheelPixels,'maxWheelPixels');
 let pendingDistance=0,pendingYaw=0,pendingPitch=0,lastDistanceSource=null,lastLookSource=null,interrupted=false,motionReduced=Boolean(reducedMotion),sequence=0,anchorBytes=0,journalBytes=0,lastReverseInvalidation=null;
 const initialCamera=camera.snapshot();let trackedCommandCount=initialCamera.commandCount,trackedSequence=initialCamera.sequence,trackedSelection=initialCamera.selectionToken;
 let observedPayloadRecord=normalizeContextPayload({});
 const reverseAnchors=[],journal=[];
 const metrics={distanceInputs:0,lookInputs:0,flushes:0,interruptions:0,resumes:0,translations:0,reverseAnchors:0,reverseEvictions:0,reverseInvalidations:0,externalCameraMutations:0,rewinds:0,reverseOperations:0,boundaryCrossings:0};
 function normalizeContextPayload({parentLineage=[],approachVector=null,surfaceTarget=null,localOrientation=null,historyToken=null}={}){
  const c=camera.snapshot(),surface=surfaceTarget==null?Object.freeze({value:null,bytes:0,nodes:0,maxDepth:0}):strictJson(surfaceTarget,'surfaceTarget',{maxBytes:4096,maxDepth:jsonDepthLimit??12,maxNodes:jsonNodeLimit??256,maxKeys:64});
  const value=Object.freeze({parentLineage:normalizeLineage(parentLineage),approachVector:approachVector==null?null:finiteVec3(approachVector,'approachVector'),surfaceTarget:surface.value,localOrientation:localOrientation==null?c.pose.orientation:F.quat(localOrientation,'localOrientation'),historyToken:historyToken==null?null:token(historyToken,'historyToken',512)}),bytes=utf8Bytes(JSON.stringify(value));
  if(contextByteLimit!==undefined&&bytes>contextByteLimit)throw new RangeError('journey context exceeds maxContextBytes');return Object.freeze({value,bytes,jsonNodes:surface.nodes,jsonDepth:surface.maxDepth});
 }
 function contextView(c){return Object.freeze({selectionToken:c.selectionToken,...observedPayloadRecord.value});}
 function digest(c){return Object.freeze({logDistanceM:c.logDistanceM,semanticScale:c.semanticScale,frameId:c.pose.frameId,position:c.pose.position,orientation:c.pose.orientation,referenceReturnDepth:c.referenceReturnDepth});}
 function arraysClose(a,b,eps=1e-9){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>Math.abs(v-b[i])<=eps);}
 function digestMatches(c,d,eps=1e-9){return c.pose.frameId===d.frameId&&c.semanticScale===d.semanticScale&&c.referenceReturnDepth===d.referenceReturnDepth&&Math.abs(c.logDistanceM-d.logDistanceM)<=eps&&arraysClose(c.pose.position,d.position,eps)&&arraysClose(c.pose.orientation,d.orientation,eps);}
 function invalidateReverse(reason,{external=false}={}){const had=reverseAnchors.length||journal.length;reverseAnchors.length=0;journal.length=0;anchorBytes=0;journalBytes=0;lastReverseInvalidation=Object.freeze({reason:String(reason),external:Boolean(external),cameraCommandCount:camera.snapshot().commandCount});if(had){metrics.reverseInvalidations++;sequence++;}if(external)metrics.externalCameraMutations++;}
 function synchronizeExternal(source='controller-sync'){const c=camera.snapshot();if(c.commandCount!==trackedCommandCount||c.sequence!==trackedSequence||c.selectionToken!==trackedSelection){const reason=c.selectionToken!==trackedSelection?'external-selection-change':c.commandCount!==trackedCommandCount?'external-camera-command:'+String(source):'external-camera-sequence:'+String(source);invalidateReverse(reason,{external:true});trackedCommandCount=c.commandCount;trackedSequence=c.sequence;trackedSelection=c.selectionToken;}return c;}
 function noteCamera(){const c=camera.snapshot();trackedCommandCount=c.commandCount;trackedSequence=c.sequence;trackedSelection=c.selectionToken;}
 function compactJournal(){if(!journal.length)return;const floor=reverseAnchors.length?Math.min(...reverseAnchors.map(anchor=>anchor.journalIndex)):journal.length;if(floor<=0)return;for(let i=0;i<floor;i++)journalBytes-=journal[i].bytes;journal.splice(0,floor);for(let i=0;i<reverseAnchors.length;i++){const anchor=reverseAnchors[i];reverseAnchors[i]=Object.freeze({...anchor,journalIndex:anchor.journalIndex-floor});}}
 function record(entry){if(!reverseAnchors.length)return;const value=Object.freeze(entry),bytes=utf8Bytes(JSON.stringify(value));if(journal.length>=journalLimit||anchorBytes+journalBytes+bytes>reverseByteLimit)invalidateReverse('reverse-journal-capacity');if(bytes>reverseByteLimit){lastReverseInvalidation=Object.freeze({reason:'single-reverse-operation-exceeds-budget',external:false,cameraCommandCount:camera.snapshot().commandCount});return;}if(!reverseAnchors.length)return;journal.push(Object.freeze({value,bytes}));journalBytes+=bytes;}
 function recordDistance(before,after,source){if(Math.abs(after.logDistanceM-before.logDistanceM)<=1e-15)return;record({kind:'DISTANCE',source:String(source),before:digest(before),after:digest(after)});}
 function prepareSpatialMutation(before,source){if(before.referenceReturnDepth>0)invalidateReverse('spatial-mutation-invalidates-reference-return:'+String(source));return before;}
 function snapshot(){const c=camera.snapshot(),drift=c.commandCount!==trackedCommandCount||c.sequence!==trackedSequence||c.selectionToken!==trackedSelection;return Object.freeze({contract:VERSION,authority:AUTHORITY,semanticDistanceContract:S.VERSION,camera:c,cameraDrift:drift,pending:Object.freeze({distanceLog10M:pendingDistance,yawRadians:pendingYaw,pitchRadians:pendingPitch}),reducedMotion:motionReduced,interrupted,context:contextView(c),reverseDepth:reverseAnchors.length,reverseTarget:reverseAnchors.at(-1)?.value||null,lastReverseInvalidation,resourceBounds:Object.freeze({contextBytes:observedPayloadRecord.bytes,maxContextBytes:contextByteLimit,reverseBytes:anchorBytes+journalBytes,anchorBytes,journalBytes,maxReverseBytes:reverseByteLimit,journalDepth:journal.length,maxReverseOperations:journalLimit,maxJsonDepth:jsonDepthLimit,maxJsonNodes:jsonNodeLimit}),metrics:Object.freeze({...metrics}),sequence});}
 function resume(source='input-resume'){if(interrupted){interrupted=false;metrics.resumes++;sequence++;lastDistanceSource=lastDistanceSource||String(source);}return snapshot();}
 function queueDistance(delta,source){resume(source);pendingDistance=clamp(pendingDistance+finite(delta,'distance delta'),-pendingLimit,pendingLimit);lastDistanceSource=String(source||'continuous-input');metrics.distanceInputs++;sequence++;return snapshot();}
 function wheel(deltaY,options={}){return queueDistance(intentDeltaLog10({kind:'wheel',deltaY,deltaMode:options.deltaMode??0},{linePixels:options.linePixels??wheelLine,pagePixels:options.pagePixels??wheelPage,maxWheelPixels:options.maxWheelPixels??wheelLimit}),options.source||'wheel');}
 function pinch(ratio,{source='pinch'}={}){return queueDistance(intentDeltaLog10({kind:'pinch',ratio}),source);}
 function keyboard(direction,{source='keyboard'}={}){return queueDistance(intentDeltaLog10({kind:'keyboard',direction}),source);}
 function distance(deltaLog10M,{source='distance-intent'}={}){return queueDistance(deltaLog10M,source);}
 function queueLook({yawRadians=0,pitchRadians=0,source='pointer-look'}={}){resume(source);pendingYaw=clamp(pendingYaw+finite(yawRadians,'yawRadians'),-lookLimit,lookLimit);pendingPitch=clamp(pendingPitch+finite(pitchRadians,'pitchRadians'),-lookLimit,lookLimit);lastLookSource=String(source);metrics.lookInputs++;sequence++;return snapshot();}
 function pointerLook(dx,dy,{source='pointer-look',yawSensitivity=.006,pitchSensitivity=.004}={}){return queueLook({yawRadians:finite(dx,'dx')*finite(yawSensitivity,'yawSensitivity'),pitchRadians:finite(dy,'dy')*finite(pitchSensitivity,'pitchSensitivity'),source});}
 function flush({source='frame-flush'}={}){
  if(interrupted)return snapshot();let before=synchronizeExternal(source),distanceDelta=pendingDistance,yaw=pendingYaw,pitch=pendingPitch;pendingDistance=0;pendingYaw=0;pendingPitch=0;const distanceSource=lastDistanceSource||'distance',lookSource=lastLookSource||'look';lastDistanceSource=null;lastLookSource=null;
  if(distanceDelta!==0){camera.applyDistanceDelta(distanceDelta,{source:String(source)+':'+distanceSource});let after=camera.snapshot();recordDistance(before,after,String(source)+':'+distanceSource);if(before.semanticScale!==after.semanticScale)metrics.boundaryCrossings++;noteCamera();before=after;}
  if(yaw!==0||pitch!==0){prepareSpatialMutation(before,String(source)+':'+lookSource);camera.look({yawRadians:yaw,pitchRadians:pitch,source:String(source)+':'+lookSource});const after=camera.snapshot();record({kind:'LOOK',source:String(source)+':'+lookSource,yawRadians:yaw,pitchRadians:pitch,before:digest(before),after:digest(after)});noteCamera();}
  metrics.flushes++;sequence++;return snapshot();
 }
 function interrupt(reason='interruption'){pendingDistance=0;pendingYaw=0;pendingPitch=0;interrupted=true;lastDistanceSource=null;lastLookSource=null;metrics.interruptions++;sequence++;return Object.freeze({...snapshot(),interruptionReason:String(reason)});}
 function focusReset(){return interrupt('focus-reset');}
 function setReducedMotion(value){motionReduced=Boolean(value);sequence++;return snapshot();}
 function translateCameraRelative({right=0,up=0,forward=0,source='camera-relative-translate'}={}){
  const before=prepareSpatialMutation(synchronizeExternal(source),source),local=[finite(right,'right'),finite(up,'up'),-finite(forward,'forward')],length=Math.hypot(...local),scale=length>translationLimit?translationLimit/length:1,frameDelta=F.qRotate(before.pose.orientation,local.map(v=>v*scale));camera.translateLocal(frameDelta,{source});const after=camera.snapshot();record({kind:'TRANSLATE',source:String(source),frameDelta,before:digest(before),after:digest(after)});noteCamera();metrics.translations++;sequence++;return snapshot();
 }
 function pan(right,up,{source='pan'}={}){return translateCameraRelative({right,up,forward:0,source});}
 function fly(forward,{right=0,up=0,source='fly'}={}){return translateCameraRelative({right,up,forward,source});}
 function advanceToward(targetLogDistanceM,{maxStepLog10=.18,source='continuous-target'}={}){const target=camera.scaleModel.clampLog(targetLogDistanceM),before=synchronizeExternal(source),limit=positive(maxStepLog10,'maxStepLog10'),step=clamp(target-before.logDistanceM,-limit,limit);if(step!==0)camera.applyDistanceDelta(step,{source});const after=camera.snapshot();recordDistance(before,after,source);if(before.semanticScale!==after.semanticScale)metrics.boundaryCrossings++;noteCamera();sequence++;return Object.freeze({arrived:Math.abs(target-after.logDistanceM)<=1e-12,targetLogDistanceM:target,snapshot:snapshot()});}
 function advanceToBand(band,options={}){const normalized=S.normalizeBand(band),target=camera.scaleModel.anchorLogM[normalized];return advanceToward(target,options);}
 function observeContext(value={}){synchronizeExternal('observe-context');observedPayloadRecord=normalizeContextPayload(value);sequence++;return snapshot();}
 function captureReverseAnchor(label='travel-anchor'){
  const c=synchronizeExternal('capture-reverse-anchor'),anchorLabel=token(label,'anchor label',128);let publicAnchor=Object.freeze({label:anchorLabel,logDistanceM:c.logDistanceM,semanticScale:c.semanticScale,frameId:c.pose.frameId,pose:c.pose,selectionToken:c.selectionToken,cameraCommandCount:c.commandCount,journalDepth:journal.length,context:contextView(c)}),bytes=utf8Bytes(JSON.stringify(publicAnchor));if(bytes>reverseByteLimit)throw new RangeError('reverse anchor exceeds maxReverseBytes');
  if(journalBytes+bytes>reverseByteLimit){invalidateReverse('reverse-budget-before-anchor');publicAnchor=Object.freeze({...publicAnchor,journalDepth:0});bytes=utf8Bytes(JSON.stringify(publicAnchor));}
  while(reverseAnchors.length>=contextLimit||anchorBytes+journalBytes+bytes>reverseByteLimit){const evicted=reverseAnchors.shift();anchorBytes-=evicted.bytes;metrics.reverseEvictions++;compactJournal();}
  reverseAnchors.push(Object.freeze({value:publicAnchor,bytes,journalIndex:journal.length,payloadRecord:observedPayloadRecord}));anchorBytes+=bytes;metrics.reverseAnchors++;sequence++;return publicAnchor;
 }
 function popReverseAnchor(){const entry=reverseAnchors.pop()||null;if(entry)anchorBytes-=entry.bytes;compactJournal();sequence++;return entry?.value||null;}
 function rewindToAnchor(label=null,{source='reverse-travel'}={}){
  synchronizeExternal(source);if(pendingDistance!==0||pendingYaw!==0||pendingPitch!==0)throw new Error('cannot rewind with pending camera input');
  let index=-1;if(label==null)index=reverseAnchors.length-1;else{const wanted=String(label);for(let i=reverseAnchors.length-1;i>=0;i--)if(reverseAnchors[i].value.label===wanted){index=i;break;}}
  if(index<0)return Object.freeze({restored:false,reason:'NO_ANCHOR',snapshot:snapshot()});const target=reverseAnchors[index],anchor=target.value,current=camera.snapshot();if(current.selectionToken!==anchor.selectionToken)throw new Error('reverse anchor selection no longer matches current canonical selection');const operationEntries=journal.slice(target.journalIndex),operations=operationEntries.map(entry=>entry.value);if(operations.length>journalLimit)throw new Error('reverse journal bound exceeded');if(operations.length&&!digestMatches(current,operations.at(-1).after))throw new Error('reverse journal no longer matches current camera state');if(!operations.length&&!digestMatches(current,digest(anchor)))throw new Error('reverse anchor no longer matches current camera state');
  for(let i=operations.length-1;i>=0;i--){const entry=operations[i],beforeInverse=camera.snapshot();
   if(entry.kind==='DISTANCE'){camera.applyDistanceDelta(entry.before.logDistanceM-beforeInverse.logDistanceM,{source:String(source)+':distance'});}
   else if(entry.kind==='TRANSLATE'){camera.translateLocal(entry.frameDelta.map(v=>-v),{source:String(source)+':translate'});}
   else if(entry.kind==='LOOK'){if(entry.pitchRadians!==0)camera.look({yawRadians:0,pitchRadians:-entry.pitchRadians,source:String(source)+':pitch'});if(entry.yawRadians!==0)camera.look({yawRadians:-entry.yawRadians,pitchRadians:0,source:String(source)+':yaw'});}
   else throw new Error('unsupported reverse journal operation: '+entry.kind);noteCamera();metrics.reverseOperations++;
  }
  const restored=camera.snapshot();if(!digestMatches(restored,digest(anchor)))throw new Error('reverse verification failed to restore anchor camera state');observedPayloadRecord=target.payloadRecord;for(let i=journal.length-1;i>=target.journalIndex;i--){journalBytes-=journal[i].bytes;journal.pop();}for(let i=reverseAnchors.length-1;i>=index;i--){anchorBytes-=reverseAnchors[i].bytes;reverseAnchors.pop();}compactJournal();metrics.rewinds++;sequence++;return Object.freeze({restored:true,label:anchor.label,operationsReversed:operations.length,selectionInvariant:restored.selectionToken===anchor.selectionToken,exactWithinTolerance:true,snapshot:snapshot()});
 }
 function transitionPlan(targetBand,{sourceEntityId=null,targetEntityId=null,orientation=null}={}){if(!T)return null;const from=BAND_TO_PRESENTATION[camera.snapshot().semanticScale],to=BAND_TO_PRESENTATION[S.normalizeBand(targetBand)];if(!from||!to)return null;return T.plan({from,to,sourceEntityId:sourceEntityId||camera.snapshot().selectionToken,targetEntityId:targetEntityId||sourceEntityId||camera.snapshot().selectionToken,orientation:orientation||observedPayloadRecord.value.localOrientation});}
 function transitionSample(targetBand,progress,options={}){if(!T)return null;const plan=transitionPlan(targetBand,options),p=clamp(finite(progress,'progress'),0,1);return T.sample(plan,motionReduced?(p>=1?1:0):p);}
 return Object.freeze({VERSION,AUTHORITY,snapshot,wheel,pinch,keyboard,distance,queueLook,pointerLook,flush,interrupt,focusReset,resume,setReducedMotion,translateCameraRelative,pan,fly,advanceToward,advanceToBand,observeContext,captureReverseAnchor,popReverseAnchor,rewindToAnchor,transitionPlan,transitionSample,camera});
}
function bindProvider(){
 const C=O.pxContracts,P=O.pxProduct;if(!C||!P?.registry)return false;const registry=P.registry;let descriptor;try{descriptor=registry.descriptor(PROVIDER_ID);}catch{return false;}
 const implementation={handle(request,meter){const value=C.data(planIntent(request.payload||{})),bytes=Math.max(1,encoder.encode(C.stable(value)).length);meter.consume(1,1);return {contract:C.VERSION,provider:PROVIDER_ID,version:descriptor.version,authority:descriptor.authority,selection:request.selection,fidelity:descriptor.fidelity,usage:{entities:1,bytes,operations:1,queue:0},value};},probe:planIntent};
 registry.bind(PROVIDER_ID,descriptor.owner,descriptor.version,implementation);return true;
}
O.v2x02ContinuousTravel=Object.freeze({VERSION,AUTHORITY,PROVIDER_ID,DEFAULT_LINE_PIXELS,DEFAULT_PAGE_PIXELS,DEFAULT_MAX_WHEEL_PIXELS,normalizedWheelPixels,intentDeltaLog10,planIntent,createController,bindProvider});
bindProvider();
})(typeof globalThis!=='undefined'?globalThis:this);

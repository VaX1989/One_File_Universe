(function(root){
'use strict';
const O=root.OFU=root.OFU||{},F=O.v1xReferenceFrames,S=O.v1xSemanticDistance;
if(!F||!S)throw new Error('V1X camera authority requires reference-frame and semantic-distance modules');
const VERSION='ofu-v1x-camera-authority-1';
const AUTHORITY='PRESENTATION_ONLY';
const INPUT_CONTRACT='ofu-wave-iv-input-intent-3';
const SCALE_CONTRACT='ofu-wave-iv-scale-runtime-3';
function finite(value,label='value'){const n=Number(value);if(!Number.isFinite(n))throw new TypeError(label+' must be finite');return n;}
function token(value,label='token'){const s=String(value??'');if(!s||s.length>512)throw new TypeError(label+' required');return s;}
function frozenPose(pose){return Object.freeze({frameId:String(pose.frameId),position:F.vec3(pose.position,'camera position'),orientation:F.quat(pose.orientation||[0,0,0,1],'camera orientation')});}
function createCameraAuthority({frameGraph,scaleModel,initialPose,initialLogDistanceM,selectionToken='UNBOUND',frameResolver=null}={}){
 if(!frameGraph||typeof frameGraph.rebasePose!=='function')throw new TypeError('reference-frame graph required');
 if(!scaleModel||typeof scaleModel.describe!=='function')throw new TypeError('semantic scale model required');
 let pose=frozenPose(initialPose||{frameId:frameGraph.rootFrameId,position:[0,0,0],orientation:[0,0,0,1]});frameGraph.frame(pose.frameId);
 let logDistanceM=scaleModel.clampLog(initialLogDistanceM),semanticScale=scaleModel.deriveBand(logDistanceM),selection=token(selectionToken,'selectionToken'),sequence=0,commandCount=0,legacyAdoptions=0,lastOperation=null,spatialMutationEpoch=0;
 let translationCompensation=[0,0,0];
 const returnStack=[];
 const listeners=new Set();
 function derived(){return scaleModel.describe(logDistanceM,{previous:semanticScale});}
 function snapshot(){
  const d=scaleModel.describe(logDistanceM,{previous:semanticScale});
  return Object.freeze({contract:VERSION,authority:AUTHORITY,inputContract:INPUT_CONTRACT,scaleContract:SCALE_CONTRACT,distanceAuthorityKey:'logDistanceM',logDistanceM,distanceM:d.distanceM,distanceRadii:d.distanceRadii,semanticScale,belowWaveIVHuman:d.belowWaveIVHuman,pose,selectionToken:selection,commandCount,legacyAdoptions,lastOperation,sequence,referenceReturnDepth:returnStack.length});
 }
 function emit(operation,detail={}){lastOperation=Object.freeze({...operation});const event=Object.freeze({contract:VERSION,sequence:++sequence,operation:lastOperation,detail:Object.freeze({...detail}),snapshot:snapshot()});for(const fn of listeners)fn(event);return event;}
 function on(fn){if(typeof fn!=='function')throw new TypeError('listener required');listeners.add(fn);return()=>listeners.delete(fn);}
 function resolveFrame(nextBand,context){if(typeof frameResolver!=='function')return null;const id=frameResolver(nextBand,Object.freeze({...context,snapshot:snapshot()}));return id==null?null:String(id);}
 function rebaseInternal(targetFrame,reason){
  if(!targetFrame||targetFrame===pose.frameId)return null;
  const before=pose,top=returnStack.at(-1);let restored=false,witness;
  if(top&&top.toFrame===before.frameId&&top.fromPose.frameId===targetFrame&&top.spatialMutationEpoch===spatialMutationEpoch){
   pose=top.fromPose;returnStack.pop();restored=true;witness=frameGraph.witness(before.frameId,targetFrame,before.position);
  }else{
   const after=frameGraph.rebasePose(before,targetFrame);pose=frozenPose(after);witness=frameGraph.witness(before.frameId,targetFrame,before.position);
   if(returnStack.length>=64)returnStack.shift();returnStack.push(Object.freeze({fromPose:before,toFrame:targetFrame,spatialMutationEpoch}));
  }
  translationCompensation=[0,0,0];
  if(!witness.finite)throw new Error('reference-frame handoff produced non-finite transform');
  return Object.freeze({kind:'REFERENCE_FRAME_HANDOFF',reason,from:before.frameId,to:targetFrame,witness,precisionRestoredFromReturnStack:restored});
 }
 function updateDistance(nextLog,{source='semantic-distance',operation='CONTINUOUS_TRAVEL',allowFastTravel=false}={}){
  const previousLog=logDistanceM,previousBand=semanticScale,next=scaleModel.clampLog(nextLog),candidate=scaleModel.deriveBand(next,{previous:previousBand}),path=scaleModel.transitionPath(previousBand,candidate);
  if(operation==='FAST_TRAVEL'&&!allowFastTravel)throw new Error('fast travel must be explicit');
  logDistanceM=next;semanticScale=candidate;commandCount++;
  const handoffs=[];
  for(const step of path){const frame=resolveFrame(step.to,{fromBand:step.from,toBand:step.to,source,operation});const h=rebaseInternal(frame,operation+':'+step.from+'->'+step.to);handoffs.push(Object.freeze({...step,frameHandoff:h}));}
  const op=Object.freeze({kind:operation,source,fromLogDistanceM:previousLog,toLogDistanceM:logDistanceM,fromSemanticScale:previousBand,toSemanticScale:semanticScale,boundaryHandoffs:Object.freeze(handoffs),explicitFastTravel:operation==='FAST_TRAVEL'});
  emit(op,{selectionInvariant:true});return snapshot();
 }
 function applyDistanceDelta(deltaLog10M,{source='continuous-input'}={}){return updateDistance(logDistanceM+finite(deltaLog10M,'deltaLog10M'),{source,operation:'CONTINUOUS_TRAVEL'});}
 function travelToLogDistance(targetLogDistanceM,{source='fast-travel',fastTravel=false}={}){if(!fastTravel)throw new Error('absolute distance change requires explicit fastTravel=true');return updateDistance(targetLogDistanceM,{source,operation:'FAST_TRAVEL',allowFastTravel:true});}
 function frameHandoff(targetFrame,{source='frame-handoff'}={}){const before=pose.frameId,h=rebaseInternal(String(targetFrame),source);commandCount++;emit({kind:'REFERENCE_FRAME_HANDOFF',source,from:before,to:pose.frameId,witness:h?.witness||null},{selectionInvariant:true,distanceInvariant:true});return snapshot();}
 function look({yawRadians=0,pitchRadians=0,source='look'}={}){
  const yaw=finite(yawRadians,'yawRadians'),pitch=finite(pitchRadians,'pitchRadians'),delta=F.qMul(F.qAxisAngle([0,1,0],yaw),F.qAxisAngle([1,0,0],pitch));pose=frozenPose({...pose,orientation:F.qMul(pose.orientation,delta)});spatialMutationEpoch++;returnStack.length=0;commandCount++;emit({kind:'LOOK',source,yawRadians:yaw,pitchRadians:pitch},{selectionInvariant:true,distanceInvariant:true});return snapshot();
 }
 function resetOrientation({source='reset-orientation'}={}){pose=frozenPose({...pose,orientation:[0,0,0,1]});spatialMutationEpoch++;returnStack.length=0;commandCount++;emit({kind:'RESET_ORIENTATION',source},{selectionInvariant:true,distanceInvariant:true});return snapshot();}
 function translateLocal(delta,{source='translate'}={}){
  const d=F.vec3(delta,'translation delta'),next=[];
  for(let i=0;i<3;i++){const y=d[i]-translationCompensation[i],sum=pose.position[i]+y;translationCompensation[i]=(sum-pose.position[i])-y;next.push(sum);}
  pose=frozenPose({...pose,position:next});spatialMutationEpoch++;returnStack.length=0;commandCount++;emit({kind:'TRANSLATE_LOCAL',source,delta:d},{selectionInvariant:true,distanceInvariant:true,compensatedTranslation:true});return snapshot();
 }
 function observeSelection(nextSelection,{sourceContract='ofu-wave-iv-selection-1'}={}){const next=token(nextSelection,'selectionToken'),before=selection;selection=next;emit({kind:'OBSERVE_EXTERNAL_SELECTION',sourceContract,changed:before!==next},{cameraDidNotMutateSelection:true});return snapshot();}
 function adoptLegacyDistance(nextLogDistanceM,{sourceContract=SCALE_CONTRACT}={}){
  const next=scaleModel.clampLog(nextLogDistanceM);if(commandCount>0&&Math.abs(next-logDistanceM)>1e-12)throw new Error('legacy distance adoption allowed only before authoritative camera commands');
  const before=logDistanceM,prevBand=semanticScale;logDistanceM=next;semanticScale=scaleModel.deriveBand(next,{previous:prevBand});legacyAdoptions++;emit({kind:'ADOPT_LEGACY_DISTANCE',sourceContract,fromLogDistanceM:before,toLogDistanceM:next},{handoff:true});return snapshot();
 }
 function focusPoint(){const meters=derived().distanceM,forward=F.qRotate(pose.orientation,[0,0,-1]),units=meters/frameGraph.frame(pose.frameId).metersPerUnit;return Object.freeze([pose.position[0]+forward[0]*units,pose.position[1]+forward[1]*units,pose.position[2]+forward[2]*units]);}
 function applyIntent(intent,{source='intent'}={}){
  if(!intent||typeof intent!=='object')throw new TypeError('camera intent required');
  if(intent.kind==='semantic-distance')return applyDistanceDelta(intent.deltaLog10M,{source});
  if(intent.kind==='look')return look({yawRadians:intent.yawRadians,pitchRadians:intent.pitchRadians,source});
  if(intent.kind==='translate-local')return translateLocal(intent.delta,{source});
  if(intent.kind==='frame-handoff')return frameHandoff(intent.frameId,{source});
  if(intent.kind==='fast-travel')return travelToLogDistance(intent.logDistanceM,{source,fastTravel:intent.explicit===true});
  if(intent.kind==='reset-orientation')return resetOrientation({source});
  throw new Error('unsupported V1X camera intent: '+String(intent.kind));
 }
 return Object.freeze({VERSION,AUTHORITY,distanceAuthorityKey:'logDistanceM',snapshot,on,applyIntent,applyDistanceDelta,travelToLogDistance,frameHandoff,look,resetOrientation,translateLocal,observeSelection,adoptLegacyDistance,focusPoint,frameGraph,scaleModel});
}
O.v1xCameraAuthority=Object.freeze({VERSION,AUTHORITY,INPUT_CONTRACT,SCALE_CONTRACT,createCameraAuthority});
})(typeof globalThis!=='undefined'?globalThis:this);

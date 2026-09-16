const CONTRACT='ofu-r6-w0-representation-handoff-1';
const SURFACE_STAGES=Object.freeze(['ORBIT','APPROACH','GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN']);
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,Number(value)||0));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t)};
const mix=(a,b,t)=>Number(a)+(Number(b)-Number(a))*clamp(t);
const hypot2=(a,b)=>Math.hypot(Number(a)||0,Number(b)||0);
const unit=value=>{if(!Array.isArray(value)||value.length!==3)return null;const length=Math.hypot(...value.map(Number));return length>0?value.map(item=>Number(item)/length):null};
const dot=(a,b)=>a&&b?a.reduce((sum,value,index)=>sum+value*b[index],0):null;
const angularDistance=(a,b)=>{const normalizedA=unit(a),normalizedB=unit(b),product=dot(normalizedA,normalizedB);return product==null?null:Math.acos(clamp(product,-1,1))};
const frozenArray=value=>Object.freeze(Array.isArray(value)?[...value]:[]);

export const REPRESENTATION_HANDOFF_CONTRACT=CONTRACT;
export const REPRESENTATION_HANDOFF_SURFACE_STAGES=SURFACE_STAGES;

export function surfaceIdentity(input={}){
  const bodyId=String(input.bodyId||input.worldIdentity||''),surfaceId=String(input.surfaceId||''),terrainSeed=String(input.terrainSeed||''),bodyFixedUnit=unit(input.bodyFixedUnit);
  if(!bodyId||!surfaceId)throw new TypeError('Surface handoff identity requires bodyId and surfaceId');
  return Object.freeze({bodyId,surfaceId,terrainSeed,bodyFixedUnit:bodyFixedUnit?Object.freeze(bodyFixedUnit):null,key:`${bodyId}::${surfaceId}::${terrainSeed}`});
}

export function sameSurfaceIdentity(a,b,{directionToleranceRad=1e-10}={}){
  if(!a||!b)return false;
  if(String(a.bodyId)!==String(b.bodyId)||String(a.surfaceId)!==String(b.surfaceId))return false;
  if(a.terrainSeed&&b.terrainSeed&&String(a.terrainSeed)!==String(b.terrainSeed))return false;
  const drift=angularDistance(a.bodyFixedUnit,b.bodyFixedUnit);
  return drift==null||drift<=Math.max(0,Number(directionToleranceRad)||0);
}

export function handoffPresentationEnvelope({coordinate=0,targetReady=false,hasDetailedSource=false,hasPlanetarySource=true}={}){
  const c=clamp(coordinate,0,14),approach=smooth((c-5.55)/1.45),surface=smooth((c-6.55)/1.8),regional=smooth((c-7.35)/1.15),local=smooth((c-8.35)/1.25),human=smooth((c-9.25)/1.05),microscopic=smooth((c-10.2)/.55);
  const atmospherePresence=approach*(1-microscopic),groundPresence=surface*(1-microscopic),stars=clamp(1-.9*smooth((c-6.45)/1.7),0.08,1),sky=clamp(.04+.78*atmospherePresence+.12*regional-.12*human,0,1),horizon=clamp(.78*surface+.22*regional-.16*human,0,1),terrainContrast=clamp(.86+.12*surface+.1*regional+.04*local-.04*human,.82,1.12),exposureEv=mix(-.34,.08,surface)-.08*human;
  const technicalSuppression=clamp(surface*(1-.45*local),0,1),planetaryDetail=clamp(1-.34*technicalSuppression*(targetReady||hasDetailedSource?1:.35),.58,1),uiOcclusion=clamp(.12+.58*surface*(1-human*.35),0,1);
  const preferredSource=hasDetailedSource?'DETAILED_SURFACE':hasPlanetarySource?'PLANETARY_SURFACE':'NONE';
  return Object.freeze({contract:CONTRACT,coordinate:c,preferredSource,targetReady:!!targetReady,hasDetailedSource:!!hasDetailedSource,atmospherePresence,groundPresence,starAlpha:stars,skyLuminance:sky,horizonPresence:horizon,terrainContrast,exposureEv,technicalStructureSuppression:technicalSuppression,planetaryDetailWeight:planetaryDetail,transitionCritical:surface>.08&&human<.92,uiOcclusionReduction:uiOcclusion,authority:'PRESENTATION_ONLY'});
}

export function measureHandoffContinuity(previous={},current={},options={}){
  const previousIdentity=previous.identity||null,currentIdentity=current.identity||null,exactIdentity=sameSurfaceIdentity(previousIdentity,currentIdentity,options),surfaceAngularDriftRad=angularDistance(previousIdentity?.bodyFixedUnit,currentIdentity?.bodyFixedUnit);
  const previousAnchor=previous.anchorCssPx,currentAnchor=current.anchorCssPx,screenDriftPx=previousAnchor&&currentAnchor?hypot2(currentAnchor[0]-previousAnchor[0],currentAnchor[1]-previousAnchor[1]):null,viewportHeight=Math.max(1,Number(current.viewportHeightPx||previous.viewportHeightPx||1)),screenDriftViewport=screenDriftPx==null?null:screenDriftPx/viewportHeight;
  const horizonDriftViewport=Number.isFinite(Number(previous.horizonCssPx))&&Number.isFinite(Number(current.horizonCssPx))?Math.abs(Number(current.horizonCssPx)-Number(previous.horizonCssPx))/viewportHeight:null,exposureDeltaEv=Number.isFinite(Number(previous.exposureEv))&&Number.isFinite(Number(current.exposureEv))?Math.abs(Number(current.exposureEv)-Number(previous.exposureEv)):null,terrainCorrespondence=clamp(current.terrainCorrespondence??previous.terrainCorrespondence??1),coarseFallbackVisible=!!current.coarseFallbackVisible;
  const driftPenalty=screenDriftViewport==null?0:clamp(screenDriftViewport/.08),horizonPenalty=horizonDriftViewport==null?0:clamp(horizonDriftViewport/.08),exposurePenalty=exposureDeltaEv==null?0:clamp(exposureDeltaEv/.8),coarsePenalty=coarseFallbackVisible?.35:0,perceptualScore=clamp(terrainCorrespondence*.5+(1-driftPenalty)*.22+(1-horizonPenalty)*.14+(1-exposurePenalty)*.14-coarsePenalty);
  return Object.freeze({contract:CONTRACT,identity:Object.freeze({exact:exactIdentity,bodyIdStable:!!previousIdentity&&!!currentIdentity&&previousIdentity.bodyId===currentIdentity.bodyId,surfaceIdStable:!!previousIdentity&&!!currentIdentity&&previousIdentity.surfaceId===currentIdentity.surfaceId,terrainSeedStable:!previousIdentity?.terrainSeed||!currentIdentity?.terrainSeed||previousIdentity.terrainSeed===currentIdentity.terrainSeed,surfaceAngularDriftRad}),perceptual:Object.freeze({score:perceptualScore,screenDriftPx,screenDriftViewport,horizonDriftViewport,exposureDeltaEv,terrainCorrespondence,coarseFallbackVisible})});
}

function terrainPlan(input){
  if(!input?.signature)return null;
  return Object.freeze({signature:String(input.signature),patchIds:frozenArray(input.patchIds),activeCount:Number(input.activeCount)||0,complete:input.complete===true,transitionToken:String(input.transitionToken||''),completedAt:Number(input.completedAt)||0});
}

export function createRepresentationHandoffController({fadeDurationMs=360,maxRetainedDetailedPlans=2}={}){
  const duration=Math.max(80,Number(fadeDurationMs)||360),capacity=Math.min(2,Math.max(1,Math.floor(Number(maxRetainedDetailedPlans)||2)));
  let identity=null,lastComplete=null,pending=null,blend=null,epoch=0,cancellations=0,staleRejects=0,identityResets=0,commits=0,lastOutput=null;
  const resetForIdentity=next=>{identity=next;lastComplete=null;pending=null;blend=null;epoch++;identityResets++};
  const beginBlend=(source,target,now)=>{blend=Object.freeze({source,target,startedAt:Number(now)||0,epoch,transitionToken:target.transitionToken});commits++};
  function update(input={}){
    const now=Number(input.now)||0,nextIdentity=input.identity,coordinate=Number(input.coordinate)||0,stage=String(input.stage||''),target=terrainPlan(input.targetCoverage),incoming=terrainPlan(input.displayedCoverage),targetBuilding=!!input.targetBuilding||Number(input.pendingCount)>0,activeTransitionToken=String(input.transitionToken||target?.transitionToken||'');
    if(!nextIdentity)throw new TypeError('Representation handoff update requires exact surface identity');
    if(!identity)identity=nextIdentity;else if(!sameSurfaceIdentity(identity,nextIdentity))resetForIdentity(nextIdentity);
    const identityMatches=sameSurfaceIdentity(identity,nextIdentity);
    const incomingComplete=incoming?.complete===true,targetComplete=target?.complete===true;
    if(incomingComplete&&(!lastComplete||incoming.signature!==lastComplete.signature))lastComplete=incoming;
    const tokenMatches=!target?.transitionToken||!activeTransitionToken||target.transitionToken===activeTransitionToken;
    if(target&&!tokenMatches){staleRejects++;pending=null;if(blend?.target.signature===target.signature)blend=null}
    const targetEligible=!!target&&identityMatches&&tokenMatches;
    if(targetEligible&&targetBuilding&&target.signature!==lastComplete?.signature)pending=target;
    if(input.cancelled){pending=null;blend=null;cancellations++}
    const hasPlanetarySource=input.hasPlanetarySource!==false;
    if(targetEligible&&targetComplete&&!targetBuilding){
      if(!lastComplete){pending=target;if(!blend||blend.target.signature!==target.signature)beginBlend(null,target,now)}
      else if(target.signature!==lastComplete.signature){pending=target;if(!blend||blend.target.signature!==target.signature)beginBlend(lastComplete,target,now)}
    }
    let blendProgress=blend?smooth((now-blend.startedAt)/duration):1,source=blend?.source||lastComplete,targetPlan=blend?.target||(!targetBuilding&&targetComplete&&targetEligible?target:null);
    if(blend&&blendProgress>=1){lastComplete=blend.target;source=lastComplete;targetPlan=lastComplete;pending=null;blend=null;blendProgress=1}
    const hasDetailedSource=!!source,sourceIsTarget=!!source&&!!targetPlan&&source.signature===targetPlan.signature,envelope=handoffPresentationEnvelope({coordinate,targetReady:!!targetPlan&&!targetBuilding,hasDetailedSource,hasPlanetarySource}),regionalPresence=smooth((coordinate-7)/.82);
    let sourceAlpha=0,targetAlpha=0,planetarySourceAlpha=0;
    if(blend){
      if(blend.source){sourceAlpha=(1-blendProgress)*regionalPresence;targetAlpha=blendProgress*regionalPresence;planetarySourceAlpha=hasPlanetarySource?1-regionalPresence:0}
      else{targetAlpha=blendProgress*regionalPresence;planetarySourceAlpha=hasPlanetarySource?1-targetAlpha:0}
    }else if(sourceIsTarget){sourceAlpha=regionalPresence;targetAlpha=regionalPresence;planetarySourceAlpha=hasPlanetarySource?1-regionalPresence:0}
    else if(hasDetailedSource){sourceAlpha=regionalPresence;planetarySourceAlpha=hasPlanetarySource?1-regionalPresence:0}
    else if(targetPlan){targetAlpha=regionalPresence;planetarySourceAlpha=hasPlanetarySource?1-regionalPresence:0}
    else if(hasPlanetarySource)planetarySourceAlpha=1;
    const coarseFallbackAlpha=!hasDetailedSource&&!targetPlan&&!hasPlanetarySource&&targetBuilding?1:0,technicalStructureVisible=coarseFallbackAlpha>0||(!hasDetailedSource&&!hasPlanetarySource&&envelope.technicalStructureSuppression>.4),visualCoverageAlpha=Math.max(sourceAlpha,targetAlpha,planetarySourceAlpha,coarseFallbackAlpha);
    const output=Object.freeze({contract:CONTRACT,epoch,stage,coordinate,identity,nextIdentityExact:identityMatches,coverage:Object.freeze({sourceKind:hasDetailedSource?'DETAILED_SURFACE':hasPlanetarySource?'PLANETARY_SURFACE':'NONE',sourceSignature:source?.signature||null,targetSignature:targetPlan?.signature||pending?.signature||null,pendingSignature:pending?.signature||null,sourcePatchIds:source?.patchIds||Object.freeze([]),targetPatchIds:targetPlan?.patchIds||Object.freeze([]),sourceAlpha,targetAlpha,planetarySourceAlpha,coarseFallbackAlpha,visualCoverageAlpha,noBlackout:visualCoverageAlpha>.001,retainedDetailedSource:hasDetailedSource&&!sourceIsTarget,retainedPlanetarySource:hasPlanetarySource&&planetarySourceAlpha>0,building:targetBuilding,capacity,bounded:capacity<=2}),presentation:envelope,technicalStructureVisible,metrics:Object.freeze({commits,cancellations,staleRejects,identityResets,identityContinuity:identityMatches,perceptualContinuity:clamp(1-coarseFallbackAlpha*.45-envelope.technicalStructureSuppression*(technicalStructureVisible?.2:0))})});
    lastOutput=output;return output;
  }
  return Object.freeze({
    update,
    cancel(){pending=null;blend=null;cancellations++;return true},
    snapshot(){return lastOutput||Object.freeze({contract:CONTRACT,epoch,identity,coverage:null,presentation:null,metrics:Object.freeze({commits,cancellations,staleRejects,identityResets})})}
  });
}

export function representationHandoffIntegrationContract(){
  return Object.freeze({contract:CONTRACT,owner:'R6-B',integrationOwner:'CONTROL_CONVERGENCE',rendererResponsibilities:Object.freeze(['retain last complete detailed terrain coverage while replacement builds','crossfade detailed source to detailed target only after target coverage is complete','reject stale transition tokens and retain the last valid detailed source','keep selected body/surface identity exact across global/regional/local frames','apply one continuous presentation envelope for atmosphere, stars, sky, horizon and terrain contrast','expose transition-critical UI occlusion reduction as an additive presentation hook','expose identity continuity separately from perceptual continuity']),r6dBoundary:Object.freeze(['no topology rewrite','no final seam stitching ownership','no morph algorithm replacement','no culling-policy ownership']),authority:Object.freeze({identity:'CANONICAL_OR_MODEL_DERIVED_EXISTING_AUTHORITY',terrainGeometry:'PRESENTATION_ONLY',presentationEnvelope:'PRESENTATION_ONLY'})});
}

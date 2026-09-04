(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-wave-iv-scale-runtime-1';
const SCENE_PROVIDER_CONTRACT='ofu-wave-iv-scene-provider-1';
const RENDERER_LIFECYCLE_CONTRACT='ofu-wave-iv-renderer-lifecycle-1';
const TRANSITION_CONTRACT='ofu-wave-iv-transition-1';
const SELECTION_CONTRACT='ofu-wave-iv-selection-1';
const CURRENT_BANDS=Object.freeze(['system','orbit','approach','close']);
const FUTURE_LADDER=Object.freeze(['galaxy','stellar_neighborhood','system','orbit','approach','global_surface','regional_surface','local_surface','human']);
const DEFAULT_ANCHORS=Object.freeze({system:180,orbit:4,approach:1.35,close:1.012});
const PLANET_FIELDS=Object.freeze(['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ','orbitSlot']);
const SYSTEM_FIELDS=Object.freeze(PLANET_FIELDS.slice(0,-1));
const listeners=new Map(),providers=new Map();
let sequence=0,transitionSequence=0;
const state={
 version:VERSION,
 contract:VERSION,
 selectionContract:SELECTION_CONTRACT,
 sceneProviderContract:SCENE_PROVIDER_CONTRACT,
 rendererLifecycleContract:RENDERER_LIFECYCLE_CONTRACT,
 transitionContract:TRANSITION_CONTRACT,
 semanticScale:'system',
 distanceIntentRadii:DEFAULT_ANCHORS.system,
 intentKind:'anchor',
 selectedCanonicalTarget:null,
 activeSceneProvider:'visual-universe-system',
 transition:null,
 cameraIntent:null,
 userNavigationSource:'bootstrap',
 lastStableState:null,
 anchors:{...DEFAULT_ANCHORS},
 commandCount:0,
 cameraCommandCount:0,
 scaleChanges:0,
 sceneChanges:0,
 selectionChanges:0,
 viewportChanges:0,
 rendererReady:0,
 lastEvent:null
};
function finitePositive(value,label){const n=Number(value);if(!Number.isFinite(n)||n<=0)throw new TypeError((label||'value')+' must be a positive finite number');return n}
function normalizeBand(value){const band=String(value||'').toLowerCase();if(!CURRENT_BANDS.includes(band))throw new Error('unsupported current semantic scale: '+band);return band}
function copyKey(key,fields=PLANET_FIELDS){if(!key)return null;return Object.freeze(Object.fromEntries(fields.map(name=>[name,BigInt(key[name])])))}
function sceneForBand(band){return band==='system'?'visual-universe-system':'planet-webgl'}
function threshold(a,b){return Math.sqrt(finitePositive(a,'scale anchor')*finitePositive(b,'scale anchor'))}
function deriveSemanticScale(distanceRadii,anchors=state.anchors){
 const d=finitePositive(distanceRadii,'distance radii');
 const system=finitePositive(anchors.system,'system anchor'),orbit=finitePositive(anchors.orbit,'orbit anchor'),approach=finitePositive(anchors.approach,'approach anchor'),close=finitePositive(anchors.close,'close anchor');
 if(!(system>orbit&&orbit>approach&&approach>close))throw new Error('scale anchors must be strictly descending');
 if(d>=threshold(system,orbit))return'system';
 if(d>=threshold(orbit,approach))return'orbit';
 if(d>=threshold(approach,close))return'approach';
 return'close';
}
function publicSelection(selection){if(!selection)return null;return Object.freeze({canonicalKey:selection.canonicalKey,canonicalSystemKey:selection.canonicalSystemKey,orbitIndex:selection.orbitIndex,planetId:selection.planetId||null,presentationStatus:selection.presentationStatus||null})}
function snapshot(){
 const anchors=Object.freeze({...state.anchors});
 return Object.freeze({version:VERSION,contract:VERSION,selectionContract:SELECTION_CONTRACT,sceneProviderContract:SCENE_PROVIDER_CONTRACT,rendererLifecycleContract:RENDERER_LIFECYCLE_CONTRACT,transitionContract:TRANSITION_CONTRACT,currentBands:CURRENT_BANDS,futureLadder:FUTURE_LADDER,compatibilityCloseBand:true,semanticScale:state.semanticScale,distanceIntentRadii:state.distanceIntentRadii,intentKind:state.intentKind,selectedCanonicalTarget:publicSelection(state.selectedCanonicalTarget),activeSceneProvider:state.activeSceneProvider,transition:state.transition,cameraIntent:state.cameraIntent,userNavigationSource:state.userNavigationSource,lastStableState:state.lastStableState,anchors,commandCount:state.commandCount,cameraCommandCount:state.cameraCommandCount,scaleChanges:state.scaleChanges,sceneChanges:state.sceneChanges,selectionChanges:state.selectionChanges,viewportChanges:state.viewportChanges,rendererReady:state.rendererReady,lastEvent:state.lastEvent})
}
function on(type,handler){if(typeof handler!=='function')throw new TypeError('event handler required');const key=String(type);let set=listeners.get(key);if(!set){set=new Set();listeners.set(key,set)}set.add(handler);return()=>set.delete(handler)}
function emit(type,detail={}){const event=Object.freeze({type:String(type),sequence:++sequence,at:typeof performance!=='undefined'&&performance.now?performance.now():Date.now(),detail:Object.freeze({...detail}),snapshot:snapshot()});state.lastEvent=Object.freeze({type:event.type,sequence:event.sequence});const set=listeners.get(event.type);if(set)for(const handler of [...set])handler(event);const all=listeners.get('*');if(all)for(const handler of [...all])handler(event);return event}
function providerFor(id){return providers.get(id)||null}
function applyProviderOwnership(nextId,previousId){if(previousId&&previousId!==nextId){try{providerFor(previousId)?.setActive?.(false,snapshot())}catch{}}if(nextId){try{providerFor(nextId)?.setActive?.(true,snapshot())}catch{}}}
function setActiveSceneForScale(band,source){const next=sceneForBand(band),previous=state.activeSceneProvider;if(next===previous)return;state.activeSceneProvider=next;state.sceneChanges++;applyProviderOwnership(next,previous);emit('sceneChanged',{previous,next,semanticScale:band,source})}
function setSelection(key,{planetId=null,presentationStatus=null,source='selection'}={}){const canonicalKey=copyKey(key),canonicalSystemKey=copyKey(key,SYSTEM_FIELDS),orbitIndex=Number(canonicalKey.orbitSlot);const previous=state.selectedCanonicalTarget;state.selectedCanonicalTarget=Object.freeze({canonicalKey,canonicalSystemKey,orbitIndex,planetId,presentationStatus});state.selectionChanges++;state.userNavigationSource=source;emit('selectionChanged',{previous:publicSelection(previous),next:publicSelection(state.selectedCanonicalTarget),source});return snapshot()}
function configureAnchor(band,distanceRadii,{source='framing'}={}){band=normalizeBand(band);const value=finitePositive(distanceRadii,band+' anchor');const next={...state.anchors,[band]:value};if(!(next.system>next.orbit&&next.orbit>next.approach&&next.approach>next.close))throw new Error('scale anchors must remain strictly descending');state.anchors=next;emit('scaleAnchorsChanged',{band,distanceRadii:value,source});return snapshot()}
function driveDistance(distanceRadii,source){const provider=providerFor('planet-webgl');if(!provider?.setDistanceRadii)return false;provider.setDistanceRadii(distanceRadii,{source});state.cameraCommandCount++;return true}
function commitScale({distanceRadii,semanticScale,intentKind,source,transition=true,driveCamera=true}){const distance=finitePositive(distanceRadii,'distance radii'),band=normalizeBand(semanticScale),previousBand=state.semanticScale,previousDistance=state.distanceIntentRadii,previousScene=state.activeSceneProvider;state.commandCount++;state.distanceIntentRadii=distance;state.semanticScale=band;state.intentKind=intentKind;state.userNavigationSource=source;if(previousBand!==band&&transition){state.transition=Object.freeze({contract:TRANSITION_CONTRACT,id:++transitionSequence,from:previousBand,to:band,source,startedAt:typeof performance!=='undefined'&&performance.now?performance.now():Date.now()});emit('transitionChanged',{transition:state.transition})}else state.transition=null;if(driveCamera)driveDistance(distance,source);setActiveSceneForScale(band,source);state.lastStableState=Object.freeze({semanticScale:band,distanceIntentRadii:distance,activeSceneProvider:state.activeSceneProvider,source});if(previousBand!==band||Math.abs(previousDistance-distance)>Number.EPSILON){state.scaleChanges++;emit('scaleChanged',{previousSemanticScale:previousBand,semanticScale:band,previousDistanceRadii:previousDistance,distanceRadii:distance,intentKind,source,sceneChanged:previousScene!==state.activeSceneProvider})}return snapshot()}
function requestStage(band,{source='stage-selection',transition=true,driveCamera=true}={}){band=normalizeBand(band);return commitScale({distanceRadii:state.anchors[band],semanticScale:band,intentKind:'anchor',source,transition,driveCamera})}
function setContinuousDistance(distanceRadii,{source='continuous-scale',driveCamera=true}={}){const distance=finitePositive(distanceRadii,'distance radii'),band=deriveSemanticScale(distance,state.anchors);return commitScale({distanceRadii:distance,semanticScale:band,intentKind:'continuous',source,transition:true,driveCamera})}
function dispatchCameraIntent(intent,{source='input'}={}){if(!intent||typeof intent!=='object')throw new TypeError('camera intent required');const normalized=Object.freeze({...intent,source});state.commandCount++;state.cameraIntent=normalized;state.userNavigationSource=source;emit('cameraIntent',{intent:normalized,activeSceneProvider:state.activeSceneProvider});const provider=providerFor(state.activeSceneProvider);if(provider?.cameraIntent){provider.cameraIntent(normalized,snapshot());state.cameraCommandCount++;return true}return false}
function registerSceneProvider(provider){if(!provider||typeof provider.id!=='string'||!provider.id)throw new TypeError('scene provider id required');const id=provider.id,scales=Object.freeze([...(provider.scales||[])].map(normalizeBand)),registered=Object.freeze({...provider,scales});providers.set(id,registered);state.rendererReady++;try{registered.setActive?.(id===state.activeSceneProvider,snapshot())}catch{}emit('rendererReady',{id,scales});if(id==='planet-webgl'&&registered.setDistanceRadii)driveDistance(state.distanceIntentRadii,'provider-ready');return()=>{if(providers.get(id)===registered)providers.delete(id)}}
function viewportChanged(viewport,{source='viewport'}={}){state.viewportChanges++;emit('viewportChanged',{viewport:Object.freeze({...viewport}),source,semanticScale:state.semanticScale,intentKind:state.intentKind});return snapshot()}
function completeTransition(){if(!state.transition)return snapshot();const completed=state.transition;state.transition=null;emit('transitionChanged',{transition:null,completed});return snapshot()}
const API=Object.freeze({VERSION,contract:VERSION,SELECTION_CONTRACT,SCENE_PROVIDER_CONTRACT,RENDERER_LIFECYCLE_CONTRACT,TRANSITION_CONTRACT,CURRENT_BANDS,FUTURE_LADDER,DEFAULT_ANCHORS,state,snapshot,on,emit,copyKey,deriveSemanticScale,configureAnchor,setSelection,requestStage,setContinuousDistance,dispatchCameraIntent,registerSceneProvider,viewportChanged,completeTransition});O.waveIVScaleRuntime=API;
})(typeof globalThis!=='undefined'?globalThis:this);

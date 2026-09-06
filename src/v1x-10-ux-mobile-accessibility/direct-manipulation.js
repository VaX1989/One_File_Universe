(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const DOC=typeof document!=='undefined'?document:null;
const VERSION='ofu-v1x10-direct-manipulation-1';
const AUTHORITY='PRESENTATION_ONLY';
const INPUT_CONTRACT='ofu-wave-iv-input-intent-3';
const INPUT_ROUTER_VERSION='ofu-wave-iv-input-router-6';
const SCALE_CONTRACT='ofu-wave-iv-scale-runtime-3';
const SELECTION_CONTRACT='ofu-wave-iv-selection-1';
const TRACE_LIMIT=96,TAP_SLOP=10;
const state={version:VERSION,authority:AUTHORITY,initialized:false,modality:'unknown',sequence:0,trace:[],pointerStarts:new Map(),pinchBaseline:null,lastSemanticScale:null,lastSelectionId:null,lastRouterCounts:null};
const frozen=x=>Object.freeze(x);
function push(type,detail={}){
 const event=frozen({sequence:++state.sequence,type:String(type),...detail});
 state.trace.push(event);if(state.trace.length>TRACE_LIMIT)state.trace.splice(0,state.trace.length-TRACE_LIMIT);return event;
}
function setModality(value){const next=String(value||'unknown');if(state.modality!==next){state.modality=next;push('modality',{modality:next});if(DOC)DOC.documentElement.dataset.ofuV1x10Input=next}}
function canvas(){return DOC?.getElementById('planet-view')||null}
function isCanvasEvent(e){return !!canvas()&&e?.target===canvas()}
function semanticSnapshot(){const R=O.waveIVScaleRuntime?.snapshot?.();return R?{semanticScale:R.semanticScale,distanceIntentRadii:R.distanceIntentRadii,selectionId:R.selectedCanonicalTarget?.planetId||null,presentationStatus:R.selectedCanonicalTarget?.presentationStatus||null}:null}
function routerCounts(){const r=O.waveIVInputRouter?.state;return r?frozen({wheel:r.wheelCommands||0,pointer:r.pointerIntents||0,pinch:r.pinchIntents||0,keyboard:r.keyboardIntents||0}):null}
function traceRouterDelta(label){const next=routerCounts(),prev=state.lastRouterCounts;state.lastRouterCounts=next;if(!next)return;push('router-observation',{label,owner:INPUT_ROUTER_VERSION,intentContract:INPUT_CONTRACT,counts:next,delta:prev?{wheel:next.wheel-prev.wheel,pointer:next.pointer-prev.pointer,pinch:next.pinch-prev.pinch,keyboard:next.keyboard-prev.keyboard}:null})}
function appendDescribedBy(node,id){const values=new Set(String(node.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));values.add(id);node.setAttribute('aria-describedby',[...values].join(' '))}
function replaceHelp(){
 const grid=DOC?.querySelector('#viewport-help .help-grid');if(!grid)return;
 const rows=[['Pointer','Drag to rotate or pan. Tap a selectable macro object to visit it. Wheel moves continuously through semantic scale.'],['Keyboard','Focus the viewport. Arrow keys change view or focused target; + and − travel through scale; Home reverses toward the outer view; Enter/Space activates a focused macro target.'],['Touch','Drag to look or pan. Pinch is semantic scale travel owned by the shared input router, not browser page zoom inside the viewport.'],['Presets','Scale buttons are optional anchors for fast travel. They do not replace direct wheel, pinch, pointer, or keyboard travel.']];
 grid.replaceChildren();
 for(const [title,text] of rows){const div=DOC.createElement('div'),strong=DOC.createElement('strong');strong.textContent=title;div.append(strong,DOC.createElement('br'),DOC.createTextNode(text));grid.append(div)}
}
function announce(text){const live=DOC?.getElementById('v1x10-live-status');if(live)live.textContent=String(text)}
function syncSemantic(reason='sync'){
 const s=semanticSnapshot();if(!s)return;
 if(s.semanticScale!==state.lastSemanticScale){state.lastSemanticScale=s.semanticScale;push('semantic-scale',{reason,semanticScale:s.semanticScale,distanceIntentRadii:s.distanceIntentRadii});announce('Scale '+String(s.semanticScale).replaceAll('_',' '))}
 if(s.selectionId!==state.lastSelectionId){state.lastSelectionId=s.selectionId;push('selection',{reason,selectionId:s.selectionId,presentationStatus:s.presentationStatus});if(s.selectionId)announce('Selected target '+s.selectionId.slice(0,12))}
}
function onPointerDown(e){if(!isCanvasEvent(e))return;setModality(e.pointerType==='touch'?'touch':e.pointerType==='pen'?'pen':'pointer');state.pointerStarts.set(e.pointerId,{x:e.clientX,y:e.clientY,type:e.pointerType,moved:false});if(state.pointerStarts.size===2){const p=[...state.pointerStarts.values()];state.pinchBaseline=Math.max(1,Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y));push('pinch-start',{pointerType:e.pointerType})}else push('pointer-start',{pointerType:e.pointerType})}
function onPointerMove(e){const p=state.pointerStarts.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(Math.hypot(dx,dy)>TAP_SLOP)p.moved=true;p.x=e.clientX;p.y=e.clientY;if(state.pointerStarts.size>=2){const ps=[...state.pointerStarts.values()],d=Math.max(1,Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y));if(state.pinchBaseline){const ratio=d/state.pinchBaseline;if(Math.abs(ratio-1)>.04){push('pinch-observed',{ratioMilli:Math.round(ratio*1000)});state.pinchBaseline=d;root.queueMicrotask?.(()=>traceRouterDelta('pinch'))}}}}
function onPointerEnd(e){const p=state.pointerStarts.get(e.pointerId);if(!p)return;const remaining=state.pointerStarts.size-1;if(!p.moved&&remaining===0)push('tap-observed',{pointerType:p.type||e.pointerType||'unknown'});state.pointerStarts.delete(e.pointerId);if(state.pointerStarts.size<2)state.pinchBaseline=null;root.queueMicrotask?.(()=>{traceRouterDelta('pointer-end');syncSemantic('pointer-end')})}
function onWheel(e){if(!isCanvasEvent(e))return;setModality('wheel');push('wheel-observed',{direction:Number(e.deltaY)>0?'out':Number(e.deltaY)<0?'in':'none'});root.queueMicrotask?.(()=>{traceRouterDelta('wheel');syncSemantic('wheel')})}
function onKey(e){if(!isCanvasEvent(e))return;const keys=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_','Home','Enter',' ','Spacebar']);if(!keys.has(e.key))return;setModality('keyboard');push('keyboard-observed',{key:e.key===' '?'Space':e.key});root.queueMicrotask?.(()=>{traceRouterDelta('keyboard');syncSemantic('keyboard')})}
function installRuntimeObservers(){const R=O.waveIVScaleRuntime;if(!R?.on)return false;R.on('scaleChanged',e=>{push('scale-runtime',{source:e.detail?.source||null,semanticScale:e.snapshot.semanticScale,distanceIntentRadii:e.snapshot.distanceIntentRadii});syncSemantic('scale-runtime')});R.on('selectionChanged',e=>{push('selection-runtime',{source:e.detail?.source||null,selectionId:e.snapshot.selectedCanonicalTarget?.planetId||null});syncSemantic('selection-runtime')});R.on('cameraIntent',e=>push('camera-runtime',{source:e.detail?.intent?.source||e.detail?.source||null,kind:e.detail?.intent?.kind||null,semanticScale:e.snapshot.semanticScale}));return true}
function init(){
 if(state.initialized||!DOC)return;const node=canvas();if(!node)return;state.initialized=true;
 if(O.waveIVInputRouter?.VERSION&&O.waveIVInputRouter.VERSION!==INPUT_ROUTER_VERSION)throw new Error('V1X-10 requires frozen input router '+INPUT_ROUTER_VERSION);
 if(O.waveIVScaleRuntime?.VERSION&&O.waveIVScaleRuntime.VERSION!==SCALE_CONTRACT)throw new Error('V1X-10 requires frozen scale runtime '+SCALE_CONTRACT);
 const help=DOC.createElement('p');help.id='v1x10-input-help';help.className='v1x10-visually-hidden';help.textContent='Direct manipulation uses the shared input router. Pointer drag changes view, tap selects supported macro targets, wheel and pinch travel semantic scale, and keyboard provides the same primary journey.';
 const live=DOC.createElement('p');live.id='v1x10-live-status';live.className='v1x10-visually-hidden';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');live.textContent='Universe viewport ready.';
 node.parentElement?.append(help,live);appendDescribedBy(node,help.id);appendDescribedBy(node,live.id);node.setAttribute('aria-keyshortcuts','ArrowLeft ArrowRight ArrowUp ArrowDown + - Home Enter Space');node.dataset.v1x10DirectManipulation='shared-router';
 replaceHelp();DOC.documentElement.dataset.ofuV1x10DirectManipulation='true';
 DOC.addEventListener('pointerdown',onPointerDown,true);DOC.addEventListener('pointermove',onPointerMove,true);DOC.addEventListener('pointerup',onPointerEnd,true);DOC.addEventListener('pointercancel',onPointerEnd,true);DOC.addEventListener('wheel',onWheel,{capture:true,passive:true});DOC.addEventListener('keydown',onKey,true);
 state.lastRouterCounts=routerCounts();installRuntimeObservers();syncSemantic('init');push('initialized',{inputOwner:INPUT_ROUTER_VERSION,intentContract:INPUT_CONTRACT,scaleContract:SCALE_CONTRACT,selectionContract:SELECTION_CONTRACT});
}
function snapshot(){return frozen({version:VERSION,authority:AUTHORITY,initialized:state.initialized,inputOwner:INPUT_ROUTER_VERSION,intentContract:INPUT_CONTRACT,scaleContract:SCALE_CONTRACT,selectionContract:SELECTION_CONTRACT,secondInputAuthority:false,routesNativeInput:false,modality:state.modality,semantic:semanticSnapshot(),router:routerCounts(),traceLength:state.trace.length})}
const api=frozen({VERSION,AUTHORITY,INPUT_CONTRACT,INPUT_ROUTER_VERSION,SCALE_CONTRACT,SELECTION_CONTRACT,state,snapshot,trace:()=>frozen(state.trace.slice()),init});O.v1x10DirectManipulation=api;root.__OFU_V1X10_DIRECT_MANIPULATION__=api;if(DOC){if(DOC.readyState==='loading')DOC.addEventListener('DOMContentLoaded',init,{once:true});else init()}
})(typeof globalThis!=='undefined'?globalThis:this);

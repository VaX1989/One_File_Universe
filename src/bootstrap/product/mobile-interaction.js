(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const DOC=typeof document!=='undefined'?document:null;
if(!DOC){O.v08MobileInteraction=Object.freeze({seamVersion:3,active:false});return}
const q=s=>DOC.querySelector(s);
const MOBILE_QUERY='(max-width: 700px), (max-height: 520px) and (pointer: coarse)';
const mobileQuery=typeof root.matchMedia==='function'?root.matchMedia(MOBILE_QUERY):null;
const coarseQuery=typeof root.matchMedia==='function'?root.matchMedia('(pointer: coarse)'):null;
const reducedQuery=typeof root.matchMedia==='function'?root.matchMedia('(prefers-reduced-motion: reduce)'):null;
const state={seamVersion:3,initialized:false,active:false,workspace:'explore',sheet:'expanded',lastGesture:'none',canvasPointerCancels:0,resizeEvents:0,orientationEvents:0,visualViewportEvents:0,lastViewport:null,diagnosticsOpen:false};
let panel=null,body=null,toggle=null,toggleLabel=null,toggleState=null,diagnostics=null,diagnosticsText=null,diagnosticsButton=null,drag=null,raf=0;

function sourceKind(){
 const protocol=String(root.location?.protocol||'').toLowerCase();
 if(protocol==='file:')return'file';
 if(protocol==='content:')return'content';
 return protocol?protocol.replace(/:$/,''):'unknown';
}
function orientationName(){
 return root.screen?.orientation?.type||(root.innerWidth>root.innerHeight?'landscape':'portrait');
}
function workspaceName(){return O.productUI?.state?.workspace||DOC.documentElement.dataset.workspace||'explore'}
function mobileActive(){return mobileQuery?mobileQuery.matches:root.innerWidth<=700}
function interactiveNodes(){return body?[...body.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]')]:[]}
function setFallbackTabStops(enabled){
 for(const el of interactiveNodes()){
  if(enabled){if(el.hasAttribute('data-ofu-mobile-tab')){const old=el.getAttribute('data-ofu-mobile-tab');if(old==='')el.removeAttribute('tabindex');else el.setAttribute('tabindex',old);el.removeAttribute('data-ofu-mobile-tab')}}
  else if(!el.hasAttribute('data-ofu-mobile-tab')){el.setAttribute('data-ofu-mobile-tab',el.getAttribute('tabindex')||'');el.setAttribute('tabindex','-1')}
 }
}
function setBodyInteractive(enabled){
 if(!body)return;
 body.setAttribute('aria-hidden',enabled?'false':'true');
 if('inert' in body)body.inert=!enabled;else setFallbackTabStops(enabled);
}
function updateToggle(){
 if(!toggle)return;
 const label=state.workspace==='inspect'?'Inspector':state.workspace==='lab'?'Lab':'Explore details';
 const expanded=state.sheet==='expanded';
 toggleLabel.textContent=label;
 toggleState.textContent=expanded?'v':'^';
 toggle.setAttribute('aria-expanded',expanded?'true':'false');
 toggle.setAttribute('aria-label',(expanded?'Collapse ':'Expand ')+label+' panel');
 if(panel)panel.dataset.mobileSheetState=state.sheet;
 setBodyInteractive(!state.active||expanded);
}
function setSheet(next,{announce=false}={}){
 const normalized=next==='peek'?'peek':'expanded';
 if(!state.active&&normalized==='peek')return setSheet('expanded',{announce:false});
 if(state.sheet===normalized){updateToggle();return}
 state.sheet=normalized;updateToggle();
 if(announce)O.productUI?.announce?.(normalized==='expanded'?'Details expanded':'Details collapsed');
 renderDiagnostics();
}
function syncWorkspace({preserveFocus=false}={}){
 state.workspace=workspaceName();
 if(!state.active){setSheet('expanded');return}
 if(state.workspace==='inspect'||state.workspace==='lab'){setSheet('expanded');return}
 const focusedInside=!!(body&&body.contains(DOC.activeElement));
 setSheet(preserveFocus&&focusedInside?'expanded':'peek');
}
function snapshot(){
 const vv=root.visualViewport||null,canvas=DOC.getElementById('planet-view'),rect=canvas?.getBoundingClientRect?.(),kind=sourceKind(),ownedInput=O.waveIVInputRouter?.state;
 return Object.freeze({
  seamVersion:state.seamVersion,
  active:state.active,
  workspace:state.workspace,
  sheet:state.sheet,
  diagnosticsOpen:state.diagnosticsOpen,
  source:Object.freeze({kind,localDirect:kind==='file'||kind==='content'}),
  viewport:Object.freeze({layoutWidth:root.innerWidth||0,layoutHeight:root.innerHeight||0,visualWidth:vv?.width??root.innerWidth??0,visualHeight:vv?.height??root.innerHeight??0,visualScale:vv?.scale??1,dpr:root.devicePixelRatio||1,orientation:orientationName()}),
  input:Object.freeze({coarse:!!coarseQuery?.matches,maxTouchPoints:root.navigator?.maxTouchPoints||0,canvasTouchAction:canvas?root.getComputedStyle(canvas).touchAction:null,lastGesture:ownedInput?.lastGesture||state.lastGesture,canvasPointerCancels:ownedInput?.pointerCancels??state.canvasPointerCancels,lostPointerCaptures:ownedInput?.lostPointerCaptures??0,pointerResets:ownedInput?.pointerResets??0,gestureOwner:ownedInput?.initialized?'wave-iv-input-router':'legacy-preview'}),
  canvas:rect?Object.freeze({width:Math.round(rect.width),height:Math.round(rect.height),top:Math.round(rect.top),bottom:Math.round(rect.bottom)}):null,
  renderer:Object.freeze({targetStatus:root.__OFU_PLANET_PREVIEW__?.targetStatus||null,pointerActive:root.__OFU_PLANET_PREVIEW__?.pointerActive??null}),
  accessibility:Object.freeze({reducedMotion:!!reducedQuery?.matches,sheetExpanded:state.sheet==='expanded'}),
  events:Object.freeze({resize:state.resizeEvents,orientation:state.orientationEvents,visualViewport:state.visualViewportEvents})
 });
}
function diagnosticLines(){
 const s=snapshot(),v=s.viewport,i=s.input,c=s.canvas;
 return[
  `layout ${Math.round(v.layoutWidth)}x${Math.round(v.layoutHeight)} | visual ${Math.round(v.visualWidth)}x${Math.round(v.visualHeight)} @${v.visualScale.toFixed(2)} | dpr ${v.dpr}`,
  `orientation ${v.orientation} | source ${s.source.kind} | local-direct ${s.source.localDirect}`,
  `input ${i.coarse?'coarse':'fine'} | touch-points ${i.maxTouchPoints} | canvas ${i.canvasTouchAction||'unknown'}`,
  `sheet ${s.sheet} | workspace ${s.workspace} | reduced-motion ${s.accessibility.reducedMotion}`,
  `canvas ${c?c.width+'x'+c.height:'missing'} | renderer ${s.renderer.targetStatus||'pending'} | pointer ${String(s.renderer.pointerActive)}`,
  `last-gesture ${i.lastGesture} | pointer-cancels ${i.canvasPointerCancels}`,
  'Physical-device status is browser-reported only; capture a screenshot with this panel open for founder retest evidence.'
 ].join('\n');
}
function renderDiagnostics(){if(diagnosticsText&&!diagnostics.hidden)diagnosticsText.textContent=diagnosticLines()}
function updateViewport(){
 raf=0;
 const vv=root.visualViewport||null,h=Math.max(1,Math.round(vv?.height||root.innerHeight||1)),w=Math.max(1,Math.round(vv?.width||root.innerWidth||1));
 DOC.documentElement.style.setProperty('--ofu-mobile-visual-height',h+'px');
 DOC.documentElement.style.setProperty('--ofu-mobile-visual-width',w+'px');
 state.lastViewport={width:w,height:h};
 renderDiagnostics();
}
function scheduleViewport(){if(raf)return;raf=(root.requestAnimationFrame||((fn)=>root.setTimeout(fn,0)))(updateViewport)}
function syncMode({preserveFocus=true}={}){
 const wasActive=state.active;
 state.active=mobileActive();
 DOC.documentElement.dataset.ofuMobile=state.active?'true':'false';
 DOC.documentElement.dataset.ofuInput=coarseQuery?.matches?'coarse':'fine';
 state.workspace=workspaceName();
 if(!state.active)setSheet('expanded');
 else if(state.workspace==='inspect'||state.workspace==='lab')setSheet('expanded');
 else if(!wasActive){
  const focusedInside=!!(body&&body.contains(DOC.activeElement));
  setSheet('peek');
  if(focusedInside)toggle?.focus({preventScroll:true});
 }else syncWorkspace({preserveFocus});
 scheduleViewport();
}
function buildSheet(){
 panel=q('.experience > .panel');
 if(!panel||panel.dataset.mobileComposed==='true')return !!panel;
 panel.dataset.mobileComposed='true';panel.id=panel.id||'mobile-sheet';
 const children=[...panel.children];
 const bar=DOC.createElement('div');bar.className='mobile-sheet-bar';bar.setAttribute('data-mobile-sheet-handle','');
 const grip=DOC.createElement('span');grip.className='mobile-sheet-grip';grip.setAttribute('aria-hidden','true');
 toggle=DOC.createElement('button');toggle.type='button';toggle.className='mobile-sheet-toggle';toggle.setAttribute('aria-controls','mobile-sheet-body');
 toggleLabel=DOC.createElement('span');toggleLabel.className='mobile-sheet-toggle-label';
 toggleState=DOC.createElement('span');toggleState.className='mobile-sheet-toggle-state';toggleState.setAttribute('aria-hidden','true');
 toggle.append(toggleLabel,toggleState);
 diagnosticsButton=DOC.createElement('button');diagnosticsButton.type='button';diagnosticsButton.className='mobile-diagnostics-toggle';diagnosticsButton.textContent='Device';diagnosticsButton.setAttribute('aria-controls','mobile-device-diagnostics');diagnosticsButton.setAttribute('aria-expanded','false');diagnosticsButton.setAttribute('aria-label','Show device diagnostics');
 bar.append(grip,toggle,diagnosticsButton);
 diagnostics=DOC.createElement('section');diagnostics.className='mobile-device-diagnostics';diagnostics.id='mobile-device-diagnostics';diagnostics.hidden=true;diagnostics.setAttribute('aria-label','Device diagnostics');
 const head=DOC.createElement('div');head.className='mobile-diagnostics-head';
 const title=DOC.createElement('strong');title.textContent='Device diagnostics';
 const close=DOC.createElement('button');close.type='button';close.className='mobile-diagnostics-close';close.textContent='Close';close.setAttribute('aria-label','Close device diagnostics');
 diagnosticsText=DOC.createElement('pre');diagnosticsText.id='mobile-device-diagnostics-output';diagnosticsText.textContent='pending';
 head.append(title,close);diagnostics.append(head,diagnosticsText);
 body=DOC.createElement('div');body.className='mobile-sheet-body';body.id='mobile-sheet-body';for(const child of children)body.append(child);
 panel.append(bar,diagnostics,body);
 toggle.addEventListener('click',()=>setSheet(state.sheet==='expanded'?'peek':'expanded',{announce:true}));
 diagnosticsButton.addEventListener('click',()=>{const opening=diagnostics.hidden;if(opening&&state.sheet!=='expanded')setSheet('expanded');diagnostics.hidden=!opening;state.diagnosticsOpen=opening;diagnosticsButton.setAttribute('aria-expanded',opening?'true':'false');diagnosticsButton.setAttribute('aria-label',opening?'Hide device diagnostics':'Show device diagnostics');if(opening)renderDiagnostics()});
 close.addEventListener('click',()=>{diagnostics.hidden=true;state.diagnosticsOpen=false;diagnosticsButton.setAttribute('aria-expanded','false');diagnosticsButton.setAttribute('aria-label','Show device diagnostics');diagnosticsButton.focus({preventScroll:true})});
 bar.addEventListener('pointerdown',e=>{if(!state.active||e.target.closest('button')||!(e.pointerType==='touch'||e.pointerType==='pen'))return;drag={id:e.pointerId,y:e.clientY};try{bar.setPointerCapture(e.pointerId)}catch{}});
 bar.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const dy=e.clientY-drag.y;drag=null;if(Math.abs(dy)<28)return;state.lastGesture=dy<0?'sheet-swipe-up':'sheet-swipe-down';setSheet(dy<0?'expanded':'peek',{announce:true})});
 bar.addEventListener('pointercancel',()=>{drag=null});
 return true;
}
function bind(){
 DOC.addEventListener('click',e=>{const open=e.target.closest?.('[data-open-workspace]');if(open){syncWorkspace({preserveFocus:true});return}if(e.target.closest?.('[data-workspace]'))syncWorkspace({preserveFocus:false})},false);
 DOC.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&state.active&&workspaceName()==='explore'&&state.sheet==='expanded'){setSheet('peek',{announce:true});toggle?.focus({preventScroll:true});return}
  if(e.target.closest?.('[data-workspace]')&&(e.key==='ArrowLeft'||e.key==='ArrowRight'))syncWorkspace({preserveFocus:false});
 },false);
 DOC.addEventListener('focusin',e=>{if(state.active&&state.sheet==='peek'&&body?.contains(e.target))setSheet('expanded')});
 const canvas=DOC.getElementById('planet-view');
 canvas?.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.pointerType==='pen')state.lastGesture='canvas-'+e.pointerType});
 canvas?.addEventListener('pointercancel',()=>{state.canvasPointerCancels++;state.lastGesture='canvas-pointercancel';renderDiagnostics()});
 const workspaceObserver=new MutationObserver(records=>{if(records.some(r=>r.attributeName==='data-workspace'))syncWorkspace({preserveFocus:true})});workspaceObserver.observe(DOC.documentElement,{attributes:true,attributeFilter:['data-workspace']});
 const onMedia=()=>syncMode({preserveFocus:true});
 mobileQuery?.addEventListener?.('change',onMedia);coarseQuery?.addEventListener?.('change',onMedia);reducedQuery?.addEventListener?.('change',renderDiagnostics);
 root.addEventListener('resize',()=>{state.resizeEvents++;syncMode({preserveFocus:true})},{passive:true});
 root.addEventListener('orientationchange',()=>{state.orientationEvents++;syncMode({preserveFocus:true})},{passive:true});
 root.visualViewport?.addEventListener?.('resize',()=>{state.visualViewportEvents++;scheduleViewport()},{passive:true});
 root.visualViewport?.addEventListener?.('scroll',()=>{state.visualViewportEvents++;scheduleViewport()},{passive:true});
}
function init(){
 if(state.initialized)return;state.initialized=true;
 if(!buildSheet())return;
 bind();syncMode({preserveFocus:true});updateToggle();updateViewport();
 root.__OFU_MOBILE_INTERACTION__=api;
}
const api=Object.freeze({seamVersion:3,state,snapshot,expand:()=>setSheet('expanded',{announce:true}),collapse:()=>setSheet('peek',{announce:true}),refresh:()=>{syncMode({preserveFocus:true});return snapshot()}});
O.v08MobileInteraction=api;
if(DOC.readyState==='loading')DOC.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof globalThis!=='undefined'?globalThis:this);

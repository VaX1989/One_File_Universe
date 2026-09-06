(function(root){
'use strict';
const O=root.OFU=root.OFU||{},DOC=typeof document!=='undefined'?document:null;
const VERSION='ofu-v1x10-viewport-ux-1',AUTHORITY='PRESENTATION_ONLY';
const state={version:VERSION,initialized:false,workspace:'explore',selectionId:null,semanticScale:null,presentationStatus:null,compact:false,occlusionChecks:0,lastOcclusion:null,inspectOpens:0,labOpens:0,escapeReturns:0};
let dock=null,copy=null,authority=null,inspectButton=null,labButton=null,resizeObserver=null,mutationObserver=null;
const q=s=>DOC?.querySelector(s)||null;
function workspace(){return O.productUI?.state?.workspace||DOC?.documentElement.dataset.workspace||'explore'}
function labelScale(s){return String(s||'unknown').replaceAll('_',' ')}
function name(){return DOC?.getElementById('selected-object-name')?.textContent?.trim()||'Current selection'}
function openWorkspace(target,{focus=true}={}){
 if(O.productUI?.workspace){O.productUI.workspace(target,{focus,announceChange:true});return true}
 const button=DOC?.querySelector(`button[data-workspace="${target}"]`);if(button){button.click();return true}return false
}
function openInspect(){if(openWorkspace('inspect')){state.inspectOpens++;root.queueMicrotask?.(()=>q('[data-workspace-panel="inspect"]')?.focus?.({preventScroll:false}))}}
function openLab(){
 if(O.v08LabTechnical?.open){O.v08LabTechnical.open('canonical-evidence',{announce:true});state.labOpens++;return}
 if(openWorkspace('lab'))state.labOpens++
}
function selected(){const s=O.waveIVScaleRuntime?.snapshot?.();return s?.selectedCanonicalTarget||null}
function update(){
 if(!dock)return;const s=O.waveIVScaleRuntime?.snapshot?.(),sel=selected();state.workspace=workspace();state.selectionId=sel?.planetId||null;state.semanticScale=s?.semanticScale||null;state.presentationStatus=sel?.presentationStatus||null;
 const selectedName=name(),scale=labelScale(state.semanticScale);
 copy.textContent=state.selectionId?`${selectedName} · ${scale} scale`:`${selectedName} · ${scale} scale`;
 authority.textContent=state.selectionId?`Canonical selection identity · visual presentation ${AUTHORITY}${state.presentationStatus?` · ${state.presentationStatus}`:''}`:`Viewport presentation ${AUTHORITY} · no new scientific claim`;
 inspectButton.disabled=!state.selectionId&&state.workspace==='inspect';
 DOC.documentElement.dataset.ofuV1x10Workspace=state.workspace;DOC.documentElement.dataset.ofuV1x10Scale=String(state.semanticScale||'unknown');
 measureOcclusion();
}
function safePanelHeight(){
 const mobile=DOC?.documentElement.dataset.ofuMobile==='true',panel=q('.experience > .panel');if(!mobile||!panel)return 0;const style=root.getComputedStyle?.(panel);if(style?.position!=='fixed')return 0;const r=panel.getBoundingClientRect();return Math.max(0,Math.round((root.visualViewport?.height||root.innerHeight||0)-r.top))
}
function measureOcclusion(){
 if(!DOC)return null;state.occlusionChecks++;const mobile=DOC.documentElement.dataset.ofuMobile==='true',panel=q('.experience > .panel'),scale=q('.scale-bar'),context=dock,viewportHeight=root.visualViewport?.height||root.innerHeight||0;
 const panelHeight=safePanelHeight();DOC.documentElement.style.setProperty('--v1x10-panel-safe-bottom',panelHeight?`${panelHeight}px`:'0px');
 const pr=panel?.getBoundingClientRect?.(),sr=scale?.getBoundingClientRect?.(),cr=context?.getBoundingClientRect?.();
 const overlap=(a,b)=>!!a&&!!b&&Math.max(a.left,b.left)<Math.min(a.right,b.right)&&Math.max(a.top,b.top)<Math.min(a.bottom,b.bottom);
 const result={mobile,viewportHeight:Math.round(viewportHeight),panelVisibleHeight:panelHeight,scaleOccluded:mobile&&overlap(pr,sr),contextOccluded:mobile&&overlap(pr,cr),scaleReachable:!!sr&&sr.top<viewportHeight&&sr.bottom>0,contextReachable:!!cr&&cr.top<viewportHeight&&cr.bottom>0};
 state.lastOcclusion=Object.freeze(result);DOC.documentElement.dataset.ofuV1x10CriticalControls=result.scaleOccluded||result.contextOccluded?'needs-layout':'reachable';return result
}
function onViewportKey(e){
 const c=DOC?.getElementById('planet-view');if(e.target!==c||e.ctrlKey||e.metaKey||e.altKey)return;if(String(e.key).toLowerCase()==='i'){e.preventDefault();e.stopPropagation();openInspect()}
}
function onEscape(e){
 if(e.key!=='Escape'||workspace()==='explore')return;const panel=q('.experience > .panel');if(panel&&!panel.contains(DOC.activeElement))return;e.preventDefault();if(openWorkspace('explore',{focus:false})){state.escapeReturns++;root.queueMicrotask?.(()=>DOC.getElementById('planet-view')?.focus?.({preventScroll:true}))}
}
function mount(){
 const shell=q('.viewport-shell');if(!shell||dock)return false;dock=DOC.createElement('aside');dock.className='v1x10-context-dock';dock.id='v1x10-context-dock';dock.setAttribute('aria-label','Contextual selection actions');
 const text=DOC.createElement('div');text.className='v1x10-context-text';copy=DOC.createElement('strong');copy.id='v1x10-context-copy';authority=DOC.createElement('span');authority.className='v1x10-context-authority';text.append(copy,authority);
 const actions=DOC.createElement('div');actions.className='v1x10-context-actions';inspectButton=DOC.createElement('button');inspectButton.type='button';inspectButton.className='v1x10-context-action';inspectButton.textContent='Inspect selection';inspectButton.setAttribute('aria-keyshortcuts','I');labButton=DOC.createElement('button');labButton.type='button';labButton.className='v1x10-context-action secondary';labButton.textContent='Evidence / Lab';actions.append(inspectButton,labButton);dock.append(text,actions);
 const scale=q('.scale-bar');if(scale&&scale.parentElement===shell)shell.insertBefore(dock,scale);else shell.append(dock);inspectButton.addEventListener('click',openInspect);labButton.addEventListener('click',openLab);return true
}
function bind(){
 DOC.addEventListener('keydown',onViewportKey,true);DOC.addEventListener('keydown',onEscape,true);O.waveIVScaleRuntime?.on?.('selectionChanged',update);O.waveIVScaleRuntime?.on?.('scaleChanged',update);
 const selectedName=DOC.getElementById('selected-object-name'),status=DOC.getElementById('render-target-state');if(typeof MutationObserver==='function'){mutationObserver=new MutationObserver(update);if(selectedName)mutationObserver.observe(selectedName,{childList:true,subtree:true,characterData:true});if(status)mutationObserver.observe(status,{childList:true,subtree:true,characterData:true});mutationObserver.observe(DOC.documentElement,{attributes:true,attributeFilter:['data-workspace','data-ofu-mobile']})}
 if(typeof ResizeObserver==='function'){resizeObserver=new ResizeObserver(()=>measureOcclusion());for(const node of [q('.viewport-shell'),q('.scale-bar'),q('.experience > .panel')])if(node)resizeObserver.observe(node)}
 root.addEventListener?.('resize',measureOcclusion,{passive:true});root.visualViewport?.addEventListener?.('resize',measureOcclusion,{passive:true});root.visualViewport?.addEventListener?.('scroll',measureOcclusion,{passive:true});
}
function init(){if(state.initialized||!DOC)return;if(!mount())return;state.initialized=true;DOC.documentElement.dataset.ofuV1x10ViewportFirst='true';bind();update();root.requestAnimationFrame?.(()=>measureOcclusion())}
function snapshot(){return Object.freeze({...state,lastOcclusion:state.lastOcclusion,authority:AUTHORITY,contextDockMounted:!!dock,inspectShortcut:'i',escapeReturnsToViewport:true})}
const api=Object.freeze({VERSION,AUTHORITY,state,init,update,openInspect,openLab,measureOcclusion,snapshot});O.v1x10ViewportUX=api;root.__OFU_V1X10_VIEWPORT_UX__=api;if(DOC){if(DOC.readyState==='loading')DOC.addEventListener('DOMContentLoaded',init,{once:true});else init()}
})(typeof globalThis!=='undefined'?globalThis:this);

(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
if(typeof document==='undefined')return;
const q=id=>document.getElementById(id);
const REDUCED=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={workspace:'explore',lastSync:'',syncs:0,reducedMotion:REDUCED(),lastAnnouncement:'',lastSelectedId:null,lastTargetStatus:null,lastTargetReason:null,lastArchiveOutput:null};
const short=id=>id&&id.length>22?id.slice(0,10)+'…'+id.slice(-8):id||'pending';
const text=(id,value)=>{const n=q(id);if(n&&n.textContent!==String(value))n.textContent=String(value)};
const hidden=(id,value)=>{const n=q(id);if(n)n.hidden=!!value};
function announce(message){if(!message||message===state.lastAnnouncement)return;state.lastAnnouncement=message;text('live-status',message)}
function workspace(name,{focus=false,announceChange=true}={}){
 if(!['explore','inspect','lab'].includes(name))return;
 state.workspace=name;
 for(const button of document.querySelectorAll('button[data-workspace]')){const active=button.dataset.workspace===name;button.setAttribute('aria-selected',active?'true':'false');button.tabIndex=active?0:-1}
 for(const panel of document.querySelectorAll('[data-workspace-panel]'))panel.hidden=panel.dataset.workspacePanel!==name;
 document.documentElement.dataset.workspace=name;
 if(focus){const panel=document.querySelector(`[data-workspace-panel="${name}"]`);panel?.focus({preventScroll:false})}
 if(announceChange)announce(name==='explore'?'Explore workspace':'Opened '+name+' workspace')
}
function ordinal(value){try{return String(BigInt(value)+1n)}catch{return'?'}}
function keyLabel(type,key){
 if(!type||!key)return type||'Selected object';
 if(type==='Planet')return `Planet ${ordinal(key.orbitSlot)} · current system`;
 if(type==='System')return 'Current star system';
 if(type==='Star')return `Star ${ordinal(key.componentIndex)} · current system`;
 if(type==='Moon')return `Moon ${ordinal(key.satelliteSlot)} · Planet ${ordinal(key.orbitSlot)}`;
 if(type==='Sector')return 'Canonical sector';
 if(type==='Galaxy')return 'Canonical galaxy';
 if(type==='Region')return 'Canonical region';
 return String(type);
}
function reasonText(reason){
 const map={P3_ABSENT:'No canonical planet exists at this location.',P5_MASS_DOMAIN:'This world exists, but its physical state is outside the range currently supported for visualization.',MASS_DOMAIN:'This world exists, but its physical state is outside the range currently supported for visualization.',P5_BULK_PRIOR:'This world exists, but its bulk class is outside the range currently supported for visualization.',TEST_ONLY_NEGATIVE_FIXTURE:'Intentional negative rendering fixture.'};
 return map[reason]||'This canonical world exists, but the current visualization model cannot show it.';
}
function sync(){
 const P=root.__OFU_PLANET_PREVIEW__,I=O.inspectorTest?.state?.current;
 const payload={workspace:state.workspace,reduced:state.reducedMotion,previewStatus:P?.targetStatus||null,planet:P?.provider?.planetId||P?.chosen?.planetId||null,reason:P?.targetReason||null,scale:P?.regime||null,distance:P?.camera&&P?.radius?P.camera.distanceM/P.radius:null,inspectorType:I?.type||null,inspectorId:I?.r?.id?O.p2?.hex(I.r.id):null};
 const stamp=JSON.stringify(payload);if(stamp===state.lastSync)return;state.lastSync=stamp;state.syncs++;
 const fullId=payload.planet||null,viewportLabel=P?.chosen?.key?keyLabel('Planet',P.chosen.key):'Planet';
 text('selected-object-name',viewportLabel);text('selected-object-class','PLANET');text('selected-object-id',short(fullId));q('selected-object-id')?.setAttribute('title',fullId||'');text('render-planet',viewportLabel);q('render-planet')?.setAttribute('title',fullId||'');
 if(I)text('inspector-selection-label',keyLabel(I.type,I.key));
 if(payload.previewStatus==='SUPPORTED'){
  hidden('viewport-state',true);text('render-target-state','READY');q('render-target-state')?.setAttribute('data-tone','ok');text('viewport-status','The viewport shows a visual realization of the selected canonical planet. Camera state does not alter scientific facts.');
  text('science-environment',P.environment?(P.environment.authority==='P5_CANONICAL'?'Canonical environment':'Environment'):'Not evaluated for this target');
  text('science-biology',P.eligibility?(P.eligibility.state==='INSUFFICIENT_ENVIRONMENT'?'Insufficient environment':P.eligibility.state):'Not evaluated for this target');
 }else if(payload.previewStatus==='UNSUPPORTED'){
  const reason=reasonText(payload.reason);hidden('viewport-state',false);text('viewport-state-title','Visualization unavailable');text('viewport-state-message',reason);text('viewport-status','Visualization unavailable for the selected canonical planet. '+reason);text('render-target-state','UNSUPPORTED');q('render-target-state')?.setAttribute('data-tone','warn');text('science-environment','Not evaluated — target unsupported');text('science-biology','Not evaluated — target unsupported');
 }
 if(payload.previewStatus!==state.lastTargetStatus||payload.reason!==state.lastTargetReason){state.lastTargetStatus=payload.previewStatus;state.lastTargetReason=payload.reason;if(payload.previewStatus==='UNSUPPORTED')announce('Visualization unavailable. '+reasonText(payload.reason));}
 if(payload.scale){const labels={SYSTEM_VIEW:'System',PLANET_ORBIT:'Orbit',PLANET_APPROACH:'Approach',SURFACE_LOCAL:'Close'};text('scale-current',labels[payload.scale]||payload.scale);for(const b of document.querySelectorAll('[data-render-target]')){const name=b.dataset.scaleName||b.textContent.trim();const active=name===(payload.scale==='SURFACE_LOCAL'?'Surface':labels[payload.scale]||'');b.setAttribute('aria-pressed',active?'true':'false')}}
 if(payload.distance!==null&&Number.isFinite(payload.distance))text('scale-distance',payload.distance.toFixed(3)+' R');
 const archiveText=q('archive-output')?.textContent||'';if(archiveText!==state.lastArchiveOutput){state.lastArchiveOutput=archiveText;if(archiveText.includes('IMPORTED_AND_REPLAYED'))announce('Archive imported and replayed successfully');else if(archiveText.startsWith('Import not applied:'))announce(archiveText)}
 if(fullId&&fullId!==state.lastSelectedId){state.lastSelectedId=fullId;announce('Selected '+viewportLabel)}
}
function validateQuery(event){const button=event.target.closest?.('#query');if(!button)return;const inputs=[...document.querySelectorAll('#query-fields input')];for(const input of inputs){if(!/^-?\d+$/.test(input.value.trim())){event.preventDefault();event.stopImmediatePropagation();text('entity-output','Input error: '+(input.previousSibling?.textContent||input.id)+' must be an integer.');announce('Query input error');input.focus();return}}const type=q('entity-type')?.value,A=O.p3Astronomy,S=O.inspectorTest?.state;if(!type||!A||!S?.ctx)return;try{const key=Object.fromEntries(inputs.map(input=>[input.id.slice(2),BigInt(input.value.trim())])),result=A['resolve'+type]?.(S.ctx,key);if(result&&result.status!=='PRESENT'){event.preventDefault();event.stopImmediatePropagation();text('entity-id','not present');text('entity-digest','not applicable');text('entity-output',`ABSENT — no canonical ${type.toLowerCase()} exists at this sparse address.`);announce(type+' absent at this canonical address')}}catch{} }
function validateArchive(event){const button=event.target.closest?.('#archive-import');if(!button)return;const raw=q('archive')?.value.trim()||'';if(!/^(?:[0-9a-fA-F]{2})*$/.test(raw)){event.preventDefault();event.stopImmediatePropagation();text('archive-output','Import not applied: archive must be even-length hexadecimal.');announce('Archive import rejected: invalid hexadecimal');q('archive')?.focus();return}try{const bytes=new Uint8Array(raw.length/2);for(let i=0;i<bytes.length;i++)bytes[i]=parseInt(raw.slice(i*2,i*2+2),16);O.p4?.importArchive(bytes)}catch(e){event.preventDefault();event.stopImmediatePropagation();text('archive-output','Import not applied: '+String(e?.message||e));announce('Archive import rejected by deterministic validation');q('archive')?.focus()}}
function init(){
 document.documentElement.dataset.reducedMotion=state.reducedMotion?'reduce':'full';workspace('explore',{announceChange:false});
 document.addEventListener('click',e=>{const open=e.target.closest?.('[data-open-workspace]');if(open){workspace(open.dataset.openWorkspace,{focus:true});return}const tab=e.target.closest?.('button[data-workspace]');if(tab){workspace(tab.dataset.workspace,{focus:false});return}},false);
 document.addEventListener('click',validateQuery,true);document.addEventListener('click',validateArchive,true);
 document.addEventListener('keydown',e=>{const tab=e.target.closest?.('button[data-workspace]');if(tab&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();const tabs=[...document.querySelectorAll('button[data-workspace]')],i=tabs.indexOf(tab),next=tabs[(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];workspace(next.dataset.workspace,{focus:false});next.focus()}else if(e.key==='Escape'&&state.workspace!=='explore'){workspace('explore',{focus:false});q('workspace-explore-tab')?.focus()}});
 const mq=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;mq?.addEventListener?.('change',e=>{state.reducedMotion=e.matches;document.documentElement.dataset.reducedMotion=e.matches?'reduce':'full';announce(e.matches?'Reduced motion enabled':'Standard motion enabled')});
 for(const el of document.querySelectorAll('pre,textarea,.mono-value'))el.setAttribute('data-copy-safe','true');
 setInterval(sync,250);sync();
 root.__OFU_PRODUCT_UI__=state;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
O.productUI={state,workspace,announce,sync,reasonText,keyLabel};
})(typeof globalThis!=='undefined'?globalThis:this);

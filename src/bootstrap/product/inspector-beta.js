(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
if(typeof document==='undefined')return;
const PLANET_FIELDS=Object.freeze(['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ','orbitSlot']);
const q=id=>document.getElementById(id),state={seamVersion:2,lastStamp:'',syncs:0,modeledKey:null,modeledResult:null,modeledStatus:'pending',modeledInvocations:0};
const set=(id,value)=>{const n=q(id);if(n&&n.textContent!==value)n.textContent=value};
const samePlanet=(a,b)=>!!a&&!!b&&PLANET_FIELDS.every(k=>BigInt(a[k])===BigInt(b[k]));
const canonicalId=I=>I?.r?.id&&O.p2?.hex?O.p2.hex(I.r.id):null;
function factNode(label,value){const wrap=document.createElement('div');wrap.className='fact';const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');dd.textContent=String(value);wrap.append(dt,dd);return wrap}
function setFacts(id,rows){const node=q(id);if(!node)return;const stamp=JSON.stringify(rows);if(node.dataset.modeledStamp===stamp)return;node.dataset.modeledStamp=stamp;node.textContent='';for(const row of rows)node.append(factNode(row[0],row[1]))}
function copyFor(){
 const I=O.inspectorTest?.state?.current,P=root.__OFU_PLANET_PREVIEW__;
 if(!I)return null;
 if(I.type!=='Planet')return{overview:'This resolved '+String(I.type||'object').toLowerCase()+' is part of the generated universe. Scientific sections below appear only when they apply to this kind of object.',physical:'Planet-specific physical evaluation does not apply to this object.',environment:'Environment is not evaluated for this object type.',biology:'Biology is not evaluated for this object type.'};
 const matched=samePlanet(P?.chosen?.key,I.key);
 if(!matched)return{overview:'The selected world is changing. Scientific details are held back until every view points to the same world.',physical:'Waiting for the selected world to finish synchronizing.',environment:'Waiting for the selected world to finish synchronizing.',biology:'Waiting for the selected world to finish synchronizing.'};
 if(P?.targetStatus==='UNSUPPORTED')return{overview:'This world exists, but part of its physical state falls outside the range the current scientific model can evaluate.',physical:'The world is real in the generated system; this physical evaluation stops at the current model boundary.',environment:'No environment conclusion is shown because the required physical evaluation is not supported for this world.',biology:'No biology conclusion is shown because the required environment evaluation is unavailable.'};
 if(P?.targetStatus!=='SUPPORTED')return{overview:'This world is selected. Scientific details will appear when its supported state is ready.',physical:'Physical state is still being evaluated.',environment:'Environment state is still being evaluated.',biology:'Biology state is still being evaluated.'};
 const p6=P?.eligibility?.state;
 const biology=p6==='INSUFFICIENT_ENVIRONMENT'?'We cannot assess a biosphere because key environmental conditions are still unknown or unsupported.':p6==='UNSUPPORTED_ENVIRONMENT'?'This environment lies outside what the current biology model can interpret.':p6==='NO_BIOSPHERE'?'The available supported inputs do not establish a biosphere in the current model.':p6==='BIOSPHERE_SUPPORTED'?'The current model establishes the supported preconditions for a biosphere.':'Biology remains unevaluated for this world.';
 return{overview:'This world has a supported physical realization. The sections below separate what is established from what remains unknown.',physical:'A bounded physical state is derived from the world’s baseline mass and other supported inputs.',environment:'Some stellar forcing is established, but atmosphere, pressure, climate and related surface conditions remain unknown unless the model explicitly resolves them.',biology};
}
function formatModeledField(field){
 const name=String(field?.name||'Modeled value'),unit=String(field?.unit||''),value=field?.value;
 if(unit==='mK'&&Number.isFinite(Number(value)))return[name,(Number(value)/1000).toFixed(1)+' K'];
 if(unit==='ppm'&&Number.isFinite(Number(value)))return[name,Math.round(Number(value)).toLocaleString('en-US')+' ppm'];
 return[name,String(value??'not available')+(unit?' '+unit:'')];
}
function modeledKey(I){
 const id=canonicalId(I);if(!id)return null;
 let history='';try{history=String(O.pxProduct?.captured?.().selection?.time?.historyDigest||'')}catch{}
 return id+'|'+history;
}
function modeledFor(I,P){
 if(!I)return{status:'pending',copy:'Waiting for a resolved selection.',facts:[]};
 if(I.type!=='Planet')return{status:'not applicable',copy:'Modeled world context is available for selected planets only.',facts:[]};
 if(!samePlanet(P?.chosen?.key,I.key))return{status:'synchronizing',copy:'Modeled scenario is withheld until the canonical selection, renderer and Inspector point to the same world.',facts:[]};
 const product=O.pxProduct,snapshot=product?.snapshot?.();if(!product?.inspect||snapshot?.registry?.bindingsSealed!==true)return{status:'pending',copy:'The modeled-world provider is still initializing.',facts:[]};
 const key=modeledKey(I);if(!key)return{status:'unavailable',copy:'The modeled scenario cannot be tied safely to this selection.',facts:[]};
 if(state.modeledKey!==key){
  state.modeledKey=key;state.modeledResult=null;
  try{const result=product.inspect('v1.inspector.world'),id=canonicalId(I);if(result?.authority?.class!=='MODEL_DERIVED_SIMULATION')throw new Error('modeled inspector authority mismatch');if(result?.selection?.target?.entityId!==id)throw new Error('modeled inspector stale selection');if(result?.value?.canonicalPromotion!==false)throw new Error('modeled inspector canonical promotion guard');state.modeledResult=result;state.modeledStatus='ready';state.modeledInvocations++}catch(error){state.modeledStatus='unavailable';state.modeledResult={error:String(error?.message||error)};state.modeledInvocations++}
 }
 if(state.modeledStatus!=='ready'||!state.modeledResult?.value)return{status:'unavailable',copy:'The bounded modeled scenario is unavailable for this selection. Canonical science above remains unaffected.',facts:[]};
 const value=state.modeledResult.value,rows=[['Authority','MODEL_DERIVED_SIMULATION'],...(value.fields||[]).slice(0,8).map(formatModeledField)];
 return{status:'model-derived',copy:String(value.summary||'A bounded modeled scenario is available for this world.')+' This scenario remains separate from canonical P5/P6 conclusions.',facts:rows};
}
function renderModeled(){const I=O.inspectorTest?.state?.current,P=root.__OFU_PLANET_PREVIEW__,model=modeledFor(I,P);set('inspector-modeled-state',model.status);set('inspector-modeled-copy',model.copy);setFacts('inspector-modeled-facts',model.facts)}
function sync(){
 const copy=copyFor();if(copy){const stamp=JSON.stringify(copy),matches=q('inspector-overview-copy')?.textContent===copy.overview&&q('inspector-physical-copy')?.textContent===copy.physical&&q('inspector-environment-copy')?.textContent===copy.environment&&q('inspector-biology-copy')?.textContent===copy.biology;if(stamp!==state.lastStamp||!matches){state.lastStamp=stamp;state.syncs++;set('inspector-overview-copy',copy.overview);set('inspector-physical-copy',copy.physical);set('inspector-environment-copy',copy.environment);set('inspector-biology-copy',copy.biology)}}
 renderModeled();
}
function init(){const observer=new MutationObserver(()=>queueMicrotask(sync));observer.observe(document.body,{subtree:true,childList:true,characterData:true});setInterval(sync,250);sync()}
const api=Object.freeze({seamVersion:2,state,sync,modeledFor});O.v09InspectorLanguage=api;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof globalThis!=='undefined'?globalThis:this);

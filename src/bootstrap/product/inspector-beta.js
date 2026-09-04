(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
if(typeof document==='undefined')return;
const q=id=>document.getElementById(id),state={seamVersion:1,lastStamp:'',syncs:0};
const set=(id,value)=>{const n=q(id);if(n&&n.textContent!==value)n.textContent=value};
function copyFor(){
 const I=O.inspectorTest?.state?.current,P=root.__OFU_PLANET_PREVIEW__;
 if(!I)return null;
 if(I.type!=='Planet')return{overview:'This resolved '+String(I.type||'object').toLowerCase()+' is part of the generated universe. Scientific sections below appear only when they apply to this kind of object.',physical:'Planet-specific physical evaluation does not apply to this object.',environment:'Environment is not evaluated for this object type.',biology:'Biology is not evaluated for this object type.'};
 const matched=P?.chosen?.key&&I.key&&['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ','orbitSlot'].every(k=>BigInt(P.chosen.key[k])===BigInt(I.key[k]));
 if(!matched)return{overview:'The selected world is changing. Scientific details are held back until every view points to the same world.',physical:'Waiting for the selected world to finish synchronizing.',environment:'Waiting for the selected world to finish synchronizing.',biology:'Waiting for the selected world to finish synchronizing.'};
 if(P?.targetStatus==='UNSUPPORTED')return{overview:'This world exists, but part of its physical state falls outside the range the current scientific model can evaluate.',physical:'The world is real in the generated system; this physical evaluation stops at the current model boundary.',environment:'No environment conclusion is shown because the required physical evaluation is not supported for this world.',biology:'No biology conclusion is shown because the required environment evaluation is unavailable.'};
 if(P?.targetStatus!=='SUPPORTED')return{overview:'This world is selected. Scientific details will appear when its supported state is ready.',physical:'Physical state is still being evaluated.',environment:'Environment state is still being evaluated.',biology:'Biology state is still being evaluated.'};
 const p6=P?.eligibility?.state;
 const biology=p6==='INSUFFICIENT_ENVIRONMENT'?'We cannot assess a biosphere because key environmental conditions are still unknown or unsupported.':p6==='UNSUPPORTED_ENVIRONMENT'?'This environment lies outside what the current biology model can interpret.':p6==='NO_BIOSPHERE'?'The available supported inputs do not establish a biosphere in the current model.':p6==='BIOSPHERE_SUPPORTED'?'The current model establishes the supported preconditions for a biosphere.':'Biology remains unevaluated for this world.';
 return{overview:'This world has a supported physical realization. The sections below separate what is established from what remains unknown.',physical:'A bounded physical state is derived from the world’s baseline mass and other supported inputs.',environment:'Some stellar forcing is established, but atmosphere, pressure, climate and related surface conditions remain unknown unless the model explicitly resolves them.',biology};
}
function sync(){const copy=copyFor();if(!copy)return;const stamp=JSON.stringify(copy);if(stamp===state.lastStamp)return;state.lastStamp=stamp;state.syncs++;set('inspector-overview-copy',copy.overview);set('inspector-physical-copy',copy.physical);set('inspector-environment-copy',copy.environment);set('inspector-biology-copy',copy.biology)}
function init(){setInterval(sync,200);sync()}
const api=Object.freeze({seamVersion:1,state,sync});O.v09InspectorLanguage=api;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof globalThis!=='undefined'?globalThis:this);

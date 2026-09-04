(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const C=O.v09ExplorerCore;
const state={seamVersion:1,consumer:null,lastSnapshot:null,lastError:null};
function current(){
 const nav=O.v08ExploreNavigation,P=root.__OFU_PLANET_PREVIEW__;
 const targets=nav?.state?.targets||[],selected=targets[nav?.state?.selectedIndex]||null;
 const system=nav?.state?.system||null,star=nav?.state?.star||null;
 if(!C||!selected?.key)return Object.freeze({version:1,ready:false,system:null,star:null,bodies:Object.freeze([]),selection:null,stage:nav?.state?.stage||null});
 const systemToken=C.serializeSystemKey(selected.key),bodies=targets.map(target=>Object.freeze({token:C.serializePlanetKey(target.key),orbitIndex:Number(target.index),label:'World '+String(Number(target.index)+1),presentationStatus:C.samePlanetKey(target.key,P?.chosen?.key)?(P?.targetStatus||'UNKNOWN'):'NOT_SELECTED'}));
 return Object.freeze({version:1,ready:true,system:Object.freeze({token:systemToken,planetCount:bodies.length,stellarComponentCount:Number(system?.facts?.stellarComponentCount||0n)}),star:star?Object.freeze({componentIndex:0,evolutionaryClass:String(star.facts?.baselineEvolutionaryClass||'UNKNOWN')}):null,bodies:Object.freeze(bodies),selection:Object.freeze({token:C.serializePlanetKey(selected.key),orbitIndex:Number(selected.index)}),stage:nav?.state?.stage||null});
}
function register(consumer){if(consumer!==null&&typeof consumer?.update!=='function')throw new TypeError('scene consumer must expose update(snapshot)');state.consumer=consumer;state.lastError=null;return snapshot()}
function snapshot(){const next=current();state.lastSnapshot=next;return next}
function publish(){const next=snapshot();if(!state.consumer)return next;try{state.consumer.update(next)}catch(error){state.lastError=String(error?.message||error)}return next}
const api=Object.freeze({seamVersion:1,state,register,snapshot,publish});
O.v09ExplorerScene=api;
if(typeof document!=='undefined')root.setInterval?.(publish,300);
})(typeof globalThis!=='undefined'?globalThis:this);

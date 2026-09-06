(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.pxContracts;if(!C)throw new Error('PX contracts required before v1 models');
const VERSION='ofu-v1-model-common-1';
const AUTHORITY='MODEL_DERIVED_SIMULATION';
const MAX=Object.freeze({text:256,list:256,populations:96,settlements:48,events:512,microNodes:512});
function assert(x,m){if(!x)throw new Error('OFU v1 model: '+m)}
function text(v,n='text',max=MAX.text){assert(typeof v==='string'&&v.length>0&&v.length<=max,n);return v}
function int(v,n='integer',lo=Number.MIN_SAFE_INTEGER,hi=Number.MAX_SAFE_INTEGER){assert(Number.isSafeInteger(v)&&v>=lo&&v<=hi,n);return v}
function ppm(v,n='ppm'){return int(v,n,0,1000000)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function digest(namespace,...parts){return C.digest({namespace,parts:C.data(parts,{bytes:131072,nodes:4096})})}
function u32(namespace,...parts){return parseInt(digest(namespace,...parts).slice(0,8),16)>>>0}
function unitPpm(namespace,...parts){return u32(namespace,...parts)%1000001}
function signedPpm(namespace,...parts){return (u32(namespace,...parts)%2000001)-1000000}
function deriveId(kind,parentId,...parts){text(kind,'kind',96);text(parentId,'parentId',128);return digest('OFU-V1-ID',kind,parentId,...parts)}
function partition(total,weights){int(total,'partition total',0,Number.MAX_SAFE_INTEGER);assert(Array.isArray(weights)&&weights.length>0&&weights.length<=MAX.list,'weights');const safe=weights.map((w,i)=>int(w,'weight '+i,0,1000000000)),sum=safe.reduce((a,b)=>a+b,0);assert(sum>0,'positive weights');const base=safe.map(w=>Math.floor(total*w/sum)),raw=safe.map(w=>total*w/sum),remaining=total-base.reduce((a,b)=>a+b,0),order=raw.map((v,i)=>({i,r:v-base[i]})).sort((a,b)=>b.r-a.r||a.i-b.i);for(let i=0;i<remaining;i++)base[order[i%order.length].i]++;return Object.freeze(base)}
function authority(model,version,sources,validity,limitations=[]){return Object.freeze({class:AUTHORITY,contract:C.VERSION,model:text(model,'model',128),version:text(version,'version',48),sources:Object.freeze([...sources]),assumptions:Object.freeze([validity]),limitations:Object.freeze([...limitations]),evidence:Object.freeze([])});}
function provenance(model,version,sourceBranches){return Object.freeze({authority:AUTHORITY,model,version,sourceBranches:Object.freeze([...sourceBranches]),generatedBy:'deterministic sparse model',canonicalPromotion:false});}
function freezeDeep(value){if(value&&typeof value==='object'){for(const v of Object.values(value))freezeDeep(v);Object.freeze(value)}return value}
function boundedArray(value,max,name='array'){assert(Array.isArray(value)&&value.length<=max,name+' bound');return value}
O.v1Common=Object.freeze({VERSION,AUTHORITY,MAX,assert,text,int,ppm,clamp,digest,u32,unitPpm,signedPpm,deriveId,partition,authority,provenance,freezeDeep,boundedArray});
})(globalThis);

(function(root){
'use strict';
const O=root.OFU=root.OFU||{},B=O.v2x11GameplayContracts;
if(!B)throw new Error('V2X-11 P2 resource normalizer requires gameplay contracts');
const VERSION='ofu-v2x-11-p2-resource-normalizer-1';
function fail(message){throw new Error('OFU V2X-11 P2 resource normalizer: '+message)}
function boundedInteger(value,label,min=0,max=Number.MAX_SAFE_INTEGER){
  if(typeof value==='bigint'){
    const lo=BigInt(min),hi=BigInt(max);
    if(value<lo||value>hi||value<BigInt(Number.MIN_SAFE_INTEGER)||value>BigInt(Number.MAX_SAFE_INTEGER))fail(label+' out of range');
    return Number(value);
  }
  if(!Number.isSafeInteger(value)||value<min||value>max)fail(label+' out of range');
  return value;
}
function resourceVector(input=[]){
  if(!Array.isArray(input)||input.length>B.LIMITS.resources)fail('resource vector invalid');
  const out=input.map((x,i)=>{
    B.exact(x,['resourceId','units'],[],'resource '+i);
    return {resourceId:B.text(x.resourceId,'resourceId',96),units:boundedInteger(x.units,'resource units',0,B.LIMITS.resourceUnits)};
  }).sort((a,b)=>a.resourceId.localeCompare(b.resourceId));
  for(let i=1;i<out.length;i++)if(out[i-1].resourceId===out[i].resourceId)fail('duplicate resource '+out[i].resourceId);
  return Object.freeze(out.map(Object.freeze));
}
O.v2x11GameplayContracts=Object.freeze({...B,integer:boundedInteger,resourceVector,p2ResourceNormalizerVersion:VERSION});
})(typeof globalThis!=='undefined'?globalThis:this);

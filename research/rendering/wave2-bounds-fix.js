(function(root){
'use strict';
const O=root.OFU=root.OFU||{},R=O.renderWave2;
if(!R)throw new Error('Wave 2 renderer must load before bounds hardening');
function boundedPatchPlan({face='PZ',level=4,x=0,y=0,maxPatches=24}){
 if(!Number.isInteger(maxPatches)||maxPatches<1)throw new Error('invalid patch plan bound');
 const axis=1<<level,cx=Math.max(0,Math.min(axis-1,x)),cy=Math.max(0,Math.min(axis-1,y)),out=[];
 for(let r=0;r<axis;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
  if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
  const px=cx+dx,py=cy+dy;
  if(px<0||py<0||px>=axis||py>=axis)continue;
  out.push(Object.freeze({face,level:BigInt(level),x:BigInt(px),y:BigInt(py)}));
  if(out.length===maxPatches)return Object.freeze(out);
 }
 return Object.freeze(out);
}
O.renderWave2=Object.freeze({...R,boundedPatchPlan});
})(typeof globalThis!=='undefined'?globalThis:this);

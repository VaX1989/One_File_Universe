(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x-03-region-refinement-1',AUTHORITY='PRESENTATION_ONLY',MAX_CHILDREN=96;
const freeze=v=>{if(!v||typeof v!=='object'||Object.isFrozen(v))return v;for(const k of Object.keys(v))freeze(v[k]);return Object.freeze(v)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)));
function hash32(input){let h=2166136261>>>0;for(const c of String(input)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function stableId(entity,index){for(const k of ['canonicalId','entityId','id'])if(typeof entity?.[k]==='string'&&entity[k])return entity[k];if(entity?.canonicalKey)return JSON.stringify(entity.canonicalKey,Object.keys(entity.canonicalKey).sort());return'entity-'+index}
function refine({parentId,children=[],parentExtent=1,focus=0,quality='STANDARD'}={}){
 if(typeof parentId!=='string'||!parentId)throw new TypeError('parentId required');if(!Array.isArray(children))throw new TypeError('children array required');const cap={LOW:24,MOBILE:36,STANDARD:64,HIGH:96}[String(quality).toUpperCase()]||64,sorted=children.map((entity,index)=>({entity,id:stableId(entity,index)})).sort((a,b)=>a.id.localeCompare(b.id)).slice(0,Math.min(cap,MAX_CHILDREN)),out=[];
 for(let i=0;i<sorted.length;i++){const {entity,id}=sorted[i],seed=hash32(parentId+'|'+id),angle=((seed%100000)/100000)*Math.PI*2,radial=.12+.78*Math.sqrt(((seed>>>8)%65536)/65535),depth=((((seed>>>16)&65535)/65535)-.5)*.9,weight=clamp(1-Math.abs(depth)*.65,0,1);out.push(freeze({objectId:'region-child:'+id,sourceId:id,canonicalId:typeof entity.canonicalId==='string'?entity.canonicalId:null,entityId:typeof entity.entityId==='string'?entity.entityId:null,canonicalKey:entity.canonicalKey?freeze({...entity.canonicalKey}):null,sourceAuthority:entity.sourceAuthority||null,authority:AUTHORITY,position:freeze({x:Math.cos(angle)*radial*parentExtent,y:Math.sin(angle)*radial*parentExtent,z:depth*parentExtent}),focusWeight:weight,selectable:true,navigable:true,claims:freeze({positionIsPhysical:false,identityPreserved:true,parentBoundaryCanonical:false})}))}
 return freeze({version:VERSION,status:'READY',authority:AUTHORITY,parentId,focus:Number(focus)||0,objects:Object.freeze(out),bounds:freeze({materialized:out.length,maxMaterialized:MAX_CHILDREN,bounded:true}),continuity:freeze({parentIdentityPreserved:true,childIdentityPreserved:true,revisitStable:true,hardReplacementRequired:false})});
}
function blend(from,to,t){if(!from||!to)throw new TypeError('from/to refinement required');const f=clamp(t,0,1);return freeze({version:VERSION,authority:AUTHORITY,fromParent:from.parentId,toParent:to.parentId,mix:f,opacityFrom:1-f,opacityTo:f,depthBias:(f-.5)*.04,claims:freeze({physicalMotion:false,canonicalInterpolation:false})})}
O.v2x03RegionRefinement=Object.freeze({VERSION,AUTHORITY,MAX_CHILDREN,refine,blend});
})(typeof globalThis!=='undefined'?globalThis:this);

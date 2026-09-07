(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x-03-neighborhood-depth-2',AUTHORITY='PRESENTATION_ONLY',MAX_OBJECTS=64;
const freeze=v=>{if(!v||typeof v!=='object'||Object.isFrozen(v))return v;for(const k of Object.keys(v))freeze(v[k]);return Object.freeze(v)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)));
function stableId(e){for(const k of ['canonicalId','entityId','id'])if(typeof e?.[k]==='string'&&e[k])return e[k];if(e?.canonicalKey&&typeof e.canonicalKey==='object')return JSON.stringify(e.canonicalKey,Object.keys(e.canonicalKey).sort());throw new TypeError('stable upstream identity required')}
function qualityCap(quality){return({LOW:20,MOBILE:28,STANDARD:48,HIGH:64}[String(quality).toUpperCase()]||48)}
function ordered(objects){const seen=new Set(),stable=[];for(const source of objects){const id=stableId(source);if(seen.has(id))throw new Error('duplicate upstream identity '+id);seen.add(id);stable.push({id,source})}stable.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);return stable}
function project({objects=[],cameraFrame,scaleUnits=36,quality='STANDARD'}={}){
 const S=O.v1x02SpatialUniverse;if(!S)throw new Error('V1X-02 spatial universe provider required');if(!cameraFrame)throw new TypeError('external camera frame required');if(!Array.isArray(objects))throw new TypeError('objects array required');const cap=Math.min(qualityCap(quality),MAX_OBJECTS),materialized=[];
 for(const {source,id} of ordered(objects).slice(0,cap)){
  const point=source.position||source.presentationPosition||source.sourcePosition;if(!point)continue;const view=S.projectPoint(point,cameraFrame),depth=view.depth,depthNorm=clamp(depth/Math.max(1,Number(scaleUnits)),0,4),apparentScale=view.visible?clamp(1/Math.max(.35,depthNorm),.28,2.2):0,fog=view.visible?clamp((depthNorm-.65)/2.2,0,.78):1;
  materialized.push(freeze({objectId:'neighborhood:'+id,sourceId:id,canonicalId:source.canonicalId||null,entityId:source.entityId||null,canonicalKey:source.canonicalKey?freeze({...source.canonicalKey}):null,sourceAuthority:source.sourceAuthority||null,authority:AUTHORITY,view,visual:freeze({apparentScale,fog,parallaxEligible:view.visible&&depth>0}),selectable:true,navigable:true,claims:freeze({fogPhysical:false,brightnessPhysical:false,positionPhysical:false,identityPreserved:true})}));
 }
 return freeze({version:VERSION,status:'READY',authority:AUTHORITY,objects:Object.freeze(materialized),bounds:freeze({requested:objects.length,materialized:materialized.length,maxMaterialized:MAX_OBJECTS,qualityCap:cap,bounded:true}),stability:freeze({identityKeyed:true,queryOrderIndependent:true,revisitStable:true}),camera:freeze({consumedExternalFrame:true,ownsFrame:false})});
}
function finite(value,label){const n=Number(value);if(!Number.isFinite(n))throw new TypeError(label+' must be finite');return n}
function pick(projected,x,y,{radius=0.055}={}){const px=finite(x,'pick x'),py=finite(y,'pick y'),r=finite(radius,'pick radius');if(!(r>0))throw new RangeError('pick radius must be positive');let best=null,bestD=Infinity;for(const o of projected?.objects||[]){if(!o.view?.visible)continue;const d=Math.hypot(Number(o.view.x)-px,Number(o.view.y)-py),better=d<bestD-1e-15||(Math.abs(d-bestD)<=1e-15&&best&&String(o.sourceId)<String(best.sourceId));if(d<=r&&better){best=o;bestD=d}}return best?freeze({handled:true,objectId:best.objectId,sourceId:best.sourceId,canonicalId:best.canonicalId,entityId:best.entityId,canonicalKey:best.canonicalKey,distance:bestD,decorative:false}):freeze({handled:false,decorative:false})}
O.v2x03NeighborhoodDepth=Object.freeze({VERSION,AUTHORITY,MAX_OBJECTS,qualityCap,project,pick});
})(typeof globalThis!=='undefined'?globalThis:this);

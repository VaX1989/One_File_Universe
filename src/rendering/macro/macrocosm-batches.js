(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x-03-macrocosm-batches-1',AUTHORITY='PRESENTATION_ONLY';
const freeze=v=>{if(!v||typeof v!=='object'||Object.isFrozen(v))return v;if(ArrayBuffer.isView(v))return v;for(const k of Object.keys(v))freeze(v[k]);return Object.freeze(v)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)));
function qualityFor({width=1280,height=720,dpr=1,memoryClass='NORMAL',coarse=false}={}){
 const w=Math.max(1,Number(width)||1),h=Math.max(1,Number(height)||1),p=Math.max(1,Number(dpr)||1),mem=String(memoryClass||'NORMAL').toUpperCase(),compact=Math.min(w,h)<540||w/h>2.4||h/w>2.4;
 if(mem==='LOW'||p>=3||compact&&coarse)return freeze({name:'LOW',reason:mem==='LOW'?'LOW_MEMORY':p>=3?'HIGH_DPR':'COMPACT_COARSE'});
 if(coarse||w<760)return freeze({name:'MOBILE',reason:'MOBILE_OR_COARSE'});
 if(mem==='HIGH'&&p<=2&&w*h>=1600000)return freeze({name:'HIGH',reason:'HIGH_MEMORY_LARGE_VIEWPORT'});
 return freeze({name:'STANDARD',reason:'STANDARD'});
}
function packFloat6(items,role){
 const out=new Float32Array(items.length*6);let k=0;
 for(const item of items){const p=item.position||{};out[k++]=Number(p.x)||0;out[k++]=Number(p.y)||0;out[k++]=Number(p.z)||0;out[k++]=Number(item.size??item.radius??1)||1;out[k++]=Number(item.brightness??item.opacity??item.weight??1)||1;out[k++]=Number(item.density??0)||0}
 const batch={role,primitive:'POINT_SPRITES_OR_INSTANCED_QUADS',instances:items.length,strideFloats:6,bytes:out.byteLength,authority:AUTHORITY,claims:freeze({gpuLayoutCanonical:false,internalBufferExposed:false})};
 Object.defineProperty(batch,'data',{enumerable:true,get(){return out.slice()}});
 return freeze(batch);
}
function planGalaxy(field,{width=1280,height=720,dpr=1,memoryClass='NORMAL',coarse=false}={}){
 if(!field||!Array.isArray(field.particles)||!Array.isArray(field.clusters)||!Array.isArray(field.dust))throw new TypeError('galaxy field required');const requested=qualityFor({width,height,dpr,memoryClass,coarse}),caps={LOW:{stars:192,clusters:8,dust:48},MOBILE:{stars:320,clusters:12,dust:72},STANDARD:{stars:640,clusters:18,dust:128},HIGH:{stars:1024,clusters:24,dust:192}}[requested.name],stars=field.particles.slice(0,caps.stars),clusters=field.clusters.slice(0,caps.clusters),dust=field.dust.slice(0,caps.dust),batches=[];
 if(stars.length)batches.push(packFloat6(stars,'STELLAR_DENSITY'));if(clusters.length)batches.push(packFloat6(clusters,'CLUSTER_CUES'));if(dust.length)batches.push(packFloat6(dust,'DUST_CUES'));
 const bytes=batches.reduce((n,b)=>n+b.bytes,0),draws=batches.length,instances=batches.reduce((n,b)=>n+b.instances,0);
 return freeze({version:VERSION,status:'READY',authority:AUTHORITY,quality:requested,batches:Object.freeze(batches),usage:freeze({bytes,draws,instances}),bounds:freeze({maxDraws:3,maxInstances:caps.stars+caps.clusters+caps.dust,maxBytes:(caps.stars+caps.clusters+caps.dust)*24}),claims:freeze({driverMemoryMeasured:false,gpuMemoryMeasured:false,modeledUploadBytes:true,canonicalTruthChanged:false})});
}
function depthCue(depth,{near=1,far=1000}={}){const n=Math.max(.0001,Number(near)||1),f=Math.max(n+.0001,Number(far)||1000),d=Math.max(n,Number(depth)||n),t=clamp((Math.log(d)-Math.log(n))/(Math.log(f)-Math.log(n)),0,1);return freeze({sizeScale:clamp(1.45-1.05*t,.4,1.45),opacity:clamp(1-.72*t,.18,1),fog:t*t*.72,authority:AUTHORITY,claims:freeze({physicalExtinction:false,photometricCalibration:false})})}
O.v2x03MacrocosmBatches=Object.freeze({VERSION,AUTHORITY,qualityFor,planGalaxy,depthCue});
})(typeof globalThis!=='undefined'?globalThis:this);

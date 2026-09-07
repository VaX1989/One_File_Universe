(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x-03-galaxy-field-1';
const AUTHORITY='PRESENTATION_ONLY';
const REPRESENTATION_VERSION='macrocosm-galaxy-field-2026-09-07.1';
const HARD_CAP=1536;
const PROFILES=Object.freeze({
  LOW:Object.freeze({particles:192,clusters:8,dust:48,arms:2}),
  MOBILE:Object.freeze({particles:320,clusters:12,dust:72,arms:2}),
  STANDARD:Object.freeze({particles:640,clusters:18,dust:128,arms:3}),
  HIGH:Object.freeze({particles:1024,clusters:24,dust:192,arms:4})
});
const freeze=v=>{if(!v||typeof v!=='object'||Object.isFrozen(v))return v;for(const k of Object.keys(v))freeze(v[k]);return Object.freeze(v)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)));
function text(v,label,max=1024){if(typeof v!=='string'||!v||v.length>max)throw new TypeError(label+' must be bounded text');return v}
function hash32(input){let h=2166136261>>>0;for(const c of String(input)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0}
function unit(seed,channel){return hash32(seed+'\0'+channel)/4294967296}
function gaussian(seed,a,b){const u=Math.max(1e-9,unit(seed,a)),v=unit(seed,b);return Math.sqrt(-2*Math.log(u))*Math.cos(Math.PI*2*v)}
function profile(name='STANDARD'){const key=String(name||'STANDARD').toUpperCase();if(!PROFILES[key])throw new RangeError('unsupported galaxy quality profile '+key);return PROFILES[key]}
function morphologyFamily(value){const m=String(value||'UNKNOWN').toUpperCase();if(/BARRED|SPIRAL|DISK|DISC/.test(m))return'DISK';if(/ELLIPTICAL|SPHEROID/.test(m))return'SPHEROID';if(/IRREGULAR|CLUMP/.test(m))return'IRREGULAR';return'GENERIC'}
function pointFor({seed,index,family,arms}){
 const u=unit(seed,'r'+index),v=unit(seed,'a'+index),w=unit(seed,'z'+index),j=unit(seed,'j'+index),radial=Math.pow(u,.56),base=v*Math.PI*2;
 if(family==='DISK'){
  const arm=index%Math.max(2,arms),theta=base*.22+arm*Math.PI*2/arms+radial*(4.2+arms*.65)+(j-.5)*.38;
  return{x:Math.cos(theta)*radial,y:Math.sin(theta)*radial,z:gaussian(seed,'z1'+index,'z2'+index)*(.035+.09*(1-radial)),density:clamp(1-radial*.72,0,1)};
 }
 if(family==='SPHEROID'){
  const z=2*w-1,ring=Math.sqrt(Math.max(0,1-z*z)),r=Math.pow(u,.42);return{x:ring*Math.cos(base)*r,y:ring*Math.sin(base)*r*.82,z:z*r*.66,density:clamp(1-r*.58,0,1)};
 }
 if(family==='IRREGULAR'){
  const cluster=index%5,phase=cluster/5*Math.PI*2,off=.18+.13*unit(seed,'c'+cluster),r=Math.pow(u,.5)*.58;
  return{x:Math.cos(base)*r+Math.cos(phase)*off,y:Math.sin(base)*r+Math.sin(phase)*off,z:(w-.5)*.55+Math.sin(phase*2)*.08,density:clamp(.45+j*.5,0,1)};
 }
 const z=2*w-1,ring=Math.sqrt(Math.max(0,1-z*z)),r=Math.pow(u,.5);return{x:ring*Math.cos(base)*r,y:ring*Math.sin(base)*r,z:z*r,density:clamp(1-r*.55,0,1)};
}
function build(input={}){
 const galaxyId=text(String(input.galaxyId||input.canonicalId||input.entityId||''),'galaxyId',2048),morphology=String(input.morphology||'UNKNOWN').toUpperCase(),family=morphologyFamily(morphology),quality=String(input.quality||'STANDARD').toUpperCase(),q=profile(quality),representationSeed=text(String(input.presentationSeed||'OFU-V2X03')+'|'+REPRESENTATION_VERSION+'|'+galaxyId,'presentationSeed',4096),requested=Math.max(0,Math.floor(Number(input.particleLimit??q.particles))),count=Math.min(HARD_CAP,q.particles,requested||q.particles),particles=[];
 for(let i=0;i<count;i++){
  const p=pointFor({seed:representationSeed,index:i,family,arms:q.arms}),brightness=.18+.82*Math.pow(unit(representationSeed,'b'+i),2.2),size=.45+1.9*Math.pow(unit(representationSeed,'s'+i),3);
  particles.push(freeze({id:'decorative-star:'+i,role:'DECORATIVE_STELLAR_DENSITY',canonical:false,selectable:false,navigable:false,authority:AUTHORITY,position:freeze({x:p.x,y:p.y,z:p.z}),brightness,size,density:p.density,claims:freeze({individualStar:false,physicalCoordinate:false,calibratedBrightness:false})}));
 }
 const clusters=[];for(let i=0;i<q.clusters;i++){const p=pointFor({seed:representationSeed+'|cluster',index:i,family,arms:q.arms});clusters.push(freeze({id:'decorative-cluster:'+i,role:'DECORATIVE_CLUSTER_CUE',canonical:false,selectable:false,navigable:false,authority:AUTHORITY,position:freeze({x:p.x,y:p.y,z:p.z}),radius:.025+.075*unit(representationSeed,'cr'+i),weight:.25+.75*p.density,claims:freeze({canonicalCluster:false,physicalRadius:false})}))}
 const dust=[];for(let i=0;i<q.dust;i++){const p=pointFor({seed:representationSeed+'|dust',index:i,family,arms:q.arms});dust.push(freeze({id:'decorative-dust:'+i,role:'DECORATIVE_DUST_CUE',canonical:false,selectable:false,navigable:false,authority:AUTHORITY,position:freeze({x:p.x,y:p.y,z:p.z*.55}),opacity:.04+.18*unit(representationSeed,'do'+i),radius:.012+.035*unit(representationSeed,'dr'+i),claims:freeze({canonicalDustCloud:false,opticalDepthMeasured:false})}))}
 return freeze({version:VERSION,representationVersion:REPRESENTATION_VERSION,status:'READY',authority:AUTHORITY,galaxyId,morphology,family,quality,particles:Object.freeze(particles),clusters:Object.freeze(clusters),dust:Object.freeze(dust),bounds:freeze({particles:particles.length,clusters:clusters.length,dust:dust.length,total:particles.length+clusters.length+dust.length,hardParticleCap:HARD_CAP}),claims:freeze({calibratedObservation:false,canonicalPopulation:false,canonicalStellarPositions:false,deterministicRevisit:true,queryOrderIndependent:true})});
}
function witness(field){if(!field||field.version!==VERSION)throw new TypeError('galaxy field required');const sample=field.particles.slice(0,24).map(p=>[p.id,p.position.x,p.position.y,p.position.z,p.brightness,p.size]);return freeze({version:VERSION,galaxyId:field.galaxyId,representationVersion:field.representationVersion,quality:field.quality,bounds:field.bounds,sample:Object.freeze(sample),authority:field.authority})}
O.v2x03GalaxyField=Object.freeze({VERSION,AUTHORITY,REPRESENTATION_VERSION,HARD_CAP,PROFILES,profile,morphologyFamily,build,witness});
})(typeof globalThis!=='undefined'?globalThis:this);

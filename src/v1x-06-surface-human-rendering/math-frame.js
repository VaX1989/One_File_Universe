(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v1x-06-surface-frame-1';
const AUTHORITY='PRESENTATION_ONLY';
const FACE_NAMES=Object.freeze(['PX','NX','PY','NY','PZ','NZ']);
const EPS=1e-12;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const length=a=>Math.hypot(a[0],a[1],a[2]);
function unit(a){const n=length(a);if(!(n>EPS))throw new RangeError('non-zero vector required');return[a[0]/n,a[1]/n,a[2]/n]}
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;for(const k of Object.keys(v))freeze(v[k]);return Object.freeze(v)}
function assertFace(face){const f=String(face||'').toUpperCase();if(!FACE_NAMES.includes(f))throw new RangeError('unsupported cube face '+face);return f}
function faceUvToUnit(face,u,v){const f=assertFace(face),a=clamp(u,-1,1),b=clamp(v,-1,1);let p;if(f==='PX')p=[1,b,-a];else if(f==='NX')p=[-1,b,a];else if(f==='PY')p=[a,1,-b];else if(f==='NY')p=[a,-1,b];else if(f==='PZ')p=[a,b,1];else p=[-a,b,-1];return freeze(unit(p))}
function unitToFaceUv(vector){const p=unit(vector),ax=Math.abs(p[0]),ay=Math.abs(p[1]),az=Math.abs(p[2]);let face,u,v;if(ax>=ay&&ax>=az){if(p[0]>=0){face='PX';u=-p[2]/ax;v=p[1]/ax}else{face='NX';u=p[2]/ax;v=p[1]/ax}}else if(ay>=ax&&ay>=az){if(p[1]>=0){face='PY';u=p[0]/ay;v=-p[2]/ay}else{face='NY';u=p[0]/ay;v=p[2]/ay}}else if(p[2]>=0){face='PZ';u=p[0]/az;v=p[1]/az}else{face='NZ';u=-p[0]/az;v=p[1]/az}return freeze({face,u:clamp(u,-1,1),v:clamp(v,-1,1)})}
function tileBounds(level,x,y){const l=Math.max(0,Math.floor(Number(level)||0)),n=2**l,ix=Math.max(0,Math.min(n-1,Math.floor(Number(x)||0))),iy=Math.max(0,Math.min(n-1,Math.floor(Number(y)||0))),span=2/n,u0=-1+ix*span,v0=-1+iy*span;return freeze({level:l,x:ix,y:iy,n,u0,v0,u1:u0+span,v1:v0+span,uc:u0+span/2,vc:v0+span/2,span})}
function tileKey(face,level,x,y){const b=tileBounds(level,x,y);return `${assertFace(face)}:${b.level}:${b.x}:${b.y}`}
function tileCenterUnit(face,level,x,y){const b=tileBounds(level,x,y);return faceUvToUnit(face,b.uc,b.vc)}
function neighborTile(face,level,x,y,edge){const b=tileBounds(level,x,y),e=String(edge||'').toUpperCase();if(!['N','S','E','W'].includes(e))throw new RangeError('edge must be N/S/E/W');let u=b.uc,v=b.vc;if(e==='N')v=b.v1+b.span*.5;else if(e==='S')v=b.v0-b.span*.5;else if(e==='E')u=b.u1+b.span*.5;else u=b.u0-b.span*.5;const q=unitToFaceUv(faceUvToUnit(face,u,v)),n=2**b.level,nx=Math.max(0,Math.min(n-1,Math.floor((q.u+1)*.5*n))),ny=Math.max(0,Math.min(n-1,Math.floor((q.v+1)*.5*n)));return freeze({face:q.face,level:b.level,x:nx,y:ny,key:tileKey(q.face,b.level,nx,ny),crossFace:q.face!==assertFace(face)})}
function tangentBasis(normal){const up=unit(normal);let east=cross([0,1,0],up);if(length(east)<1e-8)east=cross([1,0,0],up);east=unit(east);const north=unit(cross(up,east));return freeze({east,north,up})}
function localFrame({planetRadiusMeters,face,u=0,v=0,elevationMeters=0,originRevision=0,sourceAuthority='UNSPECIFIED_SOURCE_AUTHORITY'}={}){const radius=Number(planetRadiusMeters);if(!(radius>0&&Number.isFinite(radius)))throw new RangeError('planetRadiusMeters must be finite and positive');const normal=faceUvToUnit(face,u,v),basis=tangentBasis(normal),surfaceOrigin=mul(normal,radius),origin=add(surfaceOrigin,mul(normal,Number(elevationMeters)||0));function toLocal(planetPoint){const d=sub(planetPoint,origin);return freeze([dot(d,basis.east),dot(d,basis.up),dot(d,basis.north)])}function toPlanet(localPoint){const p=localPoint||[0,0,0];return freeze(add(origin,add(mul(basis.east,Number(p[0])||0),add(mul(basis.up,Number(p[1])||0),mul(basis.north,Number(p[2])||0)))))}return freeze({version:VERSION,authority:AUTHORITY,sourceAuthority,planetRadiusMeters:radius,face:assertFace(face),anchorUv:[clamp(u,-1,1),clamp(v,-1,1)],originRevision:Math.max(0,Math.floor(Number(originRevision)||0)),originPlanetMeters:origin,surfaceOriginPlanetMeters:surfaceOrigin,basis,toLocal,toPlanet,claims:{referenceFrameCanonical:false,floatingOriginChangesCanonicalPosition:false,elevationMetersCanonical:false}})}
function precisionWitness(frame,samples=[[0,0,0],[1,0,1],[1000,12,-2500],[19999,-3,15001]]){let maxError=0;const rows=[];for(const sample of samples){const p=frame.toPlanet(sample),r=frame.toLocal(p),error=Math.hypot(r[0]-sample[0],r[1]-sample[1],r[2]-sample[2]);maxError=Math.max(maxError,error);rows.push({local:sample.slice(),roundTrip:r,errorMeters:error})}return freeze({version:'ofu-v1x-06-precision-witness-1',authority:'MEASURED_RUNTIME_EVIDENCE',maxRoundTripErrorMeters:maxError,samples:rows})}
O.v1x06SurfaceFrame=Object.freeze({VERSION,AUTHORITY,FACE_NAMES,faceUvToUnit,unitToFaceUv,tileBounds,tileKey,tileCenterUnit,neighborTile,tangentBasis,localFrame,precisionWitness,math:Object.freeze({clamp,add,sub,mul,dot,cross,length,unit})});
})(globalThis);

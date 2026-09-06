(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const EPS=1e-9;
const finite=(v,label='number')=>{const n=Number(v);if(!Number.isFinite(n))throw new TypeError(label+' must be finite');return n};
const v3=(v,label='vec3')=>{if(!Array.isArray(v)||v.length!==3)throw new TypeError(label+' must be [x,y,z]');return Object.freeze(v.map((x,i)=>finite(x,label+'['+i+']')))};
const add=(a,b)=>Object.freeze([a[0]+b[0],a[1]+b[1],a[2]+b[2]]);
const sub=(a,b)=>Object.freeze([a[0]-b[0],a[1]-b[1],a[2]-b[2]]);
const mul=(a,s)=>Object.freeze([a[0]*s,a[1]*s,a[2]*s]);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>Object.freeze([a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]);
const length=a=>Math.hypot(a[0],a[1],a[2]);
function unit(a,label='vector'){const l=length(a);if(!(l>EPS))throw new RangeError(label+' must have non-zero length');return mul(a,1/l)}
function cameraBasis(camera){
  if(!camera||typeof camera!=='object')throw new TypeError('external camera frame required');
  const position=v3(camera.position,'camera.position'),target=v3(camera.target,'camera.target'),upHint=v3(camera.up||[0,1,0],'camera.up');
  const forward=unit(sub(target,position),'camera forward');
  let right=cross(forward,upHint);
  if(length(right)<=EPS)right=cross(forward,Math.abs(forward[1])<.9?[0,1,0]:[1,0,0]);
  right=unit(right,'camera right');
  const up=unit(cross(right,forward),'camera up');
  const fovY=finite(camera.fovYRadians??(Math.PI/3),'camera.fovYRadians');
  const aspect=finite(camera.aspect??(16/9),'camera.aspect');
  const near=finite(camera.near??.01,'camera.near');
  const far=finite(camera.far??1e9,'camera.far');
  if(!(fovY>0&&fovY<Math.PI&&aspect>0&&near>0&&far>near))throw new RangeError('invalid external camera projection parameters');
  return Object.freeze({position,forward,right,up,fovY,aspect,near,far});
}
function project(point,camera){
  const p=v3(point,'point'),b=cameraBasis(camera),rel=sub(p,b.position),depth=dot(rel,b.forward);
  if(depth<b.near||depth>b.far)return null;
  const halfH=Math.tan(b.fovY/2)*depth,halfW=halfH*b.aspect;
  if(!(halfH>EPS&&halfW>EPS))return null;
  return Object.freeze({xNdc:dot(rel,b.right)/halfW,yNdc:dot(rel,b.up)/halfH,depth});
}
function ndcToPixel(p,viewport){
  if(!p)return null;const width=finite(viewport?.width??1,'viewport.width'),height=finite(viewport?.height??1,'viewport.height');
  if(!(width>0&&height>0))throw new RangeError('positive viewport required');
  return Object.freeze({x:(p.xNdc*.5+.5)*width,y:(.5-p.yNdc*.5)*height,depth:p.depth,visible:Math.abs(p.xNdc)<=1&&Math.abs(p.yNdc)<=1});
}
function transform(point,translation=[0,0,0],scale=1){const p=v3(point),t=v3(translation,'translation'),s=finite(scale,'scale');return add(t,mul(p,s))}
O.v1x04SystemMath=Object.freeze({VERSION:'ofu-v1x-04-system-math-1',EPS,finite,v3,add,sub,mul,dot,cross,length,unit,cameraBasis,project,ndcToPixel,transform});
})(typeof globalThis!=='undefined'?globalThis:this);

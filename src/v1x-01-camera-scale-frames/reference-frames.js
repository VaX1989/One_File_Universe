(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v1x-camera-reference-frames-1';
const AUTHORITY='PRESENTATION_ONLY';
const EPS=1e-12;
function finiteNumber(value,label='value'){
 const n=Number(value);
 if(!Number.isFinite(n))throw new TypeError(label+' must be finite');
 return n;
}
function positive(value,label='value'){
 const n=finiteNumber(value,label);
 if(n<=0)throw new RangeError(label+' must be positive');
 return n;
}
function vec3(value,label='vector'){
 if(!Array.isArray(value)||value.length!==3)throw new TypeError(label+' must contain three values');
 return Object.freeze(value.map((v,i)=>finiteNumber(v,label+'['+i+']')));
}
function length3(v){return Math.hypot(v[0],v[1],v[2]);}
function quat(value,label='quaternion'){
 if(!Array.isArray(value)||value.length!==4)throw new TypeError(label+' must contain four values');
 const q=value.map((v,i)=>finiteNumber(v,label+'['+i+']')),m=Math.hypot(q[0],q[1],q[2],q[3]);
 if(m<=EPS)throw new RangeError(label+' must be non-zero');
 return Object.freeze(q.map(v=>v/m));
}
function qMul(a,b){
 return quat([
  a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
  a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
  a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
  a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]
 ]);
}
function qInv(q){return Object.freeze([-q[0],-q[1],-q[2],q[3]]);}
function qRotate(q,v){
 const x=v[0],y=v[1],z=v[2],qx=q[0],qy=q[1],qz=q[2],qw=q[3];
 const tx=2*(qy*z-qz*y),ty=2*(qz*x-qx*z),tz=2*(qx*y-qy*x);
 return Object.freeze([x+qw*tx+(qy*tz-qz*ty),y+qw*ty+(qz*tx-qx*tz),z+qw*tz+(qx*ty-qy*tx)]);
}
function qAxisAngle(axis,angle){
 const a=vec3(axis,'axis'),m=length3(a);if(m<=EPS)throw new RangeError('axis must be non-zero');
 const h=finiteNumber(angle,'angle')*.5,s=Math.sin(h)/m;
 return quat([a[0]*s,a[1]*s,a[2]*s,Math.cos(h)]);
}
function matrixFromRigid(translation,rotation,scale=1){
 const t=vec3(translation,'translation'),q=quat(rotation),s=positive(scale,'scale'),x=q[0],y=q[1],z=q[2],w=q[3];
 const xx=x*x,yy=y*y,zz=z*z,xy=x*y,xz=x*z,yz=y*z,wx=w*x,wy=w*y,wz=w*z;
 const m=[
  (1-2*(yy+zz))*s,2*(xy-wz)*s,2*(xz+wy)*s,t[0],
  2*(xy+wz)*s,(1-2*(xx+zz))*s,2*(yz-wx)*s,t[1],
  2*(xz-wy)*s,2*(yz+wx)*s,(1-2*(xx+yy))*s,t[2],
  0,0,0,1
 ];
 if(!m.every(Number.isFinite))throw new RangeError('matrix must remain finite');
 return Object.freeze(m);
}
function multiplyMatrix(a,b){
 if(!Array.isArray(a)||a.length!==16||!Array.isArray(b)||b.length!==16)throw new TypeError('4x4 matrices required');
 const out=new Array(16).fill(0);
 for(let r=0;r<4;r++)for(let c=0;c<4;c++)for(let k=0;k<4;k++)out[r*4+c]+=a[r*4+k]*b[k*4+c];
 if(!out.every(Number.isFinite))throw new RangeError('matrix composition overflowed');
 return Object.freeze(out);
}
function invertUniformAffine(m){
 if(!Array.isArray(m)||m.length!==16||!m.every(Number.isFinite))throw new TypeError('finite 4x4 matrix required');
 const s=Math.hypot(m[0],m[1],m[2]);if(s===0)throw new RangeError('singular frame transform');
 const ss=s*s,L=[m[0]/ss,m[4]/ss,m[8]/ss,m[1]/ss,m[5]/ss,m[9]/ss,m[2]/ss,m[6]/ss,m[10]/ss],t=[m[3],m[7],m[11]];
 const ti=[-(L[0]*t[0]+L[1]*t[1]+L[2]*t[2]),-(L[3]*t[0]+L[4]*t[1]+L[5]*t[2]),-(L[6]*t[0]+L[7]*t[1]+L[8]*t[2])];
 const out=[L[0],L[1],L[2],ti[0],L[3],L[4],L[5],ti[1],L[6],L[7],L[8],ti[2],0,0,0,1];
 if(!out.every(Number.isFinite))throw new RangeError('matrix inversion overflowed');
 return Object.freeze(out);
}
function transformPoint(matrix,point){
 const p=vec3(point,'point'),m=matrix,x=m[0]*p[0]+m[1]*p[1]+m[2]*p[2]+m[3],y=m[4]*p[0]+m[5]*p[1]+m[6]*p[2]+m[7],z=m[8]*p[0]+m[9]*p[1]+m[10]*p[2]+m[11];
 if(![x,y,z].every(Number.isFinite))throw new RangeError('point transform overflowed');
 return Object.freeze([x,y,z]);
}
function matrixFinite(matrix){return Array.isArray(matrix)&&matrix.length===16&&matrix.every(Number.isFinite);}
function sameFrameId(id){const s=String(id||'');if(!/^[A-Za-z0-9._:/-]{1,128}$/.test(s))throw new TypeError('invalid frame id');return s;}
function createReferenceFrameGraph(definitions){
 if(!Array.isArray(definitions)||definitions.length<1||definitions.length>128)throw new TypeError('bounded frame definitions required');
 const frames=new Map();
 for(const input of definitions){
  if(!input||typeof input!=='object')throw new TypeError('frame definition required');
  const id=sameFrameId(input.id);if(frames.has(id))throw new Error('duplicate reference frame: '+id);
  const parentId=input.parentId==null?null:sameFrameId(input.parentId),metersPerUnit=positive(input.metersPerUnit,'metersPerUnit'),originInParent=parentId?vec3(input.originInParent||[0,0,0],'originInParent'):Object.freeze([0,0,0]),rotationToParent=parentId?quat(input.rotationToParent||[0,0,0,1]):Object.freeze([0,0,0,1]);
  frames.set(id,Object.freeze({id,parentId,metersPerUnit,originInParent,rotationToParent}));
 }
 const roots=[...frames.values()].filter(f=>f.parentId===null);if(roots.length!==1)throw new Error('exactly one root reference frame required');
 for(const frame of frames.values())if(frame.parentId&&!frames.has(frame.parentId))throw new Error('missing parent frame '+frame.parentId);
 for(const frame of frames.values()){
  const seen=new Set();let cursor=frame;
  while(cursor){if(seen.has(cursor.id))throw new Error('reference-frame cycle at '+cursor.id);seen.add(cursor.id);cursor=cursor.parentId?frames.get(cursor.parentId):null;}
 }
 function frame(id){const value=frames.get(sameFrameId(id));if(!value)throw new Error('unknown reference frame: '+id);return value;}
 function lineage(id){const out=[];let current=frame(id);while(current){out.push(current.id);current=current.parentId?frame(current.parentId):null;}return Object.freeze(out);}
 function commonAncestor(a,b){const right=new Set(lineage(b));return lineage(a).find(id=>right.has(id));}
 function edgeMatrix(child){const f=frame(child);if(!f.parentId)return matrixFromRigid([0,0,0],[0,0,0,1],1);const p=frame(f.parentId);return matrixFromRigid(f.originInParent,f.rotationToParent,f.metersPerUnit/p.metersPerUnit);}
 function upwardMatrix(id,ancestor){
  let current=frame(id),matrix=matrixFromRigid([0,0,0],[0,0,0,1],1);
  while(current.id!==ancestor){matrix=multiplyMatrix(edgeMatrix(current.id),matrix);current=frame(current.parentId);}
  return matrix;
 }
 function upwardRotation(id,ancestor){
  let current=frame(id),rotation=quat([0,0,0,1]);
  while(current.id!==ancestor){rotation=qMul(current.rotationToParent,rotation);current=frame(current.parentId);}
  return rotation;
 }
 function relativeTransform(fromId,toId){
  fromId=frame(fromId).id;toId=frame(toId).id;
  const ancestor=commonAncestor(fromId,toId),fromToAncestor=upwardMatrix(fromId,ancestor),toToAncestor=upwardMatrix(toId,ancestor),matrix=multiplyMatrix(invertUniformAffine(toToAncestor),fromToAncestor);
  if(!matrixFinite(matrix))throw new Error('non-finite relative frame transform');
  return Object.freeze({contract:VERSION,authority:AUTHORITY,from:fromId,to:toId,commonAncestor:ancestor,matrix});
 }
 function rotationBetween(fromId,toId){
  const ancestor=commonAncestor(fromId,toId),a=upwardRotation(fromId,ancestor),b=upwardRotation(toId,ancestor);return qMul(qInv(b),a);
 }
 function rebasePose(pose,toFrameId){
  if(!pose||typeof pose!=='object')throw new TypeError('pose required');
  const from=frame(pose.frameId).id,to=frame(toFrameId).id,position=transformPoint(relativeTransform(from,to).matrix,pose.position),orientation=qMul(rotationBetween(from,to),quat(pose.orientation||[0,0,0,1]));
  return Object.freeze({frameId:to,position,orientation});
 }
 function witness(fromId,toId,point=[0,0,0]){
  const forward=relativeTransform(fromId,toId),reverse=relativeTransform(toId,fromId),p=vec3(point),target=transformPoint(forward.matrix,p),roundTrip=transformPoint(reverse.matrix,target),error=Math.hypot(roundTrip[0]-p[0],roundTrip[1]-p[1],roundTrip[2]-p[2]);
  return Object.freeze({contract:VERSION,authority:AUTHORITY,from:forward.from,to:forward.to,commonAncestor:forward.commonAncestor,finite:matrixFinite(forward.matrix)&&matrixFinite(reverse.matrix),roundTripError:error,roundTripErrorMeters:error*frame(fromId).metersPerUnit,forwardMatrix:forward.matrix,reverseMatrix:reverse.matrix});
 }
 return Object.freeze({VERSION,AUTHORITY,rootFrameId:roots[0].id,frame,lineage,relativeTransform,rotationBetween,rebasePose,witness,transformPoint,matrixFinite,snapshot:()=>Object.freeze([...frames.values()])});
}
O.v1xReferenceFrames=Object.freeze({VERSION,AUTHORITY,createReferenceFrameGraph,finiteNumber,vec3,quat,qMul,qInv,qRotate,qAxisAngle,matrixFromRigid,multiplyMatrix,invertUniformAffine,transformPoint,matrixFinite});
})(typeof globalThis!=='undefined'?globalThis:this);

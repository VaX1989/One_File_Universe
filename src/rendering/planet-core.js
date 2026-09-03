(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const P2=O.p2,A=O.p3Astronomy,P5=O.p5Planetology;
if(!P2||!A||!P5)throw new Error('OFU planet renderer requires canonical P2/P3/P5');
const AUTHORITY='PRESENTATION_ONLY';
const FACES=Object.freeze(['PX','NX','PY','NY','PZ','NZ']);
const EDGE_NAMES=Object.freeze(['W','E','S','N']);
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function keyString(k){return `${k.face}/${k.level}/${k.x}/${k.y}`}
function freezeKey(face,level,x,y){return Object.freeze({face,level:BigInt(level),x:BigInt(x),y:BigInt(y)})}
function numberLevel(v){const n=Number(v);if(!Number.isSafeInteger(n)||n<0||n>14)throw new Error('invalid presentation terrain level');return n}
function exactLocalDelta(world,origin,label='coordinate'){
 if(typeof world!=='bigint'||typeof origin!=='bigint')throw new Error(label+' must be BigInt');
 const d=world-origin;
 if(d<BigInt(Number.MIN_SAFE_INTEGER)||d>BigInt(Number.MAX_SAFE_INTEGER))throw new Error(label+' local delta exceeds safe presentation range');
 return Number(d);
}
function exactLocalVec3(world,origin){if(!Array.isArray(world)||!Array.isArray(origin)||world.length!==3||origin.length!==3)throw new Error('three-component integer frame required');return Object.freeze(world.map((v,i)=>exactLocalDelta(v,origin[i],'axis '+i)))}
function normalize(v){const m=Math.hypot(v[0],v[1],v[2]);if(!m||!Number.isFinite(m))throw new Error('invalid zero/non-finite direction');return Object.freeze([v[0]/m,v[1]/m,v[2]/m])}
function faceVector(face,u,v){
 let q;
 if(face==='PX')q=[1,v,-u];else if(face==='NX')q=[-1,v,u];else if(face==='PY')q=[u,1,-v];else if(face==='NY')q=[u,-1,v];else if(face==='PZ')q=[u,v,1];else if(face==='NZ')q=[-u,v,-1];else throw new Error('invalid cube face');
 return normalize(q);
}
function directionToFaceUv(dir){
 const [x,y,z]=normalize(dir),ax=Math.abs(x),ay=Math.abs(y),az=Math.abs(z);let face,u,v,d;
 if(ax>=ay&&ax>=az){d=ax;if(x>=0){face='PX';u=-z/d;v=y/d}else{face='NX';u=z/d;v=y/d}}
 else if(ay>=az){d=ay;if(y>=0){face='PY';u=x/d;v=-z/d}else{face='NY';u=x/d;v=z/d}}
 else{d=az;if(z>=0){face='PZ';u=x/d;v=y/d}else{face='NZ';u=-x/d;v=y/d}}
 return Object.freeze({face,u:clamp(u,-1,1),v:clamp(v,-1,1)});
}
function patchFromDirection(dir,level){
 const l=numberLevel(level),n=2**l,f=directionToFaceUv(dir),xf=(f.u+1)*0.5*n,yf=(f.v+1)*0.5*n;
 return freezeKey(f.face,l,Math.min(n-1,Math.max(0,Math.floor(xf))),Math.min(n-1,Math.max(0,Math.floor(yf))));
}
function patchCenterDirection(key){const l=numberLevel(key.level),n=2**l,x=Number(key.x),y=Number(key.y),u=-1+2*(x+0.5)/n,v=-1+2*(y+0.5)/n;return faceVector(key.face,u,v)}
function remapPatchOffset(key,dx,dy){
 const l=numberLevel(key.level),n=2**l,x=Number(key.x)+dx,y=Number(key.y)+dy,u=-1+2*(x+0.5)/n,v=-1+2*(y+0.5)/n;
 return patchFromDirection(faceVector(key.face,u,v),l);
}
function edgeNeighbors(key){return Object.freeze({W:remapPatchOffset(key,-1,0),E:remapPatchOffset(key,1,0),S:remapPatchOffset(key,0,-1),N:remapPatchOffset(key,0,1)})}
function parentKey(key){const l=numberLevel(key.level);if(l===0)return null;return freezeKey(key.face,l-1,BigInt(key.x)/2n,BigInt(key.y)/2n)}
function childrenKeys(key){return Object.freeze(P5.refinePatchKey(key).map(k=>freezeKey(k.face,k.level,k.x,k.y)))}
function angularDistance(a,b){const d=clamp(a[0]*b[0]+a[1]*b[1]+a[2]*b[2],-1,1);return Math.acos(d)}
class LRU{
 constructor(maxEntries=96){if(!Number.isInteger(maxEntries)||maxEntries<1)throw new Error('invalid LRU bound');this.maxEntries=maxEntries;this.map=new Map();this.hits=0;this.misses=0;this.evictions=0}
 get(k){if(!this.map.has(k)){this.misses++;return null}this.hits++;const v=this.map.get(k);this.map.delete(k);this.map.set(k,v);return v}
 set(k,v){const evicted=[];if(this.map.has(k))this.map.delete(k);this.map.set(k,v);while(this.map.size>this.maxEntries){const old=this.map.keys().next().value;this.map.delete(old);this.evictions++;evicted.push(old)}return evicted}
 clear(){const keys=[...this.map.keys()];this.map.clear();return keys}
 stats(){return Object.freeze({entries:this.map.size,maxEntries:this.maxEntries,hits:this.hits,misses:this.misses,evictions:this.evictions})}
}
function createP5Provider(ctx,physical,{presentationElevationScale=120}={}){
 if(!ctx||!physical||physical.status!=='SUPPORTED')throw new Error('supported canonical P5 physical planet required');
 if(!Number.isFinite(presentationElevationScale)||presentationElevationScale<0)throw new Error('invalid presentation elevation scale');
 const topology=P5.createTerrainTopology(physical);
 if(topology.version!=='p5-cube-sphere-topology-1')throw new Error('unsupported canonical P5 terrain topology');
 return Object.freeze({version:'ofu-render-p5-consumer-1',authority:'CONSUMER_ONLY',planetId:P2.hex(physical.planetId),topologyVersion:topology.version,heightSemantic:topology.heightSemantic,presentationElevationScale,physical,topology,getPatch:key=>P5.generateTerrainPatch(ctx,topology,key),refine:key=>P5.refinePatchKey(key)});
}
// Every cube-face parameterization is right-handed in (u,v), so canonical
// surface triangles must follow u then v. The former reversed order pointed
// every base triangle inward and was entirely removed by WebGL back-face
// culling on conforming implementations.
const BASE=[];for(let y=0;y<4;y++)for(let x=0;x<4;x++){const a=y*5+x,b=a+1,c=a+5,d=c+1;BASE.push(a,b,c,b,d,c)}
const EDGES=Object.freeze([[0,1,2,3,4],[4,9,14,19,24],[24,23,22,21,20],[20,15,10,5,0]].map(Object.freeze));
function primitiveNormal(p){return normalize([Number(p.x),Number(p.y),Number(p.z)])}
function buildIndexedPatchMesh(provider,key,{skirts=true,skirtFraction=0.0015}={}){
 const patch=provider.getPatch(key),radius=Number(provider.physical.physical.meanRadiusM),scale=provider.presentationElevationScale;
 if(!Number.isSafeInteger(radius))throw new Error('P5 radius outside presentation-safe range');
 const world=[],ids=[],codes=[];
 for(const v of patch.vertices){const n=primitiveNormal(v.primitive),r=radius+Number(v.elevationCode)*scale;world.push(n[0]*r,n[1]*r,n[2]*r);ids.push(P2.hex(v.address));codes.push(Number(v.elevationCode))}
 let ox=0,oy=0,oz=0;for(let i=0;i<25;i++){ox+=world[i*3];oy+=world[i*3+1];oz+=world[i*3+2]}ox/=25;oy/=25;oz/=25;
 const local=[];for(let i=0;i<world.length;i+=3)local.push(world[i]-ox,world[i+1]-oy,world[i+2]-oz);
 const indices=[...BASE];let skirtVertices=0;
 if(skirts){const drop=Math.max(1,radius*skirtFraction);for(const edge of EDGES){const skirt=[];for(const src of edge){const wx=world[src*3],wy=world[src*3+1],wz=world[src*3+2],m=Math.hypot(wx,wy,wz),s=(m-drop)/m,dst=local.length/3;local.push(wx*s-ox,wy*s-oy,wz*s-oz);ids.push(ids[src]);codes.push(codes[src]);skirt.push(dst);skirtVertices++}for(let i=0;i<edge.length-1;i++){const a=edge[i],b=edge[i+1],sa=skirt[i],sb=skirt[i+1];indices.push(a,sa,b,b,sa,sb)}}}
 const vertices=new Float32Array(local),indexArray=vertices.length/3<65536?new Uint16Array(indices):new Uint32Array(indices);
 return Object.freeze({authority:AUTHORITY,key:patch.key,keyString:keyString(patch.key),sourceTopology:patch.topologyVersion,heightSemantic:provider.heightSemantic,physicalElevationMeaning:'UNSUPPORTED',presentationElevationScale:scale,canonicalVertexCount:Number(patch.vertexCount),presentationVertexCount:vertices.length/3,presentationSkirtVertices:skirtVertices,canonicalVertexIds:Object.freeze(ids),elevationCodes:Object.freeze(codes),localOrigin:Object.freeze([ox,oy,oz]),vertices,indices:indexArray,triangles:indexArray.length/3,vertexBytes:vertices.byteLength,indexBytes:indexArray.byteLength});
}
function projectedError(radiusM,distanceM,level,viewportHeight=900,fovDeg=55){const l=numberLevel(level),angular=Math.PI/(2*(2**l)),worldError=radiusM*angular/4,pxPerRad=viewportHeight/(2*Math.tan(fovDeg*Math.PI/360));return worldError*pxPerRad/Math.max(distanceM,1)}
function chooseLevel({radiusM,distanceM,viewportHeight=900,targetPixels=28,maxLevel=10,previousLevel=null,hysteresis=0.18}){let chosen=0;for(let l=0;l<=maxLevel;l++){chosen=l;if(projectedError(radiusM,distanceM,l,viewportHeight)<=targetPixels)break}if(previousLevel!==null&&Math.abs(chosen-previousLevel)===1){const e=projectedError(radiusM,distanceM,previousLevel,viewportHeight);if(e>targetPixels*(1-hysteresis)&&e<targetPixels*(1+hysteresis))return previousLevel}return chosen}
function mixedLodPlan({targetDirection=[0,0,1],radiusM,distanceM,viewportHeight=900,maxLevel=10,maxPatches=24,previousLevel=null}){
 if(!Number.isInteger(maxPatches)||maxPatches<6)throw new Error('maxPatches must be >= 6');
 const level=chooseLevel({radiusM,distanceM,viewportHeight,maxLevel,previousLevel});
 if(distanceM>radiusM*5||level===0)return Object.freeze({level:0,targetLevel:level,keys:Object.freeze(FACES.map(f=>freezeKey(f,0,0,0))),mixed:false});
 const coarseLevel=Math.max(0,level-1),anchor=patchFromDirection(targetDirection,coarseLevel),fine=childrenKeys(anchor),seen=new Set(fine.map(keyString)),keys=[...fine];
 for(let r=1;r<=2&&keys.length<maxPatches;r++)for(let dy=-r;dy<=r&&keys.length<maxPatches;dy++)for(let dx=-r;dx<=r&&keys.length<maxPatches;dx++){
  if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const k=remapPatchOffset(anchor,dx,dy),s=keyString(k);if(seen.has(s))continue;seen.add(s);keys.push(k);
 }
 return Object.freeze({level:coarseLevel,targetLevel:level,anchor,keys:Object.freeze(keys),mixed:true});
}
function auditPlan(keys){const uniq=new Set(keys.map(keyString));if(uniq.size!==keys.length)throw new Error('duplicate patch in presentation plan');let crossFace=0,maxDelta=0;for(const k of keys){const n=edgeNeighbors(k);for(const e of EDGE_NAMES){if(n[e].face!==k.face)crossFace++;for(const q of keys){if(q.face===n[e].face){const d=Math.abs(numberLevel(k.level)-numberLevel(q.level));maxDelta=Math.max(maxDelta,d)}}}}return Object.freeze({unique:true,crossFaceTransitionsObserved:crossFace,maxObservedLevelDelta:maxDelta})}
function createSession(provider,{maxCpuMeshes=96,maxActivePatches=24}={}){if(maxActivePatches<6||maxCpuMeshes<maxActivePatches)throw new Error('invalid rendering working-set bounds');return {provider,cache:new LRU(maxCpuMeshes),maxActivePatches,active:new Map(),previousLevel:null,meshBuildMs:0,cpuEvictedKeys:0}}
function materialize(session,key,opts){const id=keyString(key),hit=session.cache.get(id);if(hit)return hit;const t0=typeof performance==='object'?performance.now():Date.now(),mesh=buildIndexedPatchMesh(session.provider,key,opts),t1=typeof performance==='object'?performance.now():Date.now();session.meshBuildMs+=t1-t0;session.cpuEvictedKeys+=session.cache.set(id,mesh).length;return mesh}
function activate(session,plan,opts={}){if(plan.keys.length>session.maxActivePatches)throw new Error('active patch bound exceeded');const next=new Map();for(const k of plan.keys)next.set(keyString(k),materialize(session,k,opts));session.active=next;session.previousLevel=plan.targetLevel;return sessionStats(session)}
function sessionStats(session){let vb=0,ib=0,vertices=0,triangles=0;for(const m of session.active.values()){vb+=m.vertexBytes;ib+=m.indexBytes;vertices+=m.presentationVertexCount;triangles+=m.triangles}return Object.freeze({activePatches:session.active.size,cpuMeshes:session.cache.map.size,maxCpuMeshes:session.cache.maxEntries,maxActivePatches:session.maxActivePatches,vertexBytes:vb,indexBytes:ib,activeMeshBytes:vb+ib,vertices,triangles,meshBuildMs:session.meshBuildMs,cpuEvictedKeys:session.cpuEvictedKeys,cache:session.cache.stats()})}
function semanticScale(radius,distance){if(distance>radius*100)return'SYSTEM_VIEW';if(distance>radius*5)return'PLANET_ORBIT';if(distance>radius*1.15)return'PLANET_APPROACH';return'SURFACE_LOCAL'}
function createCamera(radiusM,{distanceRadii=40,targetDirection=[0,0,1]}={}){
 if(!(radiusM>0))throw new Error('positive radius required');const s={radiusM,distanceM:radiusM*distanceRadii,targetDistanceM:radiusM*distanceRadii,direction:normalize(targetDirection),targetDirection:normalize(targetDirection),speed:5,frameOriginMm:[0n,0n,0n],absoluteMm:[0n,0n,0n]};
 return Object.seal(s);
}
function setCameraTarget(camera,{distanceM,direction=camera.targetDirection}){if(!Number.isFinite(distanceM)||distanceM<camera.radiusM*1.002)distanceM=camera.radiusM*1.002;camera.targetDistanceM=distanceM;camera.targetDirection=normalize(direction);return camera}
function stepCamera(camera,dtSeconds){const dt=clamp(dtSeconds,0,0.1),a=1-Math.exp(-camera.speed*dt);camera.distanceM+=(camera.targetDistanceM-camera.distanceM)*a;const d=[camera.direction[0]+(camera.targetDirection[0]-camera.direction[0])*a,camera.direction[1]+(camera.targetDirection[1]-camera.direction[1])*a,camera.direction[2]+(camera.targetDirection[2]-camera.direction[2])*a];camera.direction=normalize(d);return cameraSnapshot(camera)}
function cameraSnapshot(c){const p=[c.direction[0]*c.distanceM,c.direction[1]*c.distanceM,c.direction[2]*c.distanceM];return Object.freeze({distanceM:c.distanceM,targetDistanceM:c.targetDistanceM,direction:c.direction,position:Object.freeze(p),scale:semanticScale(c.radiusM,c.distanceM)})}
function rebaseIntegerFrame(camera,absoluteMm,newOriginMm){const local=exactLocalVec3(absoluteMm,newOriginMm);camera.absoluteMm=[...absoluteMm];camera.frameOriginMm=[...newOriginMm];return Object.freeze({absoluteMm:Object.freeze([...absoluteMm]),originMm:Object.freeze([...newOriginMm]),localMm:local})}
function dynamicClip(radiusM,distanceM){
 if(!(radiusM>0)||!(distanceM>radiusM))throw new Error('invalid depth-fit inputs');
 if(distanceM>=radiusM*5){const margin=radiusM*1.25,near=Math.max(1,distanceM-margin),far=distanceM+margin;return Object.freeze({near,far,ratio:far/near,regime:'ASTRONOMICAL_FITTED'})}
 const altitude=Math.max(1,distanceM-radiusM),near=Math.max(0.5,Math.min(10000,altitude*0.015)),horizon=Math.sqrt(Math.max(0,distanceM*distanceM-radiusM*radiusM)),far=Math.max(near*100,Math.min(radiusM*4,horizon+radiusM*0.35));return Object.freeze({near,far,ratio:far/near,regime:'PLANET_LOCAL_FITTED'});
}
function depthAdjudication(radiusM){const cases=[1.01,1.2,2,5,10,100,180].map(k=>{const c=dynamicClip(radiusM,radiusM*k);return Object.freeze({distanceRadii:k,near:c.near,far:c.far,ratio:c.ratio,regime:c.regime,planetDepthCovered:c.near<=radiusM*k-radiusM&&c.far>=Math.min(radiusM*k+radiusM,radiusM*k>=radiusM*5?radiusM*k+radiusM:Math.sqrt(Math.max(0,(radiusM*k)**2-radiusM**2)))})});return Object.freeze({selected:'HIERARCHICAL_LOCAL_FRAME_DYNAMIC_CLIP',conventionalGlobal:Object.freeze({feasible:false,reason:'one static astronomical-to-surface near/far interval wastes fixed-point depth precision'}),conventionalLocalFrame:Object.freeze({feasible:true,cases}),reversedZ:Object.freeze({feasible:false,selected:false,reason:'WebGL2 lacks portable clip-control for the robust reversed-Z path; no evidence justifies emulation complexity'}),logarithmicDepth:Object.freeze({feasible:true,selected:false,reason:'fragment/shader complexity is unnecessary once reference frames and fitted ranges bound depth ratios'}),multipassDepth:Object.freeze({feasible:true,selected:false,reason:'not required for the current low-complexity planet slice; retain as future presentation option'}),hierarchicalFittedDepth:Object.freeze({feasible:true,selected:true,reason:'separate scale regimes with local coordinates and fitted clip intervals cover the planet while bounding precision demand'}),physicalGpuMemoryTelemetry:'UNAVAILABLE_PORTABLY'});}
O.planetRenderCore=Object.freeze({AUTHORITY,FACES,keyString,exactLocalDelta,exactLocalVec3,faceVector,directionToFaceUv,patchFromDirection,patchCenterDirection,remapPatchOffset,edgeNeighbors,parentKey,childrenKeys,angularDistance,LRU,createP5Provider,buildIndexedPatchMesh,projectedError,chooseLevel,mixedLodPlan,auditPlan,createSession,materialize,activate,sessionStats,semanticScale,createCamera,setCameraTarget,stepCamera,cameraSnapshot,rebaseIntegerFrame,dynamicClip,depthAdjudication});
})(typeof globalThis!=='undefined'?globalThis:this);

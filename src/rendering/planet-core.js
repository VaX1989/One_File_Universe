(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const P2=O.p2,A=O.p3Astronomy,P5=O.p5Planetology;
if(!P2||!A||!P5)throw new Error('OFU planet renderer requires canonical P2/P3/P5');
const AUTHORITY='PRESENTATION_ONLY';
const FACES=Object.freeze(['PX','NX','PY','NY','PZ','NZ']);
const EDGE_NAMES=Object.freeze(['W','E','S','N']);
const ELEVATION_CODE_MIN=-32768,ELEVATION_CODE_MAX=32767;
const DEFAULT_PRESENTATION_RELIEF_FRACTION=0.0035;
const MAX_PRESENTATION_RELIEF_FRACTION=0.02;
const DEFAULT_CAMERA_CLEARANCE_FRACTION=0.0035;
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
function presentationBounds(radius,scale){const minRadiusM=radius+ELEVATION_CODE_MIN*scale,maxRadiusM=radius+ELEVATION_CODE_MAX*scale,maxRadialOffsetM=Math.max(radius-minRadiusM,maxRadiusM-radius),maxReliefFraction=maxRadialOffsetM/radius;return Object.freeze({authority:AUTHORITY,physicalElevationMeaning:'UNSUPPORTED',meanRadiusM:radius,minRadiusM,maxRadiusM,maxRadialOffsetM,maxReliefFraction,elevationCodeRange:Object.freeze([ELEVATION_CODE_MIN,ELEVATION_CODE_MAX])})}
function createP5Provider(ctx,physical,{presentationReliefFraction=DEFAULT_PRESENTATION_RELIEF_FRACTION,presentationElevationScale=null}={}){
 if(!ctx||!physical||physical.status!=='SUPPORTED')throw new Error('supported canonical P5 physical planet required');
 const radius=Number(physical.physical.meanRadiusM);if(!Number.isSafeInteger(radius)||radius<=0)throw new Error('P5 radius outside presentation-safe range');
 let scale,requestedPresentationElevationScale=null,presentationElevationScaleWasClamped=false;
 if(presentationElevationScale!==null&&presentationElevationScale!==undefined){if(!Number.isFinite(presentationElevationScale)||presentationElevationScale<0)throw new Error('invalid presentation elevation scale');requestedPresentationElevationScale=presentationElevationScale;const boundedMax=radius*MAX_PRESENTATION_RELIEF_FRACTION/Math.abs(ELEVATION_CODE_MIN);scale=Math.min(presentationElevationScale,boundedMax);presentationElevationScaleWasClamped=scale!==presentationElevationScale}else{if(!Number.isFinite(presentationReliefFraction)||presentationReliefFraction<0||presentationReliefFraction>MAX_PRESENTATION_RELIEF_FRACTION)throw new Error('invalid presentation relief fraction');scale=radius*presentationReliefFraction/Math.abs(ELEVATION_CODE_MIN)}
 const bounds=presentationBounds(radius,scale);if(bounds.maxReliefFraction>MAX_PRESENTATION_RELIEF_FRACTION+Number.EPSILON)throw new Error('presentation relief exceeds bounded safety envelope');
 const topology=P5.createTerrainTopology(physical);
 if(topology.version!=='p5-cube-sphere-topology-1')throw new Error('unsupported canonical P5 terrain topology');
 return Object.freeze({version:'ofu-render-p5-consumer-2',authority:'CONSUMER_ONLY',planetId:P2.hex(physical.planetId),topologyVersion:topology.version,heightSemantic:topology.heightSemantic,presentationElevationScale:scale,requestedPresentationElevationScale,presentationElevationScaleWasClamped,presentationReliefFraction:bounds.maxReliefFraction,presentationBounds:bounds,physical,topology,getPatch:key=>P5.generateTerrainPatch(ctx,topology,key),refine:key=>P5.refinePatchKey(key)});
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
 return Object.freeze({authority:AUTHORITY,key:patch.key,keyString:keyString(patch.key),sourceTopology:patch.topologyVersion,heightSemantic:provider.heightSemantic,physicalElevationMeaning:'UNSUPPORTED',presentationElevationScale:scale,presentationReliefFraction:provider.presentationReliefFraction,presentationBounds:provider.presentationBounds,canonicalVertexCount:Number(patch.vertexCount),presentationVertexCount:vertices.length/3,presentationSkirtVertices:skirtVertices,canonicalVertexIds:Object.freeze(ids),elevationCodes:Object.freeze(codes),localOrigin:Object.freeze([ox,oy,oz]),vertices,indices:indexArray,triangles:indexArray.length/3,vertexBytes:vertices.byteLength,indexBytes:indexArray.byteLength});
}
function projectedError(radiusM,distanceM,level,viewportHeight=900,fovDeg=55){const l=numberLevel(level),angular=Math.PI/(2*(2**l)),worldError=radiusM*angular/4,pxPerRad=viewportHeight/(2*Math.tan(fovDeg*Math.PI/360));return worldError*pxPerRad/Math.max(distanceM,1)}
function chooseLevel({radiusM,distanceM,viewportHeight=900,targetPixels=28,maxLevel=10,previousLevel=null,hysteresis=0.18}){let chosen=0;for(let l=0;l<=maxLevel;l++){chosen=l;if(projectedError(radiusM,distanceM,l,viewportHeight)<=targetPixels)break}if(previousLevel!==null&&Math.abs(chosen-previousLevel)===1){const e=projectedError(radiusM,distanceM,previousLevel,viewportHeight);if(e>targetPixels*(1-hysteresis)&&e<targetPixels*(1+hysteresis))return previousLevel}return chosen}
function everyPatchAtLevel(level){const l=numberLevel(level),n=2**l,keys=[];for(const face of FACES)for(let y=0;y<n;y++)for(let x=0;x<n;x++)keys.push(freezeKey(face,l,x,y));return Object.freeze(keys)}
function presentationHorizonAngle(surfaceRadiusM,distanceM){if(!(surfaceRadiusM>0)||!Number.isFinite(distanceM))throw new Error('invalid presentation horizon inputs');if(distanceM<=surfaceRadiusM)return Math.PI/2;return Math.acos(clamp(surfaceRadiusM/distanceM,0,1))}
function mixedLodPlan({targetDirection=[0,0,1],radiusM,distanceM,surfaceRadiusM=radiusM,viewportHeight=900,maxLevel=10,maxPatches=28,previousLevel=null}){
 if(!Number.isInteger(maxPatches)||maxPatches<6)throw new Error('maxPatches must be >= 6');
 const targetLevel=chooseLevel({radiusM,distanceM,viewportHeight,maxLevel,previousLevel}),outerRadius=Math.max(radiusM,surfaceRadiusM),horizonAngleRad=presentationHorizonAngle(outerRadius,distanceM);
 if(distanceM>=radiusM*2.2||targetLevel===0){const globalLevel=targetLevel>=1&&maxPatches>=24?1:0,keys=everyPatchAtLevel(globalLevel);return Object.freeze({level:globalLevel,targetLevel,effectiveFineLevel:globalLevel,keys,mixed:false,coverageMode:'GLOBAL_SPHERE',coverageRing:0,horizonAngleRad,coverageHalfAngleRad:Math.PI,coverageComplete:true,viewportHeight});}
 const coverageRing=maxPatches>=28?2:1,coverageSpan=2*coverageRing+1,coverageMargin=1.15;let coarseLevel=Math.max(0,targetLevel-1);while(coarseLevel>0){const patchAngular=Math.PI/(2*(2**coarseLevel)),halfSpan=coverageSpan*patchAngular/2;if(halfSpan>=horizonAngleRad*coverageMargin)break;coarseLevel--}
 const patchAngular=Math.PI/(2*(2**coarseLevel)),coverageHalfAngleRad=coverageSpan*patchAngular/2,anchor=patchFromDirection(targetDirection,coarseLevel),fine=childrenKeys(anchor),seen=new Set(fine.map(keyString)),keys=[...fine];
 for(let r=1;r<=coverageRing&&keys.length<maxPatches;r++)for(let dy=-r;dy<=r&&keys.length<maxPatches;dy++)for(let dx=-r;dx<=r&&keys.length<maxPatches;dx++){
  if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const k=remapPatchOffset(anchor,dx,dy),s=keyString(k);if(seen.has(s))continue;seen.add(s);keys.push(k);
 }
 return Object.freeze({level:coarseLevel,targetLevel,effectiveFineLevel:coarseLevel+1,anchor,keys:Object.freeze(keys),mixed:true,coverageMode:'VISIBLE_CAP',coverageRing,horizonAngleRad,coverageHalfAngleRad,coverageComplete:coverageHalfAngleRad>=horizonAngleRad*coverageMargin,viewportHeight});
}
function auditPlan(keys){const uniq=new Set(keys.map(keyString));if(uniq.size!==keys.length)throw new Error('duplicate patch in presentation plan');let crossFace=0,maxDelta=0;for(const k of keys){const n=edgeNeighbors(k);for(const e of EDGE_NAMES){if(n[e].face!==k.face)crossFace++;for(const q of keys){if(q.face===n[e].face){const d=Math.abs(numberLevel(k.level)-numberLevel(q.level));maxDelta=Math.max(maxDelta,d)}}}}return Object.freeze({unique:true,crossFaceTransitionsObserved:crossFace,maxObservedLevelDelta:maxDelta})}
function createSession(provider,{maxCpuMeshes=96,maxActivePatches=32}={}){if(maxActivePatches<6||maxCpuMeshes<maxActivePatches)throw new Error('invalid rendering working-set bounds');return {provider,cache:new LRU(maxCpuMeshes),maxActivePatches,active:new Map(),previousLevel:null,meshBuildMs:0,cpuEvictedKeys:0}}
function materialize(session,key,opts){const id=keyString(key),hit=session.cache.get(id);if(hit)return hit;const t0=typeof performance==='object'?performance.now():Date.now(),mesh=buildIndexedPatchMesh(session.provider,key,opts),t1=typeof performance==='object'?performance.now():Date.now();session.meshBuildMs+=t1-t0;session.cpuEvictedKeys+=session.cache.set(id,mesh).length;return mesh}
function activate(session,plan,opts={}){if(plan.keys.length>session.maxActivePatches)throw new Error('active patch bound exceeded');const next=new Map();for(const k of plan.keys)next.set(keyString(k),materialize(session,k,opts));session.active=next;session.previousLevel=plan.targetLevel;return sessionStats(session)}
function sessionStats(session){let vb=0,ib=0,vertices=0,triangles=0;for(const m of session.active.values()){vb+=m.vertexBytes;ib+=m.indexBytes;vertices+=m.presentationVertexCount;triangles+=m.triangles}return Object.freeze({activePatches:session.active.size,cpuMeshes:session.cache.map.size,maxCpuMeshes:session.cache.maxEntries,maxActivePatches:session.maxActivePatches,vertexBytes:vb,indexBytes:ib,activeMeshBytes:vb+ib,vertices,triangles,meshBuildMs:session.meshBuildMs,cpuEvictedKeys:session.cpuEvictedKeys,cache:session.cache.stats()})}
function semanticScale(radius,distance){if(distance>radius*100)return'SYSTEM_VIEW';if(distance>radius*5)return'PLANET_ORBIT';if(distance>radius*1.15)return'PLANET_APPROACH';return'SURFACE_LOCAL'}
function cameraEnvelope(provider,{clearanceFraction=DEFAULT_CAMERA_CLEARANCE_FRACTION}={}){if(!provider?.presentationBounds)throw new Error('presentation provider bounds required');if(!Number.isFinite(clearanceFraction)||clearanceFraction<0||clearanceFraction>0.05)throw new Error('invalid camera clearance fraction');const meanRadiusM=provider.presentationBounds.meanRadiusM,meshBoundingRadiusM=provider.presentationBounds.maxRadiusM,minDistanceM=meshBoundingRadiusM+meanRadiusM*clearanceFraction;return Object.freeze({authority:AUTHORITY,meanRadiusM,meshBoundingRadiusM,minDistanceM,meshBoundingRadiusRadii:meshBoundingRadiusM/meanRadiusM,minDistanceRadii:minDistanceM/meanRadiusM,clearanceFraction,physicalElevationMeaning:'UNSUPPORTED'})}
function createCamera(radiusM,{distanceRadii=40,targetDirection=[0,0,1],meshBoundingRadiusM=radiusM,clearanceFraction=DEFAULT_CAMERA_CLEARANCE_FRACTION}={}){
 if(!(radiusM>0)||!Number.isFinite(meshBoundingRadiusM)||meshBoundingRadiusM<radiusM||!Number.isFinite(clearanceFraction)||clearanceFraction<0)throw new Error('positive bounded camera radii required');const minDistanceM=meshBoundingRadiusM+radiusM*clearanceFraction,initialDistance=Math.max(radiusM*distanceRadii,minDistanceM),s={radiusM,meshBoundingRadiusM,minDistanceM,clearanceFraction,distanceM:initialDistance,targetDistanceM:initialDistance,direction:normalize(targetDirection),targetDirection:normalize(targetDirection),speed:5,frameOriginMm:[0n,0n,0n],absoluteMm:[0n,0n,0n]};
 return Object.seal(s);
}
function setCameraTarget(camera,{distanceM,direction=camera.targetDirection}){if(!Number.isFinite(distanceM)||distanceM<camera.minDistanceM)distanceM=camera.minDistanceM;camera.targetDistanceM=distanceM;camera.targetDirection=normalize(direction);return camera}
function stepCamera(camera,dtSeconds){const dt=Number.isFinite(dtSeconds)?Math.max(0,dtSeconds):0,a=-Math.expm1(-camera.speed*dt);camera.distanceM+=(camera.targetDistanceM-camera.distanceM)*a;if(camera.distanceM<camera.minDistanceM)camera.distanceM=camera.minDistanceM;const d=[camera.direction[0]+(camera.targetDirection[0]-camera.direction[0])*a,camera.direction[1]+(camera.targetDirection[1]-camera.direction[1])*a,camera.direction[2]+(camera.targetDirection[2]-camera.direction[2])*a];camera.direction=normalize(d);return cameraSnapshot(camera)}
function cameraSnapshot(c){const p=[c.direction[0]*c.distanceM,c.direction[1]*c.distanceM,c.direction[2]*c.distanceM];return Object.freeze({distanceM:c.distanceM,targetDistanceM:c.targetDistanceM,distanceRadii:c.distanceM/c.radiusM,targetDistanceRadii:c.targetDistanceM/c.radiusM,minDistanceM:c.minDistanceM,minDistanceRadii:c.minDistanceM/c.radiusM,meshBoundingRadiusM:c.meshBoundingRadiusM,meshBoundingRadiusRadii:c.meshBoundingRadiusM/c.radiusM,surfaceClearanceM:c.distanceM-c.meshBoundingRadiusM,penetratingPresentationGeometry:c.distanceM<=c.meshBoundingRadiusM,direction:c.direction,position:Object.freeze(p),scale:semanticScale(c.radiusM,c.distanceM)})}
function rebaseIntegerFrame(camera,absoluteMm,newOriginMm){const local=exactLocalVec3(absoluteMm,newOriginMm);camera.absoluteMm=[...absoluteMm];camera.frameOriginMm=[...newOriginMm];return Object.freeze({absoluteMm:Object.freeze([...absoluteMm]),originMm:Object.freeze([...newOriginMm]),localMm:local})}
function dynamicClip(radiusM,distanceM,surfaceRadiusM=radiusM){
 if(!(radiusM>0)||!(surfaceRadiusM>=radiusM)||!(distanceM>surfaceRadiusM))throw new Error('invalid depth-fit inputs');
 if(distanceM>=radiusM*5){const margin=surfaceRadiusM*1.25,near=Math.max(1,distanceM-margin),far=distanceM+margin;return Object.freeze({near,far,ratio:far/near,regime:'ASTRONOMICAL_FITTED',surfaceRadiusM})}
 const altitude=Math.max(1,distanceM-surfaceRadiusM),near=Math.max(0.5,Math.min(10000,altitude*0.015)),horizon=Math.sqrt(Math.max(0,distanceM*distanceM-surfaceRadiusM*surfaceRadiusM)),far=Math.max(near*100,Math.min(surfaceRadiusM*4,horizon+surfaceRadiusM*0.35));return Object.freeze({near,far,ratio:far/near,regime:'PLANET_LOCAL_FITTED',surfaceRadiusM});
}
function depthAdjudication(radiusM){const cases=[1.01,1.2,2,5,10,100,180].map(k=>{const c=dynamicClip(radiusM,radiusM*k);return Object.freeze({distanceRadii:k,near:c.near,far:c.far,ratio:c.ratio,regime:c.regime,planetDepthCovered:c.near<=radiusM*k-radiusM&&c.far>=Math.min(radiusM*k+radiusM,radiusM*k>=radiusM*5?radiusM*k+radiusM:Math.sqrt(Math.max(0,(radiusM*k)**2-radiusM**2)))})});return Object.freeze({selected:'HIERARCHICAL_LOCAL_FRAME_DYNAMIC_CLIP',conventionalGlobal:Object.freeze({feasible:false,reason:'one static astronomical-to-surface near/far interval wastes fixed-point depth precision'}),conventionalLocalFrame:Object.freeze({feasible:true,cases}),reversedZ:Object.freeze({feasible:false,selected:false,reason:'WebGL2 lacks portable clip-control for the robust reversed-Z path; no evidence justifies emulation complexity'}),logarithmicDepth:Object.freeze({feasible:true,selected:false,reason:'fragment/shader complexity is unnecessary once reference frames and fitted ranges bound depth ratios'}),multipassDepth:Object.freeze({feasible:true,selected:false,reason:'not required for the current low-complexity planet slice; retain as future presentation option'}),hierarchicalFittedDepth:Object.freeze({feasible:true,selected:true,reason:'separate scale regimes with local coordinates and fitted clip intervals cover the planet while bounding precision demand'}),physicalGpuMemoryTelemetry:'UNAVAILABLE_PORTABLY'});}
O.planetRenderCore=Object.freeze({AUTHORITY,FACES,ELEVATION_CODE_MIN,ELEVATION_CODE_MAX,DEFAULT_PRESENTATION_RELIEF_FRACTION,MAX_PRESENTATION_RELIEF_FRACTION,DEFAULT_CAMERA_CLEARANCE_FRACTION,keyString,exactLocalDelta,exactLocalVec3,faceVector,directionToFaceUv,patchFromDirection,patchCenterDirection,remapPatchOffset,edgeNeighbors,parentKey,childrenKeys,angularDistance,LRU,presentationBounds,createP5Provider,buildIndexedPatchMesh,projectedError,chooseLevel,everyPatchAtLevel,presentationHorizonAngle,mixedLodPlan,auditPlan,createSession,materialize,activate,sessionStats,semanticScale,cameraEnvelope,createCamera,setCameraTarget,stepCamera,cameraSnapshot,rebaseIntegerFrame,dynamicClip,depthAdjudication});
})(typeof globalThis!=='undefined'?globalThis:this);

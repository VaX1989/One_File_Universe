(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const A=O.p3Astronomy,P5=O.p5Planetology,P2=O.p2;
if(!A||!P5||!P2)throw new Error('OFU rendering wave2 requires canonical P2/P3/P5');
const AUTH='PRESENTATION_ONLY';
const SCENARIOS=Object.freeze({
 SYSTEM_VIEW:Object.freeze({maxQueries:16,maxPatches:0,maxLevel:0}),
 PLANET_ORBIT:Object.freeze({maxQueries:8,maxPatches:0,maxLevel:0}),
 PLANET_APPROACH:Object.freeze({maxQueries:4,maxPatches:24,maxLevel:5}),
 SURFACE_LOCAL:Object.freeze({maxQueries:2,maxPatches:64,maxLevel:10})
});
function hex(b){return P2.hex(b)}
function keyOf(k){return k.face+'/'+k.level+'/'+k.x+'/'+k.y}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function exactLocalDelta(world,origin,label='coordinate'){
 if(typeof world!=='bigint'||typeof origin!=='bigint')throw new Error(label+' must be BigInt');
 const d=world-origin;if(d<BigInt(Number.MIN_SAFE_INTEGER)||d>BigInt(Number.MAX_SAFE_INTEGER))throw new Error(label+' local delta exceeds safe presentation range');
 return Number(d);
}
function splitBoundedFloat(x){if(!Number.isFinite(x))throw new Error('finite presentation value required');const hi=Math.fround(x),lo=x-hi;return Object.freeze([hi,lo])}
class LRU{
 constructor(maxEntries=96){if(!Number.isInteger(maxEntries)||maxEntries<1)throw new Error('invalid LRU bound');this.maxEntries=maxEntries;this.map=new Map();this.hits=0;this.misses=0;this.evictions=0}
 get(k){if(!this.map.has(k)){this.misses++;return null}this.hits++;const v=this.map.get(k);this.map.delete(k);this.map.set(k,v);return v}
 set(k,v){if(this.map.has(k))this.map.delete(k);this.map.set(k,v);while(this.map.size>this.maxEntries){this.map.delete(this.map.keys().next().value);this.evictions++}return v}
 clear(){this.map.clear()}
 stats(){return Object.freeze({entries:this.map.size,maxEntries:this.maxEntries,hits:this.hits,misses:this.misses,evictions:this.evictions})}
}
function normalizePrimitive(v){const x=Number(v.x),y=Number(v.y),z=Number(v.z),m=Math.hypot(x,y,z);if(!m)throw new Error('zero cube vector');return [x/m,y/m,z/m]}
function buildBaseIndices(segments=4){const out=[];for(let y=0;y<segments;y++)for(let x=0;x<segments;x++){const a=y*(segments+1)+x,b=a+1,c=a+segments+1,d=c+1;out.push(a,c,b,b,c,d)}return out}
const BASE_INDICES=Object.freeze(buildBaseIndices(4));
function edgeVertexIndices(){const top=[0,1,2,3,4],right=[4,9,14,19,24],bottom=[24,23,22,21,20],left=[20,15,10,5,0];return [top,right,bottom,left]}
const EDGE_INDICES=Object.freeze(edgeVertexIndices().map(Object.freeze));
function createP5Provider(ctx,physical,{elevationScale=180}={}){
 if(!ctx||!physical||physical.status!=='SUPPORTED')throw new Error('supported canonical P5 physical planet required');
 if(!Number.isFinite(elevationScale)||elevationScale<0)throw new Error('invalid presentation elevation scale');
 const topology=P5.createTerrainTopology(physical),planetId=hex(physical.planetId),radiusM=physical.physical.meanRadiusM;
 return Object.freeze({
  version:'render-p5-provider-v1',authority:'CONSUMER_ONLY',planetId,topologyVersion:topology.version,heightSemantic:topology.heightSemantic,
  presentationElevationScale:elevationScale,physical,topology,
  getPatch(key){return P5.generateTerrainPatch(ctx,topology,key)},
  refine(key){return P5.refinePatchKey(key)}
 });
}
function buildIndexedMesh(provider,key,{skirts=true,skirtDepth=0.002}={}){
 const patch=provider.getPatch(key),radius=Number(provider.physical.physical.meanRadiusM),scale=provider.presentationElevationScale;
 if(!Number.isSafeInteger(radius))throw new Error('P5 radius exceeds safe presentation conversion');
 const positions=[],canonicalVertexIds=[],elevationCodes=[];
 for(const v of patch.vertices){const n=normalizePrimitive(v.primitive),h=Number(v.elevationCode)*scale,rr=radius+h;positions.push(n[0]*rr,n[1]*rr,n[2]*rr);canonicalVertexIds.push(hex(v.address));elevationCodes.push(Number(v.elevationCode))}
 const indices=[...BASE_INDICES];let presentationSkirtVertices=0;
 if(skirts){const drop=Math.max(1,radius*skirtDepth);for(const edge of EDGE_INDICES){const skirt=[];for(const src of edge){const p=src*3,n=Math.hypot(positions[p],positions[p+1],positions[p+2]),dst=positions.length/3;positions.push(positions[p]*(n-drop)/n,positions[p+1]*(n-drop)/n,positions[p+2]*(n-drop)/n);canonicalVertexIds.push(canonicalVertexIds[src]);elevationCodes.push(elevationCodes[src]);skirt.push(dst);presentationSkirtVertices++}for(let i=0;i<edge.length-1;i++){const a=edge[i],b=edge[i+1],sa=skirt[i],sb=skirt[i+1];indices.push(a,sa,b,b,sa,sb)}}}
 const vertexArray=new Float32Array(positions),indexArray=(positions.length/3<65536)?new Uint16Array(indices):new Uint32Array(indices);
 return Object.freeze({authority:AUTH,sourceTopology:patch.topologyVersion,key:patch.key,canonicalVertexCount:Number(patch.vertexCount),presentationVertexCount:vertexArray.length/3,presentationSkirtVertices,canonicalVertexIds:Object.freeze(canonicalVertexIds),elevationCodes:Object.freeze(elevationCodes),vertices:vertexArray,indices:indexArray,triangles:indexArray.length/3,vertexBytes:vertexArray.byteLength,indexBytes:indexArray.byteLength,physicalElevationMeaning:'UNSUPPORTED',presentationElevationScale:scale});
}
function patchCenter(mesh){let x=0,y=0,z=0,n=mesh.canonicalVertexCount;for(let i=0;i<n;i++){x+=mesh.vertices[i*3];y+=mesh.vertices[i*3+1];z+=mesh.vertices[i*3+2]}return [x/n,y/n,z/n]}
function localizeMesh(mesh){const c=patchCenter(mesh),v=new Float32Array(mesh.vertices.length);for(let i=0;i<mesh.vertices.length;i+=3){v[i]=mesh.vertices[i]-c[0];v[i+1]=mesh.vertices[i+1]-c[1];v[i+2]=mesh.vertices[i+2]-c[2]}return Object.freeze({...mesh,vertices:v,localOrigin:Object.freeze(c),vertexBytes:v.byteLength})}
function projectedError(radiusM,distanceM,level,viewportHeight=1080,fovDeg=60){const patchAngular=Math.PI/(2*(1<<Number(level))),worldError=radiusM*patchAngular/4,pxPerRad=viewportHeight/(2*Math.tan(fovDeg*Math.PI/360));return worldError*pxPerRad/Math.max(distanceM,1)}
function chooseLevel({radiusM,distanceM,viewportHeight=1080,targetPixels=32,maxLevel=10,previousLevel=null,hysteresis=0.2}){let chosen=0;for(let l=0;l<=maxLevel;l++){if(projectedError(radiusM,distanceM,l,viewportHeight)<=targetPixels){chosen=l;break}chosen=l}if(previousLevel!==null&&Math.abs(chosen-previousLevel)===1){const prevErr=projectedError(radiusM,distanceM,previousLevel,viewportHeight);if(prevErr>targetPixels*(1-hysteresis)&&prevErr<targetPixels*(1+hysteresis))return previousLevel}return chosen}
function boundedPatchPlan({face='PZ',level=4,x=0,y=0,maxPatches=24}){const axis=1<<level,cx=clamp(x,0,axis-1),cy=clamp(y,0,axis-1),out=[];for(let r=0;out.length<maxPatches&&r<axis;r++){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const px=cx+dx,py=cy+dy;if(px>=0&&py>=0&&px<axis&&py<axis)out.push(Object.freeze({face,level:BigInt(level),x:BigInt(px),y:BigInt(py)}));if(out.length>=maxPatches)break}}return Object.freeze(out)}
function createSession(provider,{maxCacheEntries=96,maxActivePatches=64}={}){if(maxActivePatches<1)throw new Error('invalid active patch bound');return {provider,cache:new LRU(maxCacheEntries),maxActivePatches,uploads:0,uploadedBytes:0,meshBuildMs:0,active:new Map(),frameTimes:[],longFrames:0,previousLevel:null}}
function materialize(session,key,opts={}){const k=keyOf(key),cached=session.cache.get(k);if(cached)return cached;const t0=typeof performance!=='undefined'?performance.now():Date.now(),mesh=localizeMesh(buildIndexedMesh(session.provider,key,opts)),t1=typeof performance!=='undefined'?performance.now():Date.now();session.meshBuildMs+=t1-t0;session.cache.set(k,mesh);return mesh}
function activatePlan(session,keys,opts={}){if(keys.length>session.maxActivePatches)throw new Error('active patch budget exceeded');session.active.clear();for(const k of keys)session.active.set(keyOf(k),materialize(session,k,opts));return stats(session)}
function stats(session){let vb=0,ib=0,verts=0,tris=0;for(const m of session.active.values()){vb+=m.vertexBytes;ib+=m.indexBytes;verts+=m.presentationVertexCount;tris+=m.triangles}return Object.freeze({activePatches:session.active.size,retainedCacheEntries:session.cache.map.size,vertices:verts,triangles:tris,vertexBufferBytes:vb,indexBytes:ib,approxGpuBytes:vb+ib,uploads:session.uploads,uploadedBytes:session.uploadedBytes,meshBuildMs:session.meshBuildMs,cache:session.cache.stats()})}
function canonicalWitness(ctx,planetKey){const planet=A.resolvePlanet(ctx,planetKey),snap=A.planetaryInputSnapshot(ctx,planetKey),physical=P5.realizePhysicalPlanet(ctx,P5.adaptP3PlanetaryInputSnapshot(snap)),topology=physical.status==='SUPPORTED'?P5.createTerrainTopology(physical):null,probe=topology?P5.generateTerrainPatch(ctx,topology,{face:'PZ',level:2n,x:1n,y:1n}):null;return Object.freeze({p3:planet.status==='PRESENT'?hex(A.digestFact(planet)):planet.status,p5Physical:physical.status==='SUPPORTED'?hex(P5.physicalDigest(physical)):physical.status,p5Terrain:probe?hex(O.sha256.digest(P2.encode(probe))):'UNSUPPORTED'})}
function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'shader compile failed');return s}
const GL=new WeakMap(),LISTENERS=new WeakSet();
function initGL(canvas){let s=GL.get(canvas);if(s&&s.gl&&!s.gl.isContextLost())return s;let gl;try{gl=canvas.getContext('webgl2',{antialias:true,alpha:false,depth:true})}catch{}if(!gl||gl.isContextLost())return null;if(!LISTENERS.has(canvas)){canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();GL.delete(canvas)});canvas.addEventListener('webglcontextrestored',()=>GL.delete(canvas));LISTENERS.add(canvas)}const vs=shader(gl,gl.VERTEX_SHADER,'#version 300 es\nlayout(location=0) in vec3 p;uniform mat4 mvp;void main(){gl_Position=mvp*vec4(p,1.0);}'),fs=shader(gl,gl.FRAGMENT_SHADER,'#version 300 es\nprecision highp float;out vec4 c;void main(){c=vec4(0.28,0.66,0.46,1.0);}'),prog=gl.createProgram();gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(prog)||'program link failed');gl.deleteShader(vs);gl.deleteShader(fs);s={gl,prog,mvp:gl.getUniformLocation(prog,'mvp'),buffers:new Map()};GL.set(canvas,s);return s}
function identityMvp(scale=1/2500000){return new Float32Array([scale,0,0,0,0,scale,0,0,0,0,scale,0,0,0,0,1])}
function uploadMesh(state,id,mesh){let b=state.buffers.get(id);if(b)return b;const gl=state.gl,vb=gl.createBuffer(),ib=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);b={vb,ib,count:mesh.indices.length,type:mesh.indices instanceof Uint32Array?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT,bytes:mesh.vertexBytes+mesh.indexBytes};state.buffers.set(id,b);return b}
function renderWebGL2(canvas,session){const state=initGL(canvas);if(!state)return{backend:'unavailable'};const gl=state.gl;gl.viewport(0,0,canvas.width,canvas.height);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(.008,.012,.024,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(state.prog);gl.uniformMatrix4fv(state.mvp,false,identityMvp());let drawCalls=0,uploaded=0;for(const [id,m] of session.active){const before=state.buffers.has(id),b=uploadMesh(state,id,m);if(!before){session.uploads++;session.uploadedBytes+=b.bytes;uploaded+=b.bytes}gl.bindBuffer(gl.ARRAY_BUFFER,b.vb);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b.ib);gl.drawElements(gl.TRIANGLES,b.count,b.type,0);drawCalls++}return{backend:'webgl2',drawCalls,uploadedBytes:uploaded,depthStrategy:'CONVENTIONAL_LOCAL_FRAME'} }
function renderCanvas2D(canvas,session){let g;try{g=canvas.getContext('2d')}catch{}if(!g)return{backend:'unavailable'};g.fillStyle='#050811';g.fillRect(0,0,canvas.width,canvas.height);g.strokeStyle='#76cba1';let draws=0;for(const m of session.active.values()){const v=m.vertices,idx=m.indices,cx=canvas.width/2,cy=canvas.height/2,s=Math.min(canvas.width,canvas.height)/5000000;for(let i=0;i<idx.length;i+=3){const a=idx[i]*3,b=idx[i+1]*3,c=idx[i+2]*3;g.beginPath();g.moveTo(cx+v[a]*s,cy-v[a+1]*s);g.lineTo(cx+v[b]*s,cy-v[b+1]*s);g.lineTo(cx+v[c]*s,cy-v[c+1]*s);g.closePath();g.stroke();draws++}}return{backend:'canvas2d',drawCalls:draws,depthStrategy:'PAINTER_FALLBACK'}}
function renderPortable(canvas,session){const r=renderWebGL2(canvas,session);return r.backend==='webgl2'?r:renderCanvas2D(canvas,session)}
function recordFrame(session,ms){session.frameTimes.push(ms);if(session.frameTimes.length>600)session.frameTimes.shift();if(ms>50)session.longFrames++}
function percentile(a,p){if(!a.length)return null;const s=[...a].sort((x,y)=>x-y),i=Math.min(s.length-1,Math.max(0,Math.floor((s.length-1)*p)));return s[i]}
function frameStats(session){return Object.freeze({samples:session.frameTimes.length,p50:percentile(session.frameTimes,.5),p95:percentile(session.frameTimes,.95),p99:percentile(session.frameTimes,.99),longFrames:session.longFrames})}
function transitionForDistance(radiusM,distanceM){if(distanceM>radiusM*100)return'SYSTEM_VIEW';if(distanceM>radiusM*12)return'PLANET_ORBIT';if(distanceM>radiusM*1.5)return'PLANET_APPROACH';return'SURFACE_LOCAL'}
O.renderWave2=Object.freeze({AUTH,SCENARIOS,LRU,exactLocalDelta,splitBoundedFloat,createP5Provider,buildIndexedMesh,localizeMesh,projectedError,chooseLevel,boundedPatchPlan,createSession,materialize,activatePlan,stats,canonicalWitness,renderWebGL2,renderCanvas2D,renderPortable,recordFrame,frameStats,transitionForDistance});
})(typeof globalThis!=='undefined'?globalThis:this);

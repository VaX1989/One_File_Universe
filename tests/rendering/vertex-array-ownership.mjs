import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Independent, deliberately small WebGL state-machine oracle. This exercises the
// real renderers, but is NOT GPU/framebuffer evidence. Its draw validation is
// based on the Khronos enabled-attribute / range-checking rule, not on their code.
function statefulGL(){
 let id=0,error=0,arrayBuffer=null,program=null,lost=false;
 const makeVao=()=>({id:++id,attributes:new Map(),element:null,deleted:false,invalid:false});
 const defaultVao=makeVao(),vaos=new Set(),buffers=new Set(),programs=new Set();let vao=defaultVao;
 const gl={ARRAY_BUFFER:0x8892,ELEMENT_ARRAY_BUFFER:0x8893,STATIC_DRAW:0x88e4,DYNAMIC_DRAW:0x88e8,
  FLOAT:0x1406,UNSIGNED_BYTE:0x1401,UNSIGNED_SHORT:0x1403,UNSIGNED_INT:0x1405,TRIANGLES:4,
  VERTEX_SHADER:0x8b31,FRAGMENT_SHADER:0x8b30,COMPILE_STATUS:0x8b81,LINK_STATUS:0x8b82,
  DEPTH_TEST:0xb71,DEPTH_BITS:0xd56,LEQUAL:0x203,CULL_FACE:0xb44,BACK:0x405,
  COLOR_BUFFER_BIT:0x4000,DEPTH_BUFFER_BIT:0x100,RGBA:0x1908,INVALID_OPERATION:0x502,
  failVaoAt:Infinity,vaoAllocations:0,failBufferAt:Infinity,bufferAllocations:0,draws:0,instancedDraws:0,
  isContextLost:()=>lost,
  createShader:type=>({type,source:'',deleted:false}),shaderSource:(s,source)=>{s.source=source},compileShader(){},
  getShaderParameter:()=>true,getShaderInfoLog:()=>'',deleteShader:s=>{s.deleted=true},
  createProgram:()=>{const p={id:++id,shaders:[],used:new Set(),deleted:false,invalid:false};programs.add(p);return p},
  attachShader:(p,s)=>p.shaders.push(s),
  linkProgram:p=>{for(const s of p.shaders)if(s.type===gl.VERTEX_SHADER)for(const m of s.source.matchAll(/layout\(location=(\d+)\)\s+in/g))p.used.add(Number(m[1]))},
  getProgramParameter:()=>true,getProgramInfoLog:()=>'',deleteProgram:p=>{p.deleted=true},
  useProgram:p=>{program=p},getUniformLocation:(p,name)=>({p,name}),
  uniformMatrix4fv(){},uniform3fv(){},uniform3f(){},uniform2f(){},uniform1f(){},
  createVertexArray:()=>{if(++gl.vaoAllocations===gl.failVaoAt)return null;const v=makeVao();vaos.add(v);return v},
  bindVertexArray:v=>{if(v&&(v.deleted||v.invalid)){error=gl.INVALID_OPERATION;return}vao=v||defaultVao},
  deleteVertexArray:v=>{if(!v)return;v.deleted=true;if(vao===v)vao=defaultVao},
  createBuffer:()=>{if(++gl.bufferAllocations===gl.failBufferAt)return null;const b={id:++id,deleted:false,invalid:false,data:null,bytes:0};buffers.add(b);return b},
  bindBuffer:(target,b)=>{if(b&&(b.deleted||b.invalid)){error=gl.INVALID_OPERATION;return}if(target===gl.ARRAY_BUFFER)arrayBuffer=b;else if(target===gl.ELEMENT_ARRAY_BUFFER)vao.element=b;else throw new Error('unmodelled buffer target')},
  bufferData:(target,data)=>{const b=target===gl.ARRAY_BUFFER?arrayBuffer:vao.element;if(!b){error=gl.INVALID_OPERATION;return}b.data=typeof data==='number'?new Uint8Array(data):data.slice();b.bytes=typeof data==='number'?data:data.byteLength},
  deleteBuffer:b=>{b.deleted=true;if(arrayBuffer===b)arrayBuffer=null;if(vao.element===b)vao.element=null;for(const a of vao.attributes.values())if(a.buffer===b)a.buffer=null},
  enableVertexAttribArray:i=>{attribute(i).enabled=true},disableVertexAttribArray:i=>{attribute(i).enabled=false},
  vertexAttribPointer:(i,size,type,normalized,stride,offset)=>{const a=attribute(i);a.buffer=arrayBuffer;a.size=size;a.stride=stride;a.offset=offset;a.type=type},
  vertexAttribDivisor:(i,divisor)=>{attribute(i).divisor=divisor},
  viewport(){},enable(){},depthFunc(){},cullFace(){},clearColor(){},clear(){},
  getParameter:p=>p===gl.DEPTH_BITS?24:null,
  readPixels:(x,y,w,h,format,type,out)=>{out.set([90,80,60,255])},
  getError:()=>{const out=error;error=0;return out},
  drawElements:(mode,count,type,offset)=>{const b=vao.element;if(!b||b.deleted||b.invalid||b.bytes<offset+count*(type===gl.UNSIGNED_INT?4:2)){error=gl.INVALID_OPERATION;return}const indices=b.data.slice(offset/(type===gl.UNSIGNED_INT?4:2),offset/(type===gl.UNSIGNED_INT?4:2)+count);draw(Math.max(...indices),1)},
  drawArraysInstanced:(mode,first,count,instances)=>{gl.instancedDraws++;draw(first+count-1,instances)},
  inspect:()=>({defaultAttributes:[...defaultVao.attributes].map(([i,a])=>({i,enabled:a.enabled,hasBuffer:!!a.buffer,divisor:a.divisor})),boundPrivate:vao!==defaultVao,
   liveVaos:[...vaos].filter(v=>!v.deleted&&!v.invalid).length,liveBuffers:[...buffers].filter(b=>!b.deleted&&!b.invalid).length,livePrograms:[...programs].filter(p=>!p.deleted&&!p.invalid).length}),
  lose:()=>{lost=true;for(const pool of [vaos,buffers,programs])for(const o of pool)o.invalid=true;vao=defaultVao;defaultVao.attributes.clear();defaultVao.element=null;arrayBuffer=null;program=null},
  restore:()=>{lost=false}
 };
 function attribute(i){let a=vao.attributes.get(i);if(!a){a={enabled:false,buffer:null,size:4,stride:0,offset:0,divisor:0,type:gl.FLOAT};vao.attributes.set(i,a)}return a}
 function draw(maxVertex,instances){
  if(!program||program.deleted||program.invalid){error=gl.INVALID_OPERATION;return}
  for(const [i,a] of vao.attributes){
   if(!a.enabled)continue;
   if(!a.buffer||a.buffer.deleted||a.buffer.invalid){error=gl.INVALID_OPERATION;return}
   if(!program.used.has(i))continue;
   const index=a.divisor>0?Math.floor((instances-1)/a.divisor):maxVertex;
   if(a.offset+index*(a.stride||a.size*4)+a.size*4>a.buffer.bytes){error=gl.INVALID_OPERATION;return}
  }
  gl.draws++;
 }
 return gl;
}
function canvasFor(gl){const listeners=new Map();return{width:1000,height:710,getContext:kind=>kind==='webgl2'?gl:null,
 addEventListener:(name,fn)=>{if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn)},
 fire:name=>{let prevented=false;for(const f of listeners.get(name)||[])f({preventDefault(){prevented=true}});return prevented},
 listenerCount:name=>(listeners.get(name)||[]).length};}
const load=p=>vm.runInThisContext(fs.readFileSync(p,'utf8'),{filename:p});
globalThis.OFU={planetRenderCore:{dynamicClip:()=>({near:1,far:20000000})}};
for(const p of ['planet-webgl2.js','planet-surface.js','planet-surface-terrain.js','planet-surface-continuity.js','planet-surface-relief.js','planet-surface-webgl2.js'])load('src/rendering/'+p);
const G=OFU.planetWebGL2,SG=OFU.planetSurfaceWebGL2,S=OFU.planetSurface,T=OFU.planetSurfaceTerrain;
const provider={planetId:'vao-ownership-test',physical:{physical:{meanRadiusM:6371000},upstreamBaseline:{formation:{bulkPriorClass:'TERRESTRIAL'}}}};
const vertices=new Float32Array([0,0,0,10,0,0,0,10,0]),indices=new Uint16Array([0,1,2]);
const mesh={localOrigin:[0,0,6371000],vertices,indices,vertexBytes:vertices.byteLength,indexBytes:indices.byteLength};
const globeSession={provider,active:new Map([['triangle',mesh]]),cache:{map:new Map([['triangle',mesh]])}};
const globeCamera={distanceM:10000000,position:[0,0,10000000]};
const anchor=S.createAnchor({planetId:provider.planetId,radiusM:6371000,viewDirection:[.18,.12,1]});
const camera=S.createLocalCamera(anchor,{presentationAltitudeM:65}),local=S.localCameraSnapshot(camera);

// Reproduce the specification-level failure with the legacy shared-default-VAO
// sequence: an unused but enabled attribute loses its buffer on pass disposal.
const legacy=statefulGL(),p=legacy.createProgram();p.used.add(0);legacy.useProgram(p);
const vb=legacy.createBuffer();legacy.bindBuffer(legacy.ARRAY_BUFFER,vb);legacy.bufferData(legacy.ARRAY_BUFFER,vertices);legacy.enableVertexAttribArray(0);legacy.vertexAttribPointer(0,3,legacy.FLOAT,false,0,0);
const ib=legacy.createBuffer();legacy.bindBuffer(legacy.ELEMENT_ARRAY_BUFFER,ib);legacy.bufferData(legacy.ELEMENT_ARRAY_BUFFER,indices);
const dead=legacy.createBuffer();legacy.bindBuffer(legacy.ARRAY_BUFFER,dead);legacy.bufferData(legacy.ARRAY_BUFFER,new Float32Array(4));legacy.enableVertexAttribArray(1);legacy.vertexAttribPointer(1,4,legacy.FLOAT,false,0,0);legacy.deleteBuffer(dead);
legacy.drawElements(legacy.TRIANGLES,3,legacy.UNSIGNED_SHORT,0);assert.equal(legacy.getError(),0x502);
legacy.disableVertexAttribArray(1);legacy.drawElements(legacy.TRIANGLES,3,legacy.UNSIGNED_SHORT,0);assert.equal(legacy.getError(),0);

const gl=statefulGL(),canvas=canvasFor(gl),journey=[];
function globe(){const d=G.render(canvas,globeSession,globeCamera);assert.equal(d.glError,0,'globe render after surface disposal must not inherit an enabled/deleted instance attribute');assert.equal(d.gpu.vertexArrays.liveArrays,1);assert(d.gpu.vertexArrays.lifecycleAccountingExact);assert(!gl.inspect().boundPrivate);return d}
function surface(band='HUMAN'){const session=T.createTerrainSession();const d=SG.render(canvas,session,{...local,currentBand:band},{provider});assert.equal(d.glError,0,'terrain and instanced passes must have independent attribute state');assert.equal(d.gpu.vertexArrays.liveArrays,2);assert(d.gpu.vertexArrays.lifecycleAccountingExact);assert(d.gpu.lifecycleAccountingExact);assert(d.gpu.microdetailLifecycleAccountingExact);assert(!gl.inspect().boundPrivate);session.dispose();return d}
for(let cycle=0;cycle<8;cycle++){
 const before=globe();const releaseG=G.dispose(canvas);assert.equal(releaseG.gpu.vertexArrays.liveArrays,0);
 const human=surface();assert(human.microdetailCount>0);assert(gl.instancedDraws>0);
 const region=surface('REGIONAL_SURFACE');assert.equal(region.microdetailCount,0);assert.equal(region.gpu.microdetailBuffers.bytes,human.gpu.microdetailBuffers.bytes,'retained instance storage must remain accounted while not drawn');
 const close=surface();const releaseS=SG.dispose(canvas);
 assert.equal(releaseS.gpu.liveBuffers,0);assert.equal(releaseS.gpu.microdetailBuffers.live,0);assert.equal(releaseS.gpu.vertexArrays.liveArrays,0);
 assert(releaseS.gpu.microdetailLifecycleAccountingExact);assert.equal(gl.inspect().liveVaos,0);
 const after=globe();assert.equal(after.palette,before.palette);assert.equal(after.presentationSeed,before.presentationSeed);
 G.dispose(canvas);assert.deepEqual([gl.inspect().liveBuffers,gl.inspect().liveVaos,gl.inspect().livePrograms],[0,0,0]);
 journey.push({cycle,microdetail:close.microdetailCount,globeError:after.glError,liveResourcesAfterRelease:0});
}
assert.equal(canvas.listenerCount('webglcontextlost'),2,'one stable context-loss listener per renderer, not per entry');
assert(!gl.inspect().defaultAttributes.some(a=>a.enabled),'no pass may enable arrays on the shared default VAO');

// Context loss/restoration must invalidate all pass-owned arrays and auxiliary
// buffers, reconstruct new generations and preserve exact lifecycle accounting.
globe();gl.lose();assert(canvas.fire('webglcontextlost'));assert.equal(G.stateStats(canvas).gpu.vertexArrays.liveArrays,0);assert.equal(G.render(canvas,globeSession,globeCamera).backend,'unavailable');gl.restore();canvas.fire('webglcontextrestored');
const restoredGlobe=globe();assert.equal(restoredGlobe.gpu.vertexArrays.generation,2);assert.equal(restoredGlobe.gpu.vertexArrays.invalidated,1);assert(restoredGlobe.gpu.lifecycleAccountingExact);G.dispose(canvas);
surface();gl.lose();assert(canvas.fire('webglcontextlost'));const lost=SG.stats(canvas);assert.equal(lost.gpu.vertexArrays.liveArrays,0);assert.equal(lost.gpu.microdetailBuffers.live,0);assert.equal(lost.gpu.microdetailBuffers.invalidated,2);assert(lost.gpu.microdetailLifecycleAccountingExact);gl.restore();canvas.fire('webglcontextrestored');
const restoredSurface=surface();assert.equal(restoredSurface.gpu.vertexArrays.generation,2);assert.equal(restoredSurface.gpu.vertexArrays.invalidated,2);assert.equal(restoredSurface.gpu.microdetailBuffers.invalidated,2);assert(restoredSurface.gpu.microdetailLifecycleAccountingExact);SG.dispose(canvas);
assert.deepEqual([gl.inspect().liveBuffers,gl.inspect().liveVaos,gl.inspect().livePrograms],[0,0,0]);

// Foreign default-array state must neither be consumed nor mutated by a pass.
gl.enableVertexAttribArray(3);gl.vertexAttribDivisor(3,7);const foreign=gl.inspect().defaultAttributes;
globe();G.dispose(canvas);surface();SG.dispose(canvas);assert.deepEqual(gl.inspect().defaultAttributes,foreign);gl.disableVertexAttribArray(3);
assert.throws(()=>new G.VertexArrayOwner(gl,0));assert.throws(()=>new G.VertexArrayOwner(gl,5));const owner=new G.VertexArrayOwner(gl,2);assert.throws(()=>owner.bind(2));owner.dispose();owner.dispose();assert.equal(owner.stats().deleted,2);assert.throws(()=>owner.bind(0));
const allocation=statefulGL();allocation.failVaoAt=2;assert.throws(()=>new G.VertexArrayOwner(allocation,2),/allocation failed/);assert.equal(allocation.inspect().liveVaos,0);
for(const mode of ['vao','buffer']){const a=statefulGL(),c=canvasFor(a);if(mode==='vao')a.failVaoAt=2;else a.failBufferAt=2;const t=T.createTerrainSession();assert.throws(()=>SG.render(c,t,local,{provider}),/allocation failed/);t.dispose();assert.deepEqual([a.inspect().liveVaos,a.inspect().liveBuffers,a.inspect().livePrograms],[0,0,0])}
const gAlloc=statefulGL();gAlloc.failVaoAt=1;assert.throws(()=>G.render(canvasFor(gAlloc),globeSession,globeCamera),/allocation failed/);assert.equal(gAlloc.inspect().livePrograms,0);
const partial=statefulGL();partial.failBufferAt=2;const registry=new G.GPURegistry(partial);assert.throws(()=>registry.upload('partial',mesh),/allocation failed/);assert.equal(registry.stats().createdBuffers,registry.stats().deletedBuffers);assert.equal(partial.inspect().liveBuffers,0);
const limited=statefulGL(),bounded=new G.GPURegistry(limited,{maxMeshes:1,maxBytes:100});bounded.beginFrame();bounded.upload('a',mesh);const allocated=limited.bufferAllocations;assert.throws(()=>bounded.upload('b',mesh),/bound/);assert.equal(limited.bufferAllocations,allocated);assert.equal(bounded.stats().liveMeshes,1);bounded.beginFrame();bounded.upload('b',mesh);assert.equal(bounded.stats().liveMeshes,1);assert.equal(bounded.stats().deletedMeshes,1);bounded.dispose();assert.equal(limited.inspect().liveBuffers,0);
console.log(JSON.stringify({status:'PASS',evidenceClass:'INDEPENDENT_WEBGL_STATE_MODEL_NOT_GPU_MEASUREMENT',legacyFailureCode:0x502,journey,globeRestore:restoredGlobe.gpu.vertexArrays,surfaceRestore:restoredSurface.gpu.vertexArrays,surfaceAuxiliaryBuffers:restoredSurface.gpu.microdetailBuffers,defaultVaoPreserved:true,allocationFailureCleanup:true}));

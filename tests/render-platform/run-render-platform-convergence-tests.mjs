import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

globalThis.OFU={};
for(const f of [
  'src/rendering/effects/fxaa.js',
  'src/rendering/effects/shadows.js',
  'src/rendering/effects/volumetrics.js',
  'src/rendering/materials/presentation-shaders.js',
  'src/rendering/webgl2/resources.js',
  'src/rendering/webgl2/timer-query.js'
]) vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});

let assertions=0;
const ok=(value,message)=>{assert(value,message);assertions++};
const eq=(a,b,message)=>{assert.equal(a,b,message);assertions++};
const throws=(fn,predicate,message)=>{assert.throws(fn,predicate,message);assertions++};

function fakeGL(){
  let sequence=0,drawArrays=0,drawElements=0,failCompile=false,failLink=false,disjoint=false,queryReady=true,blendEnabled=false;
  const drawStates=[];
  const deleted=[];
  const gl={
    ARRAY_BUFFER:1,ELEMENT_ARRAY_BUFFER:2,STATIC_DRAW:3,STREAM_DRAW:4,
    TEXTURE_2D:5,TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,TEXTURE_WRAP_S:8,TEXTURE_WRAP_T:9,TEXTURE_MAX_LEVEL:10,
    LINEAR:11,CLAMP_TO_EDGE:12,RGBA8:13,RGBA:14,UNSIGNED_BYTE:15,FLOAT:16,UNSIGNED_INT:17,
    VERTEX_SHADER:18,FRAGMENT_SHADER:19,COMPILE_STATUS:20,LINK_STATUS:21,
    FRAMEBUFFER:22,COLOR_ATTACHMENT0:23,RENDERBUFFER:24,DEPTH_COMPONENT24:25,DEPTH_ATTACHMENT:26,FRAMEBUFFER_COMPLETE:27,
    QUERY_RESULT_AVAILABLE:28,QUERY_RESULT:29,
    POINTS:30,LINES:31,TRIANGLES:32,DEPTH_TEST:33,LEQUAL:34,COLOR_BUFFER_BIT:1<<8,DEPTH_BUFFER_BIT:1<<9,
    BLEND:35,SRC_ALPHA:36,ONE_MINUS_SRC_ALPHA:37,TEXTURE0:38,RGBA32F:39,
    createBuffer:()=>({kind:'buffer',id:++sequence}),bindBuffer(){},bufferData(){},deleteBuffer:x=>deleted.push(x),
    createTexture:()=>({kind:'texture',id:++sequence}),bindTexture(){},texParameteri(){},texImage2D(){},generateMipmap(){},deleteTexture:x=>deleted.push(x),activeTexture(){},
    createShader:()=>({kind:'shader',id:++sequence}),shaderSource(){},compileShader(){},getShaderParameter:()=>!failCompile,getShaderInfoLog:()=> 'compile failure',deleteShader:x=>deleted.push(x),
    createProgram:()=>({kind:'program',id:++sequence}),attachShader(){},linkProgram(){},getProgramParameter:()=>!failLink,getProgramInfoLog:()=> 'link failure',deleteProgram:x=>deleted.push(x),
    createVertexArray:()=>({kind:'vao',id:++sequence}),bindVertexArray(){},deleteVertexArray:x=>deleted.push(x),enableVertexAttribArray(){},vertexAttribPointer(){},
    createFramebuffer:()=>({kind:'framebuffer',id:++sequence}),bindFramebuffer(){},framebufferTexture2D(){},deleteFramebuffer:x=>deleted.push(x),
    createRenderbuffer:()=>({kind:'renderbuffer',id:++sequence}),bindRenderbuffer(){},renderbufferStorage(){},framebufferRenderbuffer(){},deleteRenderbuffer:x=>deleted.push(x),checkFramebufferStatus:()=>27,
    useProgram(){},getUniformLocation:(p,name)=>({p,name}),uniformMatrix4fv(){},uniform3fv(){},uniform1f(){},uniform1i(){},uniform2f(){},
    viewport(){},enable(cap){if(cap===35)blendEnabled=true},disable(cap){if(cap===35)blendEnabled=false},depthFunc(){},clearDepth(){},clearColor(){},clear(){},blendFunc(){},
    drawArrays(){drawArrays++;drawStates.push({kind:'arrays',blend:blendEnabled})},drawElements(){drawElements++;drawStates.push({kind:'elements',blend:blendEnabled})},
    getExtension:name=>name==='EXT_disjoint_timer_query_webgl2'?{TIME_ELAPSED_EXT:40,GPU_DISJOINT_EXT:41}:null,
    createQuery:()=>({kind:'query',id:++sequence}),beginQuery(){},endQuery(){},deleteQuery:x=>deleted.push(x),getParameter:()=>disjoint,getQueryParameter:(q,p)=>p===28?queryReady:2_500_000,
    _draws:()=>({arrays:drawArrays,elements:drawElements,total:drawArrays+drawElements}),_drawStates:()=>drawStates.slice(),_deleted:deleted,
    _setCompile:v=>{failCompile=v},_setLink:v=>{failLink=v},_setDisjoint:v=>{disjoint=v},_setQueryReady:v=>{queryReady=v}
  };
  return gl;
}

// Preserve the pre-existing convergence invariants.
const I=Array.from({length:16},(_,i)=>i%5===0?1:0);
const atlas=OFU.renderShadows.planAtlas({views:[{id:'sun:0',viewProjection:I},{id:'sun:1',viewProjection:I}],atlasSize:2048});
eq(atlas.views.length,2);eq(atlas.views[0].cameraAuthority,'EXTERNAL_READ_ONLY');eq(atlas.cameraGeneration,false);
throws(()=>OFU.renderShadows.planAtlas({views:[{id:'a',viewProjection:I},{id:'a',viewProjection:I}]}),e=>e.code==='COLLISION');
const vr=OFU.renderVolumetrics.integrateRay({profile:{steps:100,density:.1,maxDistance:1000},sampleDensity:()=>.5});ok(vr.transmittance>=0&&vr.transmittance<=1);ok(vr.inscatter>=0);eq(vr.scientificAtmosphereClaim,false);
const pp=OFU.renderVolumetrics.planParticles([{id:'p:2',position:[0,0,0],materialRef:'dust'},{id:'p:1',position:[1,0,0],materialRef:'dust'}]);eq(pp.drawUpperBound,1);eq(pp.batches[0].items[0].id,'p:1');eq(pp.simulationAuthority,'EXTERNAL_READ_ONLY');
throws(()=>OFU.renderVolumetrics.planParticles([{position:[0,0,0]}]),e=>e.code==='ID');
const m=OFU.renderPresentationShaders.materialUniforms({emissive:[100,2,1],roughness:0});eq(m.roughness,.04);eq(m.emissive[0],64);eq(m.scientificColorClaim,false);
const variant=OFU.renderPresentationShaders.variant({shadow:true,fog:true,alpha:'mask'});eq(variant.key,'lit.shadow.fog.mask');eq(variant.scientificLightingClaim,false);eq(variant.physicalBRDFClaim,false);

const gl=fakeGL();
const manager=OFU.renderWebGL2Resources.createManager(gl,{maxResources:2,maxTrackedBytes:1024,maxTextureDimension:16});
manager.createTexture2D('float-storage',{width:2,height:2,internalFormat:gl.RGBA32F,format:gl.RGBA,type:gl.UNSIGNED_BYTE});
eq(manager.snapshot().trackedBytes,64);
throws(()=>manager.createTexture2D('understated',{width:2,height:2,internalFormat:gl.RGBA32F,format:gl.RGBA,type:gl.UNSIGNED_BYTE,bytesPerPixel:4}),e=>e.code==='BUDGET');
eq(manager.snapshot().liveResources,1);ok(manager.handles('float-storage')?.primary);manager.dispose();

let timerGl=fakeGL();
const tq=OFU.renderWebGL2TimerQuery.create(timerGl);const deletedBeforeTimer=timerGl._deleted.length;tq.begin('active');timerGl._setDisjoint(true);eq(tq.poll().status,'DISJOINT');eq(tq.snapshot().active,false);eq(tq.snapshot().discarded,1);eq(timerGl._deleted.length-deletedBeforeTimer,1);tq.dispose();

// V2X-13 strict pixel consumer: actual WebGL draw path across every required embodiment domain.
const consumerGl=fakeGL();
const C=OFU.renderWebGL2Resources.createFrameConsumer(consumerGl,{maxDraws:16,maxVertices:128,maxIndices:128,maxFrameBytes:65536,maxRetainedBytes:65536,maxTrackedBytes:4194304,maxTextureDimension:1024});
eq(C.snapshot().fallbackPath,'FORBIDDEN');eq(C.snapshot().primaryRendererAuthority,false);eq(C.snapshot().canvas2dFallbackUsed,false);

const triPositions=[-0.5,-0.5,0, 0.5,-0.5,0, 0,0.5,0];
const triNormals=[0,0,1, 0,0,1, 0,0,1];
const point=(id,domain,x)=>({id,domain,primitive:'POINTS',lit:false,positions:[x,0,0],material:{baseColor:[.5,.7,1],pointSize:4},lod:{level:1,transition:.25}});
const triangle=(id,domain,z)=>({id,domain,primitive:'TRIANGLES',positions:triPositions.map((v,i)=>i%3===2?v+z:v),normals:triNormals,material:{baseColor:[.22,.52,.31],roughness:.48,metallic:.08},lod:{level:2,transition:.5}});
const packet={
  frameId:'living:frame:1',sceneId:'living:scene:system',selectionId:'entity:focus',semanticSignature:'sig:5f13a1',
  viewport:{width:640,height:360},camera:{viewProjection:I,position:[0,0,5]},clearColor:[.01,.02,.04,1],aaMode:'FXAA',fog:true,
  lighting:{direction:[.2,-1,.4],color:[1,.92,.78],intensity:1.4,ambient:.09},
  draws:[
    point('macro:stars','MACRO',-.8),triangle('system:body','SYSTEM',0),triangle('planet:sphere','PLANET',.01),triangle('terrain:cell','TERRAIN',.02),
    triangle('water:patch','WATER',.03),triangle('vegetation:canopy','VEGETATION',.04),triangle('organism:body','ORGANISM',.05),triangle('structure:block','STRUCTURE',.06),point('matter:atom','MATTER',.8)
  ]
};
const before=consumerGl._draws().total;
const witness=C.render(packet);
eq(witness.backend,'V2X13_WEBGL2_PIXEL_CONSUMER');eq(witness.pixelConsumer,'V2X-13');eq(witness.canvas2dFallbackUsed,false);eq(witness.primaryRendererAuthority,false);eq(witness.cameraAuthority,'EXTERNAL_READ_ONLY');eq(witness.sceneCompositionAuthority,'EXTERNAL_READ_ONLY');eq(witness.semanticScaleAuthority,'EXTERNAL_READ_ONLY');eq(witness.aaMode,'FXAA');eq(witness.depthTest,true);eq(witness.lighting,true);eq(witness.atmospherePresentation,true);eq(witness.geometryDrawCalls,9);eq(witness.drawCalls,10);ok(consumerGl._draws().total-before===10,'all geometry plus FXAA must hit WebGL draw calls');
for(const domain of OFU.renderWebGL2Resources.DOMAINS)eq(witness.domainCounts[domain],1,'domain '+domain+' must be GPU-consumed');
eq(C.snapshot().resourceManager.accountingExact,true);ok(C.snapshot().resourceManager.trackedBytes<=C.snapshot().resourceManager.maxTrackedBytes);eq(C.snapshot().retainedFrameBytes,witness.frameBytes);ok(/^[0-9a-f]{16}$/.test(witness.packetFingerprint),'fingerprint must be a 64-bit hexadecimal witness');
eq(witness.packetFingerprint,'6cba86fbdc775545','exact normalized-frame fingerprint drift');
eq(witness.packetFingerprintAlgorithm,'FNV1A32X2_CANONICAL_LE_V1');
const fingerprintSource=fs.readFileSync('src/rendering/webgl2/resources.js','utf8');
ok(fingerprintSource.includes('setFloat32(0,v[i],true)'),'float fingerprint encoding must be explicit little-endian');
ok(fingerprintSource.includes('setUint32(0,v[i],true)'),'index fingerprint encoding must be explicit little-endian');

// Pixel-witness integrity: every render-affecting field that was previously omitted must change the fingerprint.
const fingerprintGl=fakeGL(),FC=OFU.renderWebGL2Resources.createFrameConsumer(fingerprintGl,{maxDraws:16,maxVertices:128,maxIndices:128,maxFrameBytes:65536,maxRetainedBytes:65536,maxTrackedBytes:4194304,maxTextureDimension:1024});
const fingerprintBase={...packet,aaMode:'NONE'};
const baseFingerprint=FC.render(fingerprintBase).packetFingerprint;
const fingerprintVariants=[
  {...fingerprintBase,viewport:{...fingerprintBase.viewport,width:639}},
  {...fingerprintBase,clearColor:[.02,.02,.04,1]},
  {...fingerprintBase,lighting:{...fingerprintBase.lighting,direction:[.3,-1,.4]}},
  {...fingerprintBase,lighting:{...fingerprintBase.lighting,color:[.9,.92,.78]}},
  {...fingerprintBase,lighting:{...fingerprintBase.lighting,intensity:1.5}},
  {...fingerprintBase,lighting:{...fingerprintBase.lighting,ambient:.1}},
  {...fingerprintBase,draws:fingerprintBase.draws.map((d,i)=>i===0?{...d,material:{...d.material,pointSize:5}}:d)}
];
for(const changed of fingerprintVariants)ok(FC.render(changed).packetFingerprint!==baseFingerprint,'render-affecting mutation must change fingerprint');
eq(FC.render(fingerprintBase).packetFingerprint,baseFingerprint,'identical normalized packet must reproduce fingerprint');
eq(FC.dispose().resourceManager.accountingExact,true);

// FXAA resolve must be state-isolated from a trailing translucent geometry draw.
const blendGl=fakeGL(),BC=OFU.renderWebGL2Resources.createFrameConsumer(blendGl,{maxDraws:16,maxVertices:128,maxIndices:128,maxFrameBytes:65536,maxRetainedBytes:65536,maxTrackedBytes:4194304,maxTextureDimension:1024});
const blendPacket={...packet,frameId:'living:frame:blend',draws:packet.draws.map((d,i)=>i===packet.draws.length-1?{...d,material:{...d.material,opacity:.4}}:d)};
const blendWitness=BC.render(blendPacket),blendStates=blendGl._drawStates();
eq(blendWitness.drawCalls,10);
eq(blendStates.at(-2).blend,true,'trailing translucent geometry must exercise blending');
eq(blendStates.at(-1).blend,false,'FXAA fullscreen resolve must disable blending');
eq(BC.dispose().resourceManager.accountingExact,true);

// Falsification: malformed or excessive frames fail before any pixel draw, never falling back to Canvas2D.
const drawsBeforeInvalid=consumerGl._draws().total;
throws(()=>C.render({...packet,frameId:'bad:domain',draws:[{...packet.draws[0],id:'bad:draw',domain:'LEGACY_CANVAS'}]}),e=>e.code==='DOMAIN');
throws(()=>C.render({...packet,frameId:'bad:camera',camera:null}),e=>e.code==='INPUT');
throws(()=>C.render({...packet,frameId:'bad:duplicate',draws:[packet.draws[0],packet.draws[0]]}),e=>e.code==='COLLISION');
throws(()=>C.render({...packet,frameId:'bad:msaa',aaMode:'DEFAULT_MSAA'}),e=>e.code==='AA');
throws(()=>C.render({...packet,frameId:'bad:geometry',draws:[{...packet.draws[1],id:'oversize',positions:Array(129*3).fill(0),normals:Array(129*3).fill(1)}]}),e=>e.code==='BUDGET');
eq(consumerGl._draws().total,drawsBeforeInvalid,'invalid frame must not draw');eq(C.snapshot().canvas2dFallbackUsed,false);
throws(()=>OFU.renderWebGL2Resources.createFrameConsumer(consumerGl,{maxVertices:NaN}),e=>e.code==='BUDGET');

// Context loss/restoration must deterministically rebuild presentation state and replay the same normalized packet.
const originalFingerprint=witness.packetFingerprint;
const lost=C.contextLost();eq(lost.valid,false);eq(lost.resourceManager.trackedBytes,0);throws(()=>C.render(packet),e=>e.code==='CONTEXT_LOST');
const restoreGl=fakeGL();const restored=C.contextRestored(restoreGl);eq(restored.valid,true);eq(restored.restoredEvents,1);const replay=C.replayLastFrame();eq(replay.replay,true);eq(replay.packetFingerprint,originalFingerprint);eq(replay.geometryDrawCalls,9);eq(restoreGl._draws().total,10);eq(C.snapshot().replayCount,1);eq(C.snapshot().resourceManager.accountingExact,true);

const final=C.dispose();eq(final.disposed,true);eq(final.valid,false);eq(final.canvas2dFallbackUsed,false);eq(final.resourceManager.trackedBytes,0);eq(final.resourceManager.accountingExact,true);

console.log(JSON.stringify({
  status:'PASS',suite:'v2x13-concurrent-convergence',assertions,runtime:process.version,
  pixelWitness:{backend:witness.backend,packetFingerprint:witness.packetFingerprint,drawCalls:witness.drawCalls,geometryDrawCalls:witness.geometryDrawCalls,domains:Object.keys(witness.domainCounts).sort(),aaMode:witness.aaMode,depthTest:witness.depthTest,lighting:witness.lighting,atmospherePresentation:witness.atmospherePresentation,canvas2dFallbackUsed:witness.canvas2dFallbackUsed},
  contextRestore:{sameFingerprint:replay.packetFingerprint===originalFingerprint,replayDrawCalls:replay.drawCalls},
  authority:'PRESENTATION_ONLY',limitations:['FAKE_WEBGL2_CONTEXT_FOR_LANE_ORACLE','CENTRAL_LIVING_BIND_CONVERGENCE_OWNED','NO_PHYSICAL_VRAM_CLAIM']
}));

import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

globalThis.OFU={};
for(const file of ['src/rendering/v1/lod-budget.js','src/rendering/v1/webgl2-world.js']){
  vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
}

const B=OFU.v1RenderBudget;
const W=OFU.v1WorldWebGL2;
assert.equal(B.AUTHORITY,'RUNTIME_ACCOUNTING');
assert.equal(B.ACCOUNTING.class,'MODELED_ALLOCATION_ACCOUNTING');
assert.equal(B.ACCOUNTING.byteSemantics,'CALLER_DECLARED_NORMALIZED_ESTIMATE');
assert.equal(B.ACCOUNTING.driverMemoryMeasured,false);
assert.equal(B.ACCOUNTING.gpuMemoryMeasured,false);
assert.equal(B.ACCOUNTING.heapMemoryMeasured,false);
assert.equal(B.ACCOUNTING.limitsAreAdmissionCeilings,true);

const budget=B.create({mobile:true,dpr:3,memoryClass:'LOW'});
const limit=budget.limits.MICRO;
assert.equal(budget.request('MICRO','oversize',{bytes:limit.bytes+1,objects:1,draws:1}).status,'REJECTED_OVERSIZE');
assert.equal(budget.request('COSMIC','declared',{bytes:20000,objects:3,draws:1}).status,'ALLOCATED');
const accounted=budget.snapshot();
assert.equal(accounted.metrics.peakBytes,20000);
assert.equal(accounted.authority,'RUNTIME_ACCOUNTING');
assert.deepEqual(accounted.accounting,B.ACCOUNTING);

const portrait=W.resourceProfile({maxDpr:2,mobile:null,dpr:3,viewportWidth:390});
assert.deepEqual(portrait,{mobile:true,dpr:2,memoryClass:'NORMAL',authority:'RUNTIME_ACCOUNTING',driverMemoryMeasured:false});
const landscape=W.resourceProfile({maxDpr:2,mobile:null,dpr:1.5,viewportWidth:844});
assert.equal(landscape.mobile,false);
assert.equal(landscape.dpr,1.5);
const explicitDesktop=W.resourceProfile({maxDpr:2,mobile:false,dpr:3,viewportWidth:390});
assert.equal(explicitDesktop.mobile,false);
assert.equal(explicitDesktop.dpr,2);
assert.equal(explicitDesktop.driverMemoryMeasured,false);

const candidates=Array.from({length:70},(_,i)=>({
  sourceId:'g-'+i,
  selectedPath:i===69,
  visual:{x:(i-35)/40,y:0,depth:.5,color:[.7,.8,.9],opacity:1,sizePx:8}
}));
const planned=W.pointAdmissionPlan(candidates,59);
assert.equal(planned.totalObjects,70);
assert.equal(planned.admittedObjects,59);
assert.equal(planned.culledObjects,11);
assert.equal(planned.selectedPreserved,true);
assert.equal(planned.rows.at(-1).sourceId,'g-69');
assert.deepEqual(planned.cost,{bytes:59*32,objects:59,draws:1});

const calls={draws:[],bufferData:[],texImage2D:[]};
const gl={
  VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,
  TEXTURE_2D:5,RGBA:6,UNSIGNED_BYTE:7,TEXTURE_MIN_FILTER:8,LINEAR:9,TEXTURE_MAG_FILTER:10,
  BLEND:11,SRC_ALPHA:12,ONE_MINUS_SRC_ALPHA:13,ARRAY_BUFFER:14,DYNAMIC_DRAW:15,FLOAT:16,
  POINTS:17,TRIANGLES:18,TEXTURE0:19,TEXTURE_WRAP_S:20,REPEAT:21,TEXTURE_WRAP_T:22,CLAMP_TO_EDGE:23,
  COLOR_BUFFER_BIT:1<<24,DEPTH_BUFFER_BIT:1<<25,NO_ERROR:0,
  createShader:()=>({}),shaderSource:()=>{},compileShader:()=>{},getShaderParameter:()=>true,getShaderInfoLog:()=>'',deleteShader:()=>{},
  createProgram:()=>({}),attachShader:()=>{},linkProgram:()=>{},getProgramParameter:()=>true,getProgramInfoLog:()=>'',deleteProgram:()=>{},
  createBuffer:()=>({}),createTexture:()=>({}),bindTexture:()=>{},texImage2D:(...args)=>calls.texImage2D.push(args),texParameteri:()=>{},
  enable:()=>{},blendFunc:()=>{},viewport:()=>{},useProgram:()=>{},bindBuffer:()=>{},
  bufferData:(_target,data)=>calls.bufferData.push(typeof data==='number'?data:(data?.byteLength??data?.length??0)),
  getAttribLocation:()=>-1,enableVertexAttribArray:()=>{},vertexAttribPointer:()=>{},
  drawArrays:(mode,_first,count)=>calls.draws.push({mode,count}),
  getUniformLocation:()=>({}),uniform3fv:()=>{},uniform1f:()=>{},activeTexture:()=>{},uniform1i:()=>{},
  clearColor:()=>{},clear:()=>{},getError:()=>0,deleteBuffer:()=>{},deleteTexture:()=>{}
};
const canvas={width:0,height:0,clientWidth:390,clientHeight:500,getContext:type=>type==='webgl2'?gl:null,addEventListener:()=>{},removeEventListener:()=>{}};
OFU.v1WorldShaders={pointsVertex:'void main(){}',pointsFragment:'void main(){}',globeVertex:'void main(){}',globeFragment:'void main(){}'};
globalThis.devicePixelRatio=2;
globalThis.innerWidth=390;
globalThis.innerHeight=844;
globalThis.matchMedia=()=>({matches:false});

const renderer=W.create(canvas);
const first=renderer.render({scale:'GALAXY',objects:candidates});
assert.equal(first.resourceProfile.mobile,true);
assert.equal(first.admission.kind,'POINTS');
assert.equal(first.admission.status,'ALLOCATED');
assert.equal(first.admission.admittedObjects,first.budget.limits.COSMIC.objects);
assert.equal(first.admission.selectedPreserved,true);
assert.equal(first.admission.culledObjects,70-first.budget.limits.COSMIC.objects);
assert.equal(calls.draws.at(-1).mode,gl.POINTS);
assert.equal(calls.draws.at(-1).count,first.budget.limits.COSMIC.objects);
assert.equal(first.budget.usage.COSMIC.objects,first.budget.limits.COSMIC.objects);
assert.equal(first.budget.usage.COSMIC.bytes,first.budget.limits.COSMIC.objects*32);

const second=renderer.render({scale:'REGION',objects:candidates});
assert.equal(second.budget.usage.COSMIC.objects,second.budget.limits.COSMIC.objects,'shared point buffer accounting must replace, not accumulate by scale');
assert.equal(second.measurements.admissionRejections,0);
assert.ok(second.measurements.lodCulledObjects>0);

const surfaceTexture={key:'planet-a:map',width:96,height:48,data:new Uint8Array(96*48*4)};
const globeScene={
  scale:'PLANET',sourceId:'planet-a',camera:{yaw:0,pitch:0},globeScale:.76,surfaceTexture,
  objects:[{kind:'PLANET_GLOBE',visual:{primaryColor:[.2,.4,.6],secondaryColor:[.3,.5,.7],oceanColor:[.05,.2,.4],iceColor:[.8,.9,1],waterAreaPpm:400000,iceAreaPpm:50000,atmosphereStrength:.3,reliefCuePpm:200000,seed:1}}]
};
const globe=renderer.render(globeScene);
assert.equal(globe.admission.kind,'GLOBE');
assert.equal(globe.admission.status,'ALLOCATED');
assert.equal(globe.admission.surfaceMapAdmitted,true);
assert.equal(globe.budget.usage.GLOBE.bytes,4096+surfaceTexture.data.byteLength);
assert.equal(calls.draws.at(-1).mode,gl.TRIANGLES);
assert.equal(calls.draws.at(-1).count,6);

canvas.clientWidth=844;
canvas.clientHeight=390;
globalThis.innerWidth=844;
globalThis.innerHeight=390;
globalThis.devicePixelRatio=1.5;
const rotated=renderer.render(globeScene);
assert.equal(rotated.resourceProfile.mobile,false);
assert.equal(rotated.resourceProfile.dpr,1.5);
assert.equal(rotated.measurements.profileChanges,1);
assert.equal(rotated.measurements.resourceResets,1);
assert.equal(rotated.budget.usage.COSMIC.objects,0,'profile transition must clear stale point accounting after shared resource reset');
assert.equal(rotated.budget.usage.GLOBE.bytes,4096+surfaceTexture.data.byteLength);
assert.equal(rotated.measurements.admissionRejections,0);

renderer.dispose();
console.log(JSON.stringify({
  status:'PASS',
  suite:'v1-render-resource-accounting',
  authority:B.AUTHORITY,
  accountingClass:B.ACCOUNTING.class,
  byteSemantics:B.ACCOUNTING.byteSemantics,
  peakDeclaredBytes:accounted.metrics.peakBytes,
  driverMemoryMeasured:false,
  gpuMemoryMeasured:false,
  heapMemoryMeasured:false,
  portraitProfile:portrait,
  landscapeProfile:landscape,
  pointAdmission:{limit:first.budget.limits.COSMIC.objects,culled:first.admission.culledObjects,selectedPreserved:first.admission.selectedPreserved},
  globeDeclaredBytes:globe.budget.usage.GLOBE.bytes,
  profileTransitions:rotated.measurements.profileChanges,
  resourceResets:rotated.measurements.resourceResets
}));

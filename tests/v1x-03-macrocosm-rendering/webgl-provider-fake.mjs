import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const context = vm.createContext({ console, performance, Float32Array, ArrayBuffer, Math, Object, String, Number, Error, TypeError, Set });
for (const rel of [
  'src/v1x-03-macrocosm-rendering/macro-core.js',
  'src/v1x-03-macrocosm-rendering/shaders.js',
  'src/v1x-03-macrocosm-rendering/webgl2-provider.js'
]) vm.runInContext(fs.readFileSync(path.join(root, rel), 'utf8'), context, { filename: rel });

function fakeGl(){
  const calls=[]; let next=1;
  const gl={
    calls,
    VERTEX_SHADER:1, FRAGMENT_SHADER:2, COMPILE_STATUS:3, LINK_STATUS:4,
    ARRAY_BUFFER:5, FLOAT:6, DYNAMIC_DRAW:7, POINTS:8,
    DEPTH_TEST:9, LEQUAL:10, BLEND:11, SRC_ALPHA:12, ONE_MINUS_SRC_ALPHA:13,
    COLOR_BUFFER_BIT:0x4000, DEPTH_BUFFER_BIT:0x0100,
    createShader(){return {id:next++}}, shaderSource(){}, compileShader(){}, getShaderParameter(){return true}, getShaderInfoLog(){return ''}, deleteShader(){},
    createProgram(){return {id:next++}}, attachShader(){}, linkProgram(){}, getProgramParameter(){return true}, getProgramInfoLog(){return ''}, deleteProgram(){calls.push(['deleteProgram'])},
    getAttribLocation(_p,name){return {a_position:0,a_radius:1,a_alpha:2,a_morphology:3,a_selected:4}[name] ?? -1},
    getUniformLocation(_p,name){return {name}},
    createBuffer(){return {id:next++}}, deleteBuffer(){calls.push(['deleteBuffer'])},
    createVertexArray(){return {id:next++}}, deleteVertexArray(){calls.push(['deleteVertexArray'])}, bindVertexArray(){}, bindBuffer(){}, enableVertexAttribArray(){}, vertexAttribPointer(){},
    viewport(...a){calls.push(['viewport',...a])}, clearColor(){}, clearDepth(){}, clear(){}, enable(){}, depthFunc(){}, blendFunc(){}, useProgram(){},
    bufferData(_target,data,_usage){calls.push(['bufferData',data.byteLength])},
    uniform3fv(){}, uniform1f(){},
    drawArrays(mode,first,count){calls.push(['drawArrays',mode,first,count])}
  };
  return gl;
}

const gl=fakeGl();
const Provider=context.OFU.v1x03MacroWebGL2;
const provider=Provider.create({gl,quality:'balanced'});
const selection={contract:'ofu-wave-iv-selection-1',kind:'GALAXY',canonicalKey:{catalog:'TEST',id:1n}};
const scene={contract:'fixture-spatial-3d',version:'1',frameId:'ICRS_TEST',entities:[
  {id:'galaxy:center',position:[0,0,0],radius:7,kind:'galaxy',selectable:true,selection,authority:'PRESENTATION_ONLY',presentation:{minDetail:0,morphologyClass:'SPIRAL'}}
]};
const camera={contract:'external-camera-fixture',position:[0,0,100],target:[0,0,0],up:[0,1,0],fovYRadians:Math.PI/3,near:.1,far:10000};
const scale={contract:'ofu-wave-iv-scale-runtime-3',distanceIntentRadii:100,anchors:{galaxy:1000,region:100,stellar_neighborhood:10}};
const viewport={width:800,height:600,devicePixelRatio:1};
const result=provider.render({scene,camera,scale,viewport,clear:true});
assert.equal(result.rendered,true);
assert.equal(result.frame.objects.length,1);
assert.equal(result.metrics.drawCalls,1);
assert.equal(result.metrics.uploadedBytes,28);
assert.equal(gl.calls.filter(c=>c[0]==='drawArrays').length,1);
assert.deepEqual(gl.calls.find(c=>c[0]==='drawArrays').slice(1),[gl.POINTS,0,1]);
const pick=provider.pick(result.frame.objects[0].projection.screenX,result.frame.objects[0].projection.screenY);
assert.equal(pick.entityId,'galaxy:center');
assert.equal(pick.selection,selection);
assert.equal(provider.cameraIntent({kind:'LOOK',dx:1},scale),false);
const snap=provider.snapshot();
assert.equal(snap.shadowCamera,false); assert.equal(snap.shadowScaleRuntime,false); assert.equal(snap.shadowSelection,false);
assert.equal(snap.externalCameraIntentsObserved,1); assert.equal(snap.lastExternalCameraIntent.observedOnly,true);
const candidate=Provider.registrationCandidate(provider);
assert.equal(candidate.centralRegistrationRequired,true);
assert.equal(candidate.authority,'PRESENTATION_ONLY');
provider.dispose();
assert.equal(provider.snapshot().disposed,true);
console.log(JSON.stringify({status:'PASS',provider:Provider.VERSION,contract:Provider.CONTRACT,drawCalls:result.metrics.drawCalls,uploadedBytes:result.metrics.uploadedBytes,pick:{entityId:pick.entityId,selectionContract:pick.selectionContract},authority:'PRESENTATION_ONLY',shadowAuthorities:{camera:snap.shadowCamera,scale:snap.shadowScaleRuntime,selection:snap.shadowSelection},driverEvidence:'FAKE_WEBGL2_API_ONLY'},null,2));

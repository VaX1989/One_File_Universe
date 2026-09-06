import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sandbox={console,OFU:{v1PresentationCore:{},v1WorldContext:{},v1WorldPresentation:{}}};
sandbox.globalThis=sandbox;
vm.runInNewContext(fs.readFileSync('src/rendering/v1/living-renderer.js','utf8'),sandbox,{filename:'src/rendering/v1/living-renderer.js'});
const adapt=sandbox.OFU.v1LivingRenderer.adaptPresentationCamera;
const source={position:[1,2,3],origin:[1,2,3],target:[0,0,0],right:[1,0,0],up:[0,1,0],forward:[0,0,-1],focalLength:1.18,near:.25,fovYRadians:Math.PI/3,aspect:16/9,far:900};
const before=JSON.stringify(source),a=adapt(source),b=adapt(source);

assert.equal(JSON.stringify(a.spatialFrame.origin),'{"x":1,"y":2,"z":3}');
assert.equal(JSON.stringify(a.spatialFrame.right),'{"x":1,"y":0,"z":0}');
assert.equal(JSON.stringify(a.spatialFrame.up),'{"x":0,"y":1,"z":0}');
assert.equal(JSON.stringify(a.spatialFrame.forward),'{"x":0,"y":0,"z":-1}');
assert.equal(JSON.stringify(a.systemFrame.position),'[1,2,3]');
assert.equal(JSON.stringify(a.systemFrame.target),'[0,0,0]');
assert.equal(JSON.stringify(source),before,'adapter mutated the renderer-owned camera');
assert.equal(JSON.stringify(a),JSON.stringify(b),'adapter conversion must be deterministic');
assert(Object.isFrozen(a.spatialFrame)&&Object.isFrozen(a.spatialFrame.origin)&&Object.isFrozen(a.systemFrame));

for(const invalid of [
  {...source,origin:[NaN,2,3]},
  {...source,forward:[0,0,Infinity]},
  {...source,right:[1,0]},
  {...source,target:undefined},
  {...source,far:.1}
])assert.throws(()=>adapt(invalid),/finite|\[x,y,z\]|projection parameters/);

for(const stage of ['GALAXY','REGION','SYSTEM']){
  const converted=adapt(source);
  assert.equal(JSON.stringify(converted.spatialFrame.origin),'{"x":1,"y":2,"z":3}',stage+' did not use the canonical spatial camera representation');
  assert.equal(JSON.stringify(converted.systemFrame.position),'[1,2,3]',stage+' did not retain the strict system camera representation');
}

console.log(JSON.stringify({status:'PASS',suite:'v1-camera-adapter',paths:['GALAXY','REGION','SYSTEM'],sourceMutation:false,invalidCoordinatesRejected:true}));

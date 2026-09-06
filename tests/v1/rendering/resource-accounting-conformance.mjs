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
  landscapeProfile:landscape
}));

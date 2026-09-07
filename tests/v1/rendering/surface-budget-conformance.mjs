import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const sandbox={console,OFU:{}};sandbox.globalThis=sandbox;
vm.runInNewContext(fs.readFileSync('src/rendering/v1/lod-budget.js','utf8'),sandbox,{filename:'src/rendering/v1/lod-budget.js'});
const B=sandbox.OFU.v1RenderBudget;
assert.equal(B.SURFACE_ACCOUNTING.class,'MODELED_BACKING_SURFACE_ACCOUNTING');
assert.equal(B.SURFACE_ACCOUNTING.driverMemoryMeasured,false);
assert.equal(B.SURFACE_ACCOUNTING.gpuMemoryMeasured,false);
assert.equal(B.SURFACE_ACCOUNTING.heapMemoryMeasured,false);
assert.equal(B.SURFACE_ACCOUNTING.framebufferAttachmentsMeasured,false);

const baseline=B.surfacePlan({cssWidth:1280,cssHeight:800,dpr:2,mobile:false});
assert.equal(baseline.width,2560);assert.equal(baseline.height,1600);assert.equal(baseline.pixels,4096000);assert.equal(baseline.constrained,false);
const large=B.surfacePlan({cssWidth:2560,cssHeight:1440,dpr:2,mobile:false});
assert.equal(large.constrained,true);assert.ok(large.effectiveDpr<2);assert.ok(large.pixels<=B.SURFACE_LIMITS.desktopPixels);assert.ok(large.width<=B.SURFACE_LIMITS.maxDimension&&large.height<=B.SURFACE_LIMITS.maxDimension);
assert.equal(large.modeledColorBytes,large.pixels*4);
const mobile=B.surfacePlan({cssWidth:390,cssHeight:844,dpr:3,mobile:true,maxDpr:2});
assert.equal(mobile.requestedDpr,2);assert.equal(mobile.width,780);assert.equal(mobile.height,1688);assert.equal(mobile.constrained,false);assert.ok(mobile.pixels<=B.SURFACE_LIMITS.mobilePixels);
const extreme=B.surfacePlan({cssWidth:10000,cssHeight:6000,dpr:2,mobile:false});
assert.equal(extreme.constrained,true);assert.ok(extreme.pixels<=B.SURFACE_LIMITS.desktopPixels);assert.ok(extreme.width<=B.SURFACE_LIMITS.maxDimension&&extreme.height<=B.SURFACE_LIMITS.maxDimension);
assert.deepEqual(JSON.parse(JSON.stringify(B.surfacePlan({cssWidth:2560,cssHeight:1440,dpr:2,mobile:false}))),JSON.parse(JSON.stringify(large)),'surface plan must be deterministic');

const webgl=fs.readFileSync('src/rendering/v1/webgl2-world.js','utf8');
assert.match(webgl,/v1RenderBudget\?\.surfacePlan/,'shipping WebGL2 resize must consume the shared surface plan');
assert.match(webgl,/surfaceConstraintEvents/,'WebGL surface constraint events must be observable');
assert.match(webgl,/maxSurfacePixels/,'maximum observed WebGL backing pixels must be accounted');
assert.match(webgl,/resourceProfile:profile,surface,admission/,'WebGL render evidence must expose the active surface plan');
assert.doesNotMatch(webgl,/driverMemoryMeasured:true|gpuMemoryMeasured:true/,'surface accounting must not invent driver/GPU telemetry');

const living=fs.readFileSync('src/rendering/v1/living-renderer.js','utf8');
assert.match(living,/v1RenderBudget\.surfacePlan\(/,'shipping Living Canvas2D resize must consume the shared surface plan');
assert.match(living,/g\.setTransform\(plan\.effectiveDpr/,'Canvas2D CSS-coordinate transform must follow the bounded effective backing DPR');
assert.match(living,/resourceProfile:budgetProfile,surface,budget/,'Living renderer evidence must expose the active surface plan');
assert.match(living,/surfaceConstraintEvents/,'Living surface constraint events must be observable');
assert.match(living,/maxSurfacePixels/,'maximum observed Living backing pixels must be accounted');

console.log(JSON.stringify({status:'PASS',suite:'v1-render-surface-budget',baseline,large,mobile,extreme,surfaces:['living-canvas2d','living-webgl2'],authority:'RUNTIME_ACCOUNTING',driverMemoryMeasured:false,gpuMemoryMeasured:false,heapMemoryMeasured:false}));

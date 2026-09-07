import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {loadP5Runtime,canonicalContext} from '../p5/p5-test-helpers.mjs';

globalThis.OFU={};
const O=loadP5Runtime();
for(const file of ['src/rendering/planet-core.js','src/rendering/planet-webgl2.js','src/rendering/planet-surface.js','src/rendering/planet-surface-terrain.js','src/rendering/planet-surface-webgl2.js','src/extensions/contracts.js','src/extensions/registry.js','src/extensions/cross-scale.js','src/extensions/render-backend.js']){
  vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
}

const key={galaxyX:48n,galaxyY:-50n,galaxyZ:-1n,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:61n,siteY:0n,siteZ:0n,orbitSlot:0n};
globalThis.__OFU_PLANET_PREVIEW__={ctx:canonicalContext(O.p3Astronomy),chosen:{key},snapshot:()=>({})};
globalThis.__OFU_PX_TEST_REGIMES__=[JSON.parse(fs.readFileSync('config/extensions/regimes.json','utf8'))];
globalThis.__OFU_PX_TEST_CATALOGS__=['core','v1'].map(name=>JSON.parse(fs.readFileSync(`config/extensions/${name}.json`,'utf8')));
for(const name of ['common','astronomy','planetology','planetology/causal-system','environment/world-system','biology','biology/provider','ecology/query','evolution/history','civilization','society/population','history/system','civilization/foundation','civilization/economy-culture','civilization/politics-conflict','civilization/runtime','microscopic','convergence/world-context','world']){
  const file=`src/domains/v1/${name}.js`;
  vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
}
for(const file of ['src/extensions/product-bindings.js','src/bootstrap/product/scale-runtime.js','src/domains/v1/bindings.js']){
  vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
}
delete globalThis.__OFU_PX_TEST_CATALOGS__;
delete globalThis.__OFU_PX_TEST_REGIMES__;

const R=O.waveIVScaleRuntime,P=O.pxProduct,initial=P.captured(key);
for(const [id,scales] of [['wave-iv-macro',['galaxy','galactic_region','stellar_neighborhood','system']],['planet-webgl',['orbit','approach','global_surface']],['surface-webgl',['regional_surface','local_surface','human']]])R.registerSceneProvider({id,scales,setActive(){}});
R.setSelection(key,{planetId:initial.selection.target.entityId,presentationStatus:'SUPPORTED'});
O.v08SelectionBridge={selectPlanet(k){const captured=P.captured(k);R.setSelection(k,{planetId:captured.selection.target.entityId,presentationStatus:'SUPPORTED'});}};

let cursor=null,candidate=null;
for(let page=0;page<8&&!candidate;page++){
  const result=P.inspect('v1.query.world-candidates',{address:[],cursor,limit:1,filters:{goal:'BIOSPHERE',maxSystemQueries:128,maxWorlds:24}},'DISCOVER').value;
  candidate=result.candidates[0]||null;
  cursor=result.nextCursor;
  if(cursor===null)break;
}
assert(candidate,'microscopic-capable fixture required');
const living=Object.fromEntries(Object.entries(candidate.canonicalKey).map(([name,value])=>[name,BigInt(value)]));
const captured=P.captured(living);
R.setSelection(living,{planetId:captured.selection.target.entityId,presentationStatus:'SUPPORTED'});
R.requestStage('human',{driveCamera:false});

vm.runInThisContext(fs.readFileSync('src/domains/v1/regime-runtime.js','utf8'),{filename:'regime-runtime'});
vm.runInThisContext(fs.readFileSync('src/domains/v1/session.js','utf8'),{filename:'session'});
const actualMR=O.v1ModelRegimeRuntime;
const source=fs.readFileSync('src/domains/v1/session.js','utf8');
const originalSession=O.v1Session;

actualMR.request('tissue');
actualMR.step(-1);
actualMR.step(-1);
actualMR.step(-1);
assert.equal(actualMR.snapshot().regime,'atomic','fixture must reach deepest bounded model regime');
const saved=originalSession.exportBytes();
assert.equal(originalSession.validateBytes(saved).body.modelRegime,'atomic');
actualMR.exit();

let delegatedSteps=0;
O.v1ModelRegimeRuntime=Object.freeze({...actualMR,step(direction){delegatedSteps++;return actualMR.step(direction);}});
vm.runInThisContext(source,{filename:'session-counted-model-restore'});
const countedSession=O.v1Session;
const restored=countedSession.importBytes(saved);
assert.equal(restored.modelRegime,'atomic');
assert.equal(O.v1ModelRegimeRuntime.snapshot().regime,'atomic');
assert.equal(delegatedSteps,3,'atomic restore must use the finite adjacent tissue->cell->molecular->atomic path');
actualMR.exit();

let stalledSteps=0;
O.v1ModelRegimeRuntime=Object.freeze({...actualMR,step(){stalledSteps++;return actualMR.snapshot();}});
vm.runInThisContext(source,{filename:'session-stalled-model-restore'});
const stalledSession=O.v1Session;
const before=stalledSession.snapshot();
assert.throws(()=>stalledSession.importBytes(saved),/model regime restore stalled/,'a non-progressing model runtime must fail closed instead of spinning forever');
const after=stalledSession.snapshot();
assert.equal(stalledSteps,1,'restore must detect non-progress on the first stalled adjacent transition');
assert.equal(O.v1ModelRegimeRuntime.snapshot().mode,'SPATIAL','failed restore must roll model runtime back to spatial mode');
assert.equal(after.imports,before.imports,'failed restore must not increment import telemetry');
assert.equal(after.lastImport,before.lastImport,'failed restore must not fabricate an import record');

O.v1ModelRegimeRuntime=actualMR;
console.log(JSON.stringify({status:'PASS',suite:'v1-model-regime-restore-bounds',validRestoreSteps:delegatedSteps,stalledRestoreSteps:stalledSteps,failedClosed:true,importsAfterRejectedRestore:after.imports}));

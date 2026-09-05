import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
import {loadP5Runtime,canonicalContext} from '../p5/p5-test-helpers.mjs';
globalThis.OFU={};const O=loadP5Runtime();
for(const f of ['src/rendering/planet-core.js','src/rendering/planet-webgl2.js','src/rendering/planet-surface.js','src/rendering/planet-surface-terrain.js','src/rendering/planet-surface-webgl2.js','src/extensions/contracts.js','src/extensions/registry.js','src/extensions/cross-scale.js','src/extensions/render-backend.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const key={galaxyX:48n,galaxyY:-50n,galaxyZ:-1n,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:61n,siteY:0n,siteZ:0n,orbitSlot:0n};
globalThis.__OFU_PLANET_PREVIEW__={ctx:canonicalContext(O.p3Astronomy),chosen:{key},snapshot:()=>({})};
globalThis.__OFU_PX_TEST_REGIMES__=[JSON.parse(fs.readFileSync('config/extensions/regimes.json','utf8'))];
globalThis.__OFU_PX_TEST_CATALOGS__=['core','v1'].map(n=>JSON.parse(fs.readFileSync(`config/extensions/${n}.json`,'utf8')));
for(const f of ['common','astronomy','planetology','biology','civilization','microscopic','world'])vm.runInThisContext(fs.readFileSync(`src/domains/v1/${f}.js`,'utf8'),{filename:f});
for(const f of ['src/extensions/product-bindings.js','src/bootstrap/product/scale-runtime.js','src/domains/v1/bindings.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
delete globalThis.__OFU_PX_TEST_CATALOGS__;delete globalThis.__OFU_PX_TEST_REGIMES__;
const P=O.pxProduct,C=O.pxContracts;let cases=0;const original=C.digest(P.captured().selection);
function page(goal,cursor=null,maxSystemQueries=128,maxWorlds=24){return P.inspect('v1.query.world-candidates',{address:[],cursor,limit:1,filters:{goal,maxSystemQueries,maxWorlds}},'DISCOVER').value}
function discover(goal,maxPages=16){let cursor=null,totalSystems=0,totalWorlds=0,last;for(let i=0;i<maxPages;i++){last=page(goal,cursor);totalSystems+=last.systemQueries;totalWorlds+=last.worldsEvaluated;if(last.candidates.length)return{...last,totalSystems,totalWorlds,pages:i+1};if(last.nextCursor===null)break;cursor=last.nextCursor;}return{...last,totalSystems,totalWorlds,pages:maxPages}}
const sterile=discover('STERILE',2),bioA=discover('BIOSPHERE',6),bioB=discover('BIOSPHERE',6),civA=discover('CIVILIZATION',16),civB=discover('CIVILIZATION',16);
for(const r of [sterile,bioA,civA]){assert.equal(r.boundedSearch,true);assert.equal(r.globalEnumeration,false);assert.equal(r.canonicalP6Unchanged,true);assert(r.systemQueries<=r.maxSystemQueries);assert(r.worldsEvaluated<=r.maxWorlds);assert(r.candidates.length<=1);assert(r.pages<=16);cases+=7;}
assert.equal(sterile.candidates[0].biologyState,'STERILE_MODEL_OUTCOME');assert.equal(sterile.candidates[0].planetIdentity,'9e2041b4c8550e86edc574c42cba1bb31224a2ac7a9e8ffaea232310ce24d98e');cases+=2;
assert.equal(bioA.candidates[0].biologyState,'MODELED_BIOSPHERE');assert.equal(bioA.candidates[0].microscopicAvailable,true);assert.equal(bioA.candidates[0].planetIdentity,'d2b5c1b69d178d27e2f72982701ba6c6f0a1efbfdd0c6749b0a75d389c76a6ba');assert.deepEqual(bioA,bioB);assert(bioA.pages>=1);cases+=5;
assert.equal(civA.candidates[0].civilizationState,'MODELED_CIVILIZATION');assert.equal(civA.candidates[0].biologyState,'MODELED_BIOSPHERE');assert.equal(civA.candidates[0].planetIdentity,'f36ea956862bfb0e1e941cdc7bb239623eaf62109260da960364bc1e199a8ab2');assert.deepEqual(civA,civB);assert(civA.pages>1&&civA.totalSystems<=2048);cases+=5;
for(const candidate of [bioA.candidates[0],civA.candidates[0]]){const k=Object.fromEntries(Object.entries(candidate.canonicalKey).map(([n,v])=>[n,BigInt(v)])),planet=O.p3Astronomy.resolvePlanet(__OFU_PLANET_PREVIEW__.ctx,k);assert.equal(planet.status,'PRESENT');const w=O.v1Providers.worldFor(P.captured(k).selection);assert.equal(w.planetIdentity,candidate.planetIdentity);assert.equal(w.biology.occupancy.state,candidate.biologyState);assert.equal(w.civilization.state,candidate.civilizationState);cases+=4;}
assert.equal(C.digest(P.captured().selection),original);cases++;
assert.throws(()=>page('CIVILIZATION',null,257,24),/system query page cap/);cases++;
assert.throws(()=>P.inspect('v1.query.world-candidates',{address:[],cursor:null,limit:17,filters:{goal:'ANY',maxSystemQueries:32,maxWorlds:16}},'DISCOVER'),/candidate result cap|budget/);cases++;
console.log(JSON.stringify({status:'PASS',suite:'v1-world-discovery',cases,sterile:sterile.candidates[0].planetIdentity,biosphere:bioA.candidates[0].planetIdentity,civilization:civA.candidates[0].planetIdentity,civilizationSearch:{pages:civA.pages,systemQueries:civA.totalSystems,worldsEvaluated:civA.totalWorlds},selectionIdentityPreserved:true,canonicalP6Unchanged:true}));

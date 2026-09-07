import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.OFU={};
for(const f of [
  'src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js',
  'src/domains/v1/astronomy.js','src/domains/v1/astronomy/depth.js','src/domains/v1/astronomy/observability.js'
])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const input={universeId:'universe-v11-neighborhood',galaxyCell:'g:7',regionCell:'r:2',systemAddress:'s:9',stellarOrdinal:0,environmentPpm:610000,radialPpm:430000,heightPpm:140000};
const before=OFU.v1Astronomy.systemBirthContext(input);
vm.runInThisContext(fs.readFileSync('src/domains/v1/astronomy/neighborhood.js','utf8'),{filename:'src/domains/v1/astronomy/neighborhood.js'});
const A=OFU.v1Astronomy,N=OFU.v1GalacticNeighborhood,after=A.systemBirthContext(input),again=A.systemBirthContext(input),n=after.galacticNeighborhood;
assert.deepEqual(after,again);
assert.deepEqual(after.ids,before.ids);assert.deepEqual(after.primary,before.primary);assert.deepEqual(after.multiplicity,before.multiplicity);assert.deepEqual(after.observability,before.observability);
assert.equal(n.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(n.canonicalPromotion,false);assert.equal(n.measured,false);assert.equal(n.probability,false);
assert.equal(n.physicalDensityFieldClaim,false);assert.equal(n.physicalGradientVectorClaim,false);assert.equal(n.bounds.globalEnumeration,false);
assert.equal(n.probes.length,5);assert.ok(n.probes.length<=N.MAX_PROBES);assert.equal(n.bounds.materializedProbes,5);assert.equal(n.deltas.length,4);
assert.deepEqual(n.probes.map(x=>x.label),['CENTER','RADIAL_IN','RADIAL_OUT','PLANEWARD','OFF_PLANE']);
for(const p of n.probes){
  assert.ok(Number.isInteger(p.radialPpm)&&p.radialPpm>=0&&p.radialPpm<=1000000);
  assert.ok(Number.isInteger(p.heightPpm)&&p.heightPpm>=0&&p.heightPpm<=1000000);
  assert.equal(p.canonicalRegionIdentityClaim,false);assert.equal(p.physicalCoordinateClaim,false);
  const sum=p.componentWeightsPpm.disk+p.componentWeightsPpm.bulge+p.componentWeightsPpm.halo;
  assert.equal(sum,1000000);
}
assert.ok(Number.isInteger(n.summary.maxComponentWeightDeltaPpm)&&n.summary.maxComponentWeightDeltaPpm>=0);
assert.ok(Number.isInteger(n.summary.maxAgeDeltaMyr)&&n.summary.maxAgeDeltaMyr>=0);
assert.ok(Number.isInteger(n.summary.maxMetallicityDeltaMilliDex)&&n.summary.maxMetallicityDeltaMilliDex>=0);
assert.ok(['COMBINED_MODELED_GRADIENT','MODELED_COMPONENT_GRADIENT','MODELED_AGE_METALLICITY_GRADIENT','MODELED_LOCAL_STABILITY'].includes(n.summary.neighborhoodClass));
assert.equal(n.researchLineage.researchAuthorityPromoted,false);
const direct=N.summarize(before,input);assert.deepEqual(direct,n);
const edge=A.systemBirthContext({...input,galaxyCell:'g:edge',regionCell:'r:edge',systemAddress:'s:edge',radialPpm:0,heightPpm:1000000}).galacticNeighborhood;
assert.equal(edge.probes.length,5);assert.ok(edge.summary.distinctParameterPoints>=3&&edge.summary.distinctParameterPoints<=5);
assert.ok(edge.probes.every(p=>p.radialPpm>=0&&p.radialPpm<=1000000&&p.heightPpm>=0&&p.heightPpm<=1000000));
const flatBase={...before,galaxy:{...before.galaxy,morphology:'SPHEROID'}};
const flat=N.summarize(flatBase,{radialPpm:500000,heightPpm:500000});assert.equal(flat.probes.length,5);
assert.throws(()=>N.summarize({},input));
console.log(JSON.stringify({status:'PASS',suite:'v1.1 galactic neighborhood context',version:N.VERSION,system:after.ids.stellarSystemIdentity,probes:n.probes.length,class:n.summary.neighborhoodClass}));

import assert from 'node:assert/strict';
import {
  CONTRACT_ID,radiativeEffectiveTemperatureMilliK,globalColumnPressurePa,energyLimitedEscapeUpperBoundKg,
  validateVolatileLedger,transferVolatile,hydrosphereConstraint,sparseGeographyCell,projectChildren,climateEBM,p6BoundaryWitness
} from '../../research/wave-v-planetology-frontier/frontier-research-v1.mjs';

assert.equal(CONTRACT_ID,'ofu-wave-v-planetology-frontier-research-v1');
assert.equal(radiativeEffectiveTemperatureMilliK(1000000n,300000n),254578n);
assert.equal(globalColumnPressurePa(5148000000n,9806650n,6371000n),98977n);
assert.equal(energyLimitedEscapeUpperBoundKg({xuvFluxMilliWm2:1000n,radiusM:6371000n,massKg:5972200000000000000000000n,durationSeconds:31557600000000n}),9647790941222716304n);
let v=validateVolatileLedger({initialInventoryTg:1800n,coreTg:100n,mantleTg:1200n,atmosphereTg:300n,surfaceCondensedTg:200n,lostTg:0n,epistemicStatus:'RESEARCH_FIXTURE',provenance:'fixture:wvb-1'});
v=transferVolatile(v,'mantleTg','atmosphereTg',100n);
v=transferVolatile(v,'atmosphereTg','surfaceCondensedTg',20n);
v=transferVolatile(v,'mantleTg','lostTg',20n);
assert.deepEqual([v.mantleTg,v.atmosphereTg,v.surfaceCondensedTg,v.lostTg,v.accountedInventoryTg],[1080n,380n,220n,20n,1800n]);
assert.throws(()=>transferVolatile(v,'lostTg','atmosphereTg',1n));
const blocked=hydrosphereConstraint({waterSurfaceTg:200n,basinCapacityTg:1000n,temperatureState:{kind:'EFFECTIVE_RADIATIVE_TEMPERATURE'},pressureState:{epistemicStatus:'DERIVED'}});
assert.equal(blocked.oceanAuthorized,false);assert.equal(blocked.reason,'EFFECTIVE_TEMPERATURE_IS_NOT_SURFACE_TEMPERATURE');
const h=hydrosphereConstraint({waterSurfaceTg:160n,basinCapacityTg:1000n,temperatureState:{kind:'SURFACE_TEMPERATURE',epistemicStatus:'HYPOTHETICAL_MODEL_VALUE'},pressureState:{epistemicStatus:'HYPOTHETICAL_MODEL_VALUE'}});
assert.equal(h.waterAreaPpm,160000n);assert.equal(h.oceanAuthorized,false);
const parent=1001n;
const children=[0,1,2,3].map(i=>sparseGeographyCell({planetKey:'fixture-planet',level:1,x:i%2,y:Math.floor(i/2),parentWaterBudgetTg:parent,parentReliefBasis:0}));
assert.deepEqual(children.map(c=>c.waterBudgetTg),[251n,250n,250n,250n]);
const projected=projectChildren(children,parent);assert.equal(projected.waterConserved,true);assert.equal(projected.waterBudgetTg,parent);
const c2=sparseGeographyCell({planetKey:'fixture-planet',level:2,x:2,y:1,parentWaterBudgetTg:577n,parentReliefBasis:250000000});
assert.deepEqual(c2,sparseGeographyCell({planetKey:'fixture-planet',level:2,x:2,y:1,parentWaterBudgetTg:577n,parentReliefBasis:250000000}));
const clim=climateEBM({latitudesDeg:[-60,-20,20,60],initialTemperatureK:[260,280,280,260],annualMeanFluxWm2:[260,390,390,260],bondAlbedo:0.30,longwaveA:-330,longwaveB:2.0,transportWm2K:0.8,heatCapacityJm2K:2.1e8,dtSeconds:86400,steps:3650});
const low=climateEBM({latitudesDeg:[-60,-20,20,60],initialTemperatureK:[260,280,280,260],annualMeanFluxWm2:[260,390,390,260],bondAlbedo:0.34,longwaveA:-330,longwaveB:2.0,transportWm2K:0.8,heatCapacityJm2K:2.1e8,dtSeconds:86400,steps:3650});
const high=climateEBM({latitudesDeg:[-60,-20,20,60],initialTemperatureK:[260,280,280,260],annualMeanFluxWm2:[260,390,390,260],bondAlbedo:0.26,longwaveA:-330,longwaveB:2.0,transportWm2K:0.8,heatCapacityJm2K:2.1e8,dtSeconds:86400,steps:3650});
assert.ok(low.globalMeanTemperatureK<clim.globalMeanTemperatureK&&high.globalMeanTemperatureK>clim.globalMeanTemperatureK);
assert.equal(clim.surfaceTemperatureAuthorized,false);
const p6=p6BoundaryWitness({volatileState:v,climateState:clim});assert.equal(p6.status,'INSUFFICIENT_ENVIRONMENT');assert.equal(p6.canAuthorizeBiology,false);
console.log('WV-B frontier v1 focused tests: PASS');

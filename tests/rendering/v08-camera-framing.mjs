import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {loadP5Runtime,canonicalContext,findPlanet} from '../p5/p5-test-helpers.mjs';

const O=loadP5Runtime();
vm.runInThisContext(fs.readFileSync('src/rendering/planet-core.js','utf8'),{filename:'src/rendering/planet-core.js'});
vm.runInThisContext(fs.readFileSync('src/rendering/planet-framing.js','utf8'),{filename:'src/rendering/planet-framing.js'});
const A=O.p3Astronomy,P5=O.p5Planetology,C=O.planetRenderCore,F=O.planetFraming,ctx=canonicalContext(A),chosen=findPlanet(A,ctx,s=>s.formation.bulkPriorClass==='TERRESTRIAL'&&s.formation.baselineMassMilliEarth>=1000n&&s.formation.baselineMassMilliEarth<=8000n),physical=P5.realizePhysicalPlanet(ctx,P5.adaptP3PlanetaryInputSnapshot(chosen.snapshot)),provider=C.createP5Provider(ctx,physical),radius=Number(physical.physical.meanRadiusM),envelope=C.cameraEnvelope(provider);
const viewports=[[1440,900],[1024,768],[768,1024],[390,844],[320,700],[844,390]],rows=[];
for(const [width,height] of viewports){
 const orbit=F.stageFraming('orbit',{meanRadiusM:radius,presentationBounds:provider.presentationBounds,cameraEnvelope:envelope,viewportWidth:width,viewportHeight:height}),approach=F.stageFraming('approach',{meanRadiusM:radius,presentationBounds:provider.presentationBounds,cameraEnvelope:envelope,viewportWidth:width,viewportHeight:height}),close=F.stageFraming('close',{meanRadiusM:radius,presentationBounds:provider.presentationBounds,cameraEnvelope:envelope,viewportWidth:width,viewportHeight:height});
 assert(Math.abs(orbit.projection.limitingOccupancy-F.ORBIT_OCCUPANCY)<1e-12);assert.equal(orbit.projection.fullLimbExpected,true);assert(Math.abs(approach.projection.limitingOccupancy-F.APPROACH_OCCUPANCY)<1e-12);assert.equal(approach.projection.fullLimbExpected,true);assert(approach.projection.limitingOccupancy>=.65&&approach.projection.limitingOccupancy<=.80);assert(close.distanceM>=envelope.minDistanceM);assert.equal(close.projection.fullLimbExpected,false);
 const legacy=F.projectedSphere({sphereRadiusM:provider.presentationBounds.maxRadiusM,distanceM:radius*1.35,aspect:width/height,verticalFovDeg:F.VERTICAL_FOV_DEG});assert(legacy.limitingOccupancy>1);assert.equal(legacy.fullLimbExpected,false);
 rows.push({viewport:[width,height],orbitDistanceRadii:orbit.distanceM/radius,orbitOccupancy:orbit.projection.limitingOccupancy,approachDistanceRadii:approach.distanceM/radius,approachOccupancy:approach.projection.limitingOccupancy,closeDistanceRadii:close.distanceM/radius,legacy135Occupancy:legacy.limitingOccupancy,horizontalFovDeg:approach.projection.horizontalFovDeg});
}
const landscape=rows.find(r=>r.viewport[0]===1440),portrait=rows.find(r=>r.viewport[0]===390);assert(portrait.approachDistanceRadii>landscape.approachDistanceRadii,'portrait limiting horizontal FOV must move projection-aware Approach farther away');
const sameA=F.stageFraming('approach',{meanRadiusM:radius,presentationBounds:provider.presentationBounds,cameraEnvelope:envelope,viewportWidth:390,viewportHeight:844}),sameB=F.stageFraming('approach',{meanRadiusM:radius,presentationBounds:provider.presentationBounds,cameraEnvelope:envelope,viewportWidth:390,viewportHeight:844});assert.equal(sameA.distanceM,sameB.distanceM,'presentation framing must not depend on DPR or render-buffer resolution');
console.log(JSON.stringify({status:'PASS',authority:F.AUTHORITY,verticalFovDeg:F.VERTICAL_FOV_DEG,orbitOccupancy:F.ORBIT_OCCUPANCY,approachOccupancy:F.APPROACH_OCCUPANCY,presentationBounds:provider.presentationBounds,cameraEnvelope:envelope,viewports:rows,legacy135RejectedAsWholeWorld:true,dprIndependentByContract:true},null,2));

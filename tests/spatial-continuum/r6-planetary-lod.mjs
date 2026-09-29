import assert from 'node:assert/strict';
import {
  CUBE_EDGES,
  CUBE_FACES,
  cubeFaceUvToDirection,
  cubeSphereTileEdgeNeighbor,
  cubeSphereTileNeighbors,
  planetaryPatchPlan,
  sampledPlanetaryPatchError
} from '../../src/experiments/spatial-continuum/planetary-topology.js';
import { createPlanetaryTerrainSampler } from '../../src/experiments/spatial-continuum/terrain-field.js';

let adjacencyChecks=0,crossFaceChecks=0;
const subtract=(a,b)=>a.map((value,index)=>value-b[index]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((sum,value,index)=>sum+value*b[index],0);
for(const face of CUBE_FACES){const a=cubeFaceUvToDirection(face,-1,-1),b=cubeFaceUvToDirection(face,1,-1),c=cubeFaceUvToDirection(face,-1,1);assert.ok(dot(cross(subtract(b,a),subtract(c,a)),a)>0,`${face} cube-sphere winding must face away from the body`)}
for(const face of CUBE_FACES)for(let level=0;level<=5;level++){
  const side=2**level,corners=[[0,0],[side-1,0],[0,side-1],[side-1,side-1]];
  for(const [x,y] of corners)for(const edge of CUBE_EDGES){
    const tile={face,level,x,y},neighbor=cubeSphereTileEdgeNeighbor(tile,edge);adjacencyChecks++;
    assert.notEqual(neighbor.id,`${face}:${level}:${x}:${y}`,'an edge neighbor must never resolve to itself');
    assert.ok(cubeSphereTileNeighbors(neighbor).some(candidate=>candidate.id===`${face}:${level}:${x}:${y}`),'cross-face adjacency must be reciprocal');
    if(neighbor.face!==face)crossFaceChecks++;
  }
}

const radiusM=6371000,tile={face:'PX',level:5,x:11,y:17},flat=sampledPlanetaryPatchError(tile,{radiusM,segments:12,heightAt:()=>0,verticalExaggeration:6}),rugged=sampledPlanetaryPatchError(tile,{radiusM,segments:12,heightAt:direction=>direction[0]*direction[1]*direction[2]*140000,verticalExaggeration:6});
assert.equal(flat.contentAware,true);assert.equal(flat.terrainResidualM,0);assert.ok(rugged.terrainResidualM>flat.terrainResidualM);assert.ok(rugged.geometricErrorM>flat.geometricErrorM);

const terrainHeight=createPlanetaryTerrainSampler({radiusM,seed:'r6-content-aware-lod',minimumWavelengthM:radiusM*.015,profile:{planetaryAmplitudeM:980,macroAmplitudeM:740,ridgeAmplitudeM:410,craterAmplitudeM:520,basinAmplitudeM:330,fractureAmplitudeM:240,structuralWeights:{crater:.82,ridge:.61,basin:.34,fracture:.48,smooth:.12}}}),errorCache=new Map(),errorFor=patch=>{let value=errorCache.get(patch.id);if(!value){value=sampledPlanetaryPatchError(patch,{radiusM,segments:12,heightAt:terrainHeight,verticalExaggeration:6});errorCache.set(patch.id,value)}return value},results=[];
for(const cameraBodyFixedUnit of [[1,0,0],[1,1,0],[1,1,1],[-1,.08,1]]){
  const options={cameraBodyFixedUnit,cameraAltitudeM:12000,radiusM,verticalFovRadians:.62,viewportHeightPx:900,targetErrorPx:4,maxPatches:96,geometricErrorForPatch:errorFor},first=planetaryPatchPlan(options),second=planetaryPatchPlan(options);assert.deepEqual(first,second,'planetary refinement must be deterministic');assert.equal(first.contentAwareError,true);assert.equal(first.neighborConstrained,true);assert.ok(first.neighborLevelDelta<=1);assert.ok(first.activePatchCount<=first.maxPatches);assert.ok(first.maximumGeometricErrorM>0);assert.ok(first.patches.every(patch=>patch.geometricErrorSource==='SAMPLED_TERRAIN_RESIDUAL_PLUS_SPHERE_CHORD'));if(cameraBodyFixedUnit.filter(value=>value!==0).length>1)assert.ok(first.crossFaceNeighborChecks>0,'edge/corner views must exercise cross-face topology');results.push({cameraBodyFixedUnit,activePatches:first.activePatchCount,levels:first.levels,neighborLevelDelta:first.neighborLevelDelta,crossFaceNeighborChecks:first.crossFaceNeighborChecks,balanceRefinements:first.neighborBalanceRefinements,maximumGeometricErrorM:first.maximumGeometricErrorM,maximumTerrainResidualM:first.maximumTerrainResidualM})
}

console.log(JSON.stringify({status:'PASS',suite:'spatial-continuum-r6-planetary-lod',adjacencyChecks,crossFaceChecks,contentError:{flat,rugged},cacheEntries:errorCache.size,results},null,2));

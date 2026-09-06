import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const ROOT=path.resolve(import.meta.dirname,'../..');
for(const file of ['src/v1x-06-surface-human-rendering/math-frame.js','src/v1x-06-surface-human-rendering/terrain-lod.js'])vm.runInThisContext(fs.readFileSync(path.join(ROOT,file),'utf8'),{filename:file});
const F=globalThis.OFU.v1x06SurfaceFrame,T=globalThis.OFU.v1x06TerrainLod;
for(const face of F.FACE_NAMES)for(const [u,v] of [[0,0],[.6,-.4],[-.95,.82]]){const q=F.unitToFaceUv(F.faceUvToUnit(face,u,v));assert.equal(q.face,face);assert.ok(Math.abs(q.u-u)<1e-12);assert.ok(Math.abs(q.v-v)<1e-12)}
const frame=F.localFrame({planetRadiusMeters:6371000,face:'PZ',u:.2,v:-.3,sourceAuthority:'MODEL_DERIVED_SIMULATION'}),precision=F.precisionWitness(frame);assert.ok(precision.maxRoundTripErrorMeters<1e-6);assert.equal(frame.claims.referenceFrameCanonical,false);
for(const edge of ['N','S','E','W'])assert.ok(F.neighborTile('PX',3,7,4,edge).key);assert.equal(F.neighborTile('PX',3,7,4,'E').crossFace,true);const edgeSelection=T.selectTerrain({planetRadiusMeters:6371000,anchor:{face:'PX',u:.999,v:0},altitudeMeters:50000,viewportHeightPx:900,maxTiles:9,maxLevel:3,minLevel:3});assert.ok(T.seamWitness(edgeSelection).crossFaceEdges>0);
assert.ok(T.desiredLevel({planetRadiusMeters:6371000,altitudeMeters:100,viewportHeightPx:900})>T.desiredLevel({planetRadiusMeters:6371000,altitudeMeters:1000000,viewportHeightPx:900}));
const selection=T.selectTerrain({planetRadiusMeters:6371000,anchor:{face:'PZ',u:0,v:0},altitudeMeters:1200,viewportHeightPx:900,maxTiles:25,maxLevel:8,waterAreaPpm:700000,iceAreaPpm:50000});const seam=T.seamWitness(selection);assert.ok(selection.tiles.length<=25);assert.equal(seam.allEdgesAccounted,true);assert.ok(selection.tiles.every(t=>t.claims.proceduralReliefPhysical===false));
const cache=T.createTileCache({maxTiles:2,maxBytes:2000});for(const tile of selection.tiles.slice(0,3))cache.touch(tile,900);const cacheWitness=cache.snapshot();assert.ok(cacheWitness.entries<=2);assert.ok(cacheWitness.bytes<=2000);
console.log(JSON.stringify({schema:'ofu-v1x-06-frame-terrain-test-1',status:'PASS',precisionMaxErrorMeters:precision.maxRoundTripErrorMeters,terrainTiles:selection.tiles.length,seam,cache:cacheWitness}));

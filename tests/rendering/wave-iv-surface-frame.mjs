import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
globalThis.OFU={};
vm.runInThisContext(fs.readFileSync('src/rendering/planet-core.js','utf8'));
vm.runInThisContext(fs.readFileSync('src/rendering/planet-surface.js','utf8'));
const S=globalThis.OFU.planetSurface;
const provider={planetId:'planet-test',physical:{physical:{meanRadiusM:6371000},upstreamBaseline:{formation:{bulkPriorClass:'TERRESTRIAL'}}},presentationBounds:{minRadiusM:6371000,maxRadiusM:6400000}};
const cap=S.surfaceCapability({planetId:'planet-test',provider});assert.equal(cap.available,true);assert.equal(cap.claims.physicalTerrainElevationClaim,false);
for(const bodyClass of ['GAS_GIANT','ICE_GIANT']){const unsupported=S.surfaceCapability({planetId:'x',bodyClass});assert.equal(unsupported.available,false);assert.equal(unsupported.reason,'NO_SUPPORTED_SOLID_LOCAL_SURFACE')}
const anchor=S.createAnchor({planetId:'planet-test',radiusM:6371000,viewDirection:[.3,.4,.8660254038]});assert.equal(anchor.planetId,'planet-test');assert.equal(anchor.basis.handedness,'RIGHT_HANDED');assert.equal(anchor.claims.canonicalGeodesyClaim,false);const e=anchor.basis.east,n=anchor.basis.north,u=anchor.basis.up;const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];for(const v of [e,n,u])assert.ok(Math.abs(dot(v,v)-1)<1e-12);for(const [a,b] of [[e,n],[e,u],[n,u]])assert.ok(Math.abs(dot(a,b))<1e-12);
const local=[1234.5,-987.25,42],global=S.globalFromLocal(anchor,local),roundtrip=S.localFromGlobal(anchor,global);for(let i=0;i<3;i++)assert.ok(Math.abs(local[i]-roundtrip[i])<1e-6);
const h=S.handoffFromGlobe({planetId:'planet-test',provider,camera:{direction:[.3,.4,.8660254038]}});assert.equal(h.ready,true);assert.equal(h.planetId,'planet-test');assert.equal(h.entry.preservesCanonicalIdentity,true);assert.equal(h.anchor.token,anchor.token);
const camera=S.createLocalCamera(anchor,{presentationAltitudeM:80});assert.equal(S.localCameraSnapshot(camera).currentBand,'HUMAN');camera.absoluteLocalMm[0]=900000n;const rebased=S.rebaseFloatingOrigin(camera);assert.equal(rebased.rebased,true);assert.ok(Math.abs(Number(rebased.relativeMm[0]))<=500);assert.equal(camera.planetId,'planet-test');
const before=S.localCameraSnapshot(camera);S.applyLocalIntent(camera,{type:'MOVE_FORWARD',amount:2},{moveStepM:3});const after=S.localCameraSnapshot(camera);assert.equal(after.planetId,before.planetId);assert.notDeepEqual(after.absolutePresentationPositionM,before.absolutePresentationPositionM);
assert.equal(S.bandForAltitude(50),'HUMAN');assert.equal(S.bandForAltitude(500),'LOCAL_SURFACE');assert.equal(S.bandForAltitude(10000),'REGIONAL_SURFACE');assert.equal(S.bandForAltitude(100000),'GLOBAL_SURFACE');
const runtime=S.createSurfaceProvider({planetId:'planet-test',provider,camera:{direction:[0,0,1]}});assert.equal(runtime.snapshot().surfaceAvailability,'AVAILABLE');const entered=runtime.enter([.2,.3,.93]);assert.equal(entered.mode,'LOCAL');assert.equal(entered.planetId,'planet-test');assert.equal(entered.handoffReady,false);const reverse=runtime.leave();assert.equal(reverse.planetId,'planet-test');assert.equal(reverse.to,'PLANET_APPROACH');assert.equal(reverse.preservesCanonicalIdentity,true);
for(const key of ['geologyClaim','hydrologyClaim','vegetationClaim','biosphereClaim','physicalTerrainElevationClaim','canonicalGeodesyClaim','canonicalSurfaceAnchorClaim'])assert.equal(S.CLAIMS[key],false);
console.log(JSON.stringify({status:'PASS',version:S.VERSION,anchor:anchor.token,bands:S.SURFACE_BANDS,floatingOriginThresholdMm:String(S.DEFAULT_FLOATING_ORIGIN_THRESHOLD_MM),claims:S.CLAIMS}));

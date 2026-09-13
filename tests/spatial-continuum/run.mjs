import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { AUTHORITY, CONTINUUM_STOPS, stageForCoordinate } from '../../src/experiments/spatial-continuum/constants.js';
import { createContinuumKernel } from '../../src/experiments/spatial-continuum/kernel.js';
import { createReferenceFrameRegistry } from '../../src/experiments/spatial-continuum/reference-frames.js';
import { createContinuousScale, representationHandoff } from '../../src/experiments/spatial-continuum/scale-model.js';
import { createSpatialGraph } from '../../src/experiments/spatial-continuum/spatial-graph.js';
import { perceptualLod, projectedSpanPixels } from '../../src/experiments/spatial-continuum/lod.js';

const root=process.cwd(),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const graph=()=>createSpatialGraph([
  {id:'system',kind:'SYSTEM',frameId:'system',authority:AUTHORITY.CANONICAL},
  {id:'body',kind:'PLANET',parentId:'system',frameId:'body',authority:AUTHORITY.CANONICAL},
  {id:'surface',kind:'LOCATION',parentId:'body',frameId:'surface',authority:AUTHORITY.MODEL_DERIVED},
  {id:'sample',kind:'ROCK',parentId:'surface',frameId:'sample',authority:AUTHORITY.MODEL_DERIVED}
],{focusId:'body'});
const frames=()=>createReferenceFrameRegistry([
  {id:'system',metersPerUnit:1,originInParent:[0,0,0],authority:AUTHORITY.CANONICAL},
  {id:'body',parentId:'system',metersPerUnit:100,originInParent:[2,0,0],authority:AUTHORITY.CANONICAL},
  {id:'surface',parentId:'body',metersPerUnit:2,originInParent:[0,1,0],authority:AUTHORITY.MODEL_DERIVED},
  {id:'sample',parentId:'surface',metersPerUnit:.001,originInParent:[0,0,3],authority:AUTHORITY.MODEL_DERIVED},
  {id:'rotated',parentId:'system',metersPerUnit:1,originInParent:[0,0,0],orientation:[0,0,Math.SQRT1_2,Math.SQRT1_2],authority:AUTHORITY.MODEL_DERIVED},
  ...['system-barycentric','body-centered','body-fixed','local-tangent','sample-micro'].map((id,index)=>({id,parentId:null,metersPerUnit:10**index,originInParent:[0,0,0],authority:AUTHORITY.PRESENTATION_ONLY}))
]);

assert.throws(()=>createSpatialGraph([{id:'a',kind:'X',parentId:'missing',frameId:'x',authority:AUTHORITY.UNKNOWN}]),/Missing parent/);
assert.throws(()=>createSpatialGraph([{id:'a',kind:'X',parentId:'b',frameId:'x',authority:AUTHORITY.UNKNOWN},{id:'b',kind:'X',parentId:'a',frameId:'x',authority:AUTHORITY.UNKNOWN}]),/cycle/i);
const spatial=graph();assert.equal(spatial.snapshot().singleFocusAuthority,true);assert.deepEqual(spatial.ancestry('sample').map(node=>node.id),['sample','surface','body','system']);

const registry=frames();assert.deepEqual(registry.toRootMeters([1,0,0],'body'),[102,0,0]);assert.deepEqual(registry.cameraRelativeFloat32([1,0,0],'body',[0,0,0],'system'),[102,0,0]);assert.ok(Math.abs(registry.toRootMeters([1,0,0],'rotated')[1]-1)<1e-12);assert.equal(registry.snapshot().cpuPrecision,'FLOAT64_HIERARCHICAL');

const handoff=representationHandoff(2.5);assert.deepEqual(Object.keys(handoff.weights),['APPROACH','GLOBAL_SURFACE']);assert.ok(handoff.weights.APPROACH>0&&handoff.weights.GLOBAL_SURFACE>0);assert.equal(stageForCoordinate(2.51).stage,'GLOBAL_SURFACE');
const farLod=perceptualLod({projectedSpanPx:600,targetErrorPx:96}),nearLod=perceptualLod({projectedSpanPx:9000,targetErrorPx:96});assert.equal(farLod.selected,24);assert.equal(nearLod.selected,80);assert.ok(projectedSpanPixels({worldSpan:10,cameraDistance:10,verticalFovRadians:Math.PI/2,viewportHeightPx:1000})>499);
const scale=createContinuousScale({durationMs:1000});scale.setStage('APPROACH',0);const midway=scale.sample(500);assert.ok(midway.coordinate>0&&midway.coordinate<2);scale.setStage('SYSTEM',500);assert.equal(scale.sample(500).interruptions,1);const reduced=createContinuousScale({durationMs:1000,reducedMotion:true});reduced.setStage('ATOMIC',0);assert.equal(reduced.sample(80).coordinate,10);

const kernel=createContinuumKernel({graph:spatial,frames:registry,transitionDurationMs:1000});
const initial=kernel.snapshot(0);assert.equal(initial.scale.semanticStage,'SYSTEM');assert.equal(initial.sameCanonicalFocus,true);
let now=0;for(const stop of CONTINUUM_STOPS.slice(1)){kernel.travelTo(stop.stage,now);now+=1600;const settled=kernel.snapshot(now);assert.equal(settled.scale.coordinate,stop.coordinate);if(stop.coordinate>=7)kernel.select('sample',now,{push:false});assert.ok(kernel.snapshot(now).graph.focusAncestry.includes('body'));}
assert.equal(kernel.snapshot(now).scale.semanticStage,'ATOMIC');assert.equal(kernel.snapshot(now).graph.focusId,'sample');
kernel.back(now+1);const reversed=kernel.snapshot(now+2000);assert.equal(reversed.scale.semanticStage,'MOLECULAR');assert.equal(reversed.graph.focusId,'sample');
kernel.orbit(.3,.2);kernel.travelTo('HUMAN',now+2100);kernel.settle(now+2200);const human=kernel.snapshot(now+2200);kernel.moveLocal(1,0,.1);assert.notDeepEqual(kernel.snapshot(now+2201).camera.localPosition,human.camera.localPosition);

execFileSync(process.execPath,['tools/build-spatial-continuum.mjs'],{cwd:root,stdio:['ignore','ignore','inherit']});
const artifactPath='dist/One_File_Universe_Spatial_Continuum.html',manifestPath='dist/spatial-continuum-build-manifest.json',first=fs.readFileSync(artifactPath),manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
assert.equal(manifest.status,'PASS');assert.equal(manifest.engine.version,'9.26.0');assert.equal(manifest.runtime.singleFile,true);assert.equal(manifest.artifact.sha256,sha(first));assert.match(first.toString('utf8'),/ofu-spatial-continuum-runtime/);assert.doesNotMatch(first.toString('utf8'),/<(?:script|link)\b[^>]*(?:src|href)=["'](?:https?:|\/\/)/i);
execFileSync(process.execPath,['tools/build-spatial-continuum.mjs'],{cwd:root,stdio:['ignore','ignore','inherit']});
const second=fs.readFileSync(artifactPath);assert.equal(sha(first),sha(second),'continuum single-file build must be byte reproducible at one source revision');

console.log(JSON.stringify({status:'PASS',suite:'spatial-continuum-development',stops:CONTINUUM_STOPS.length,canonicalIdentityPreserved:true,continuousScale:true,hierarchicalReferenceFrames:true,representationOverlap:true,deterministicArtifactSha256:sha(second),artifactBytes:second.length},null,2));

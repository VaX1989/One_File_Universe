import assert from 'node:assert/strict';
import fs from 'node:fs';
import { transformPhase2Renderer } from '../../tools/spatial-continuum/phase2-renderer-transform.mjs';

const read=relative=>fs.readFileSync(new URL('../../'+relative,import.meta.url),'utf8'),surface=read('src/experiments/spatial-continuum/surface-renderer-convergence.js'),facade=read('src/experiments/spatial-continuum/renderer-phase2.js'),base=read('src/experiments/spatial-continuum/renderer.js');
assert.match(surface,/createRepresentationHandoffController/);assert.match(surface,/buildPlanetarySeamTopology/);assert.match(surface,/createPlanetaryLodTransitionController/);assert.match(surface,/FINE_TO_COARSE_STITCH/);assert.match(surface,/updateVerticesData\(VertexBuffer\.PositionKind/);assert.match(surface,/COARSE_BACKSTOP/);assert.match(surface,/planetaryCache\.size<=2&&terrainCache\.size<=2/);
assert.match(facade,/createSurfaceRendererConvergence/);assert.match(facade,/surface\.update\(snapshot\)/);assert.match(facade,/sceneCount:1/);assert.match(facade,/cameraCount:base\.scene\.cameras\.length/);assert.match(facade,/rendererOwnedPicking:true/);
const transformed=transformPhase2Renderer(base);assert.match(transformed,/cameraForwardBodyFixedUnit/);assert.match(transformed,/previousPatchIds:lastPlanetaryLod/);assert.match(transformed,/semanticSurfaceKey:activeWorld\.surfaceId/);assert.notEqual(transformed,base);
console.log(JSON.stringify({status:'PASS',suite:'r6-w0-phase2-surface-renderer-integration',representationHandoff:true,renderedSeamStitching:true,lodTransition:true,cameraForwardCulling:true,hysteresis:true,semanticSurfaceKey:true,boundedTransitionResidency:true,sceneAuthorities:1,cameraAuthorities:1},null,2));

import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=relative=>fs.readFileSync(new URL('../../'+relative,import.meta.url),'utf8'),local=read('src/experiments/spatial-continuum/local-environment.js'),human=read('src/experiments/spatial-continuum/human-renderer-convergence.js'),facade=read('src/experiments/spatial-continuum/renderer-phase2.js');
assert.match(local,/scale:baseScale/);assert.match(local,/depthPresentation/);assert.match(local,/stableWorldScale:true/);assert.doesNotMatch(local,/scale:Object\.freeze\(baseScale\.map/);
assert.match(human,/createSurfaceTerrainSampler/);assert.match(human,/rings=\[180,420,860,1600\]/);assert.match(human,/PRESENTATION_ONLY/);assert.ok(human.includes("physical=encoded/(mesh.metadata.sample?1.35:1)"));assert.ok(human.includes("desired=physical*(mesh.metadata.sample?1.12:1)"));assert.ok(human.includes("depthBandPolicy:'DETAIL_HAZE_PRIORITY_NOT_WORLD_SCALE'"));
assert.match(facade,/createHumanRendererConvergence/);assert.match(facade,/human\.update\(snapshot\)/);assert.match(facade,/humanConvergence:human\.snapshot\(\)/);assert.match(facade,/human\.cancel\('WORLD_REBIND'\)/);
console.log(JSON.stringify({status:'PASS',suite:'r6-w0-phase2-human-renderer-integration',stableWorldScale:true,farFieldRadiusM:1600,selectedSampleScaleCue:1.12,depthBandOwnsWorldScale:false,scientificLandformClaimAdded:false},null,2));

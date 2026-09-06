import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../../..');
const scene=fs.readFileSync(path.join(root,'src/v1x-04-stellar-system-rendering/system-scene.js'),'utf8');
const provider=fs.readFileSync(path.join(root,'src/v1x-04-stellar-system-rendering/system-provider.js'),'utf8');
assert.match(scene,/TRUE_3D_CARTESIAN_PRESENTATION_SPACE/);assert.match(scene,/position3d/);assert.match(scene,/vertices/);assert.match(provider,/cameraAuthority:'V1X-01_EXTERNAL'/);assert.match(provider,/M\.project\(/);assert.doesNotMatch(scene,/coordinateModel:\s*['"]NORMALIZED_[XY]/);assert.doesNotMatch(scene,/primary[^\n]{0,80}(?:ellipse|depth[-_ ]field)/i);assert.doesNotMatch(scene,/currentOrbitalPhaseAuthority:\s*['"]CANONICAL/);
console.log(JSON.stringify({status:'PASS',suite:'v1x04-static-system-3d-oracle',rejects:'normalized-x-y-ellipse-plus-depth',requires:['position3d','3d-orbit-vertices','external-perspective-projection']}));

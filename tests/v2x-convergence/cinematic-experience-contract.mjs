import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const manifest=JSON.parse(fs.readFileSync('config/components/v2-cinematic-experience.json','utf8'));
assert.equal(manifest.schema,'ofu-components-1');
assert.equal(manifest.components.length,4);
for(const component of manifest.components)assert.equal(component.authority,'PRESENTATION_ONLY',component.id+' must remain presentation-only');

const experience=fs.readFileSync('src/cinematic/v2/experience.js','utf8');
const depth=fs.readFileSync('src/cinematic/v2/depth-compositor.js','utf8');
const css=fs.readFileSync('src/cinematic/v2/experience.css','utf8')+fs.readFileSync('src/cinematic/v2/depth-compositor.css','utf8');
new vm.Script(experience,{filename:'experience.js'});
new vm.Script(depth,{filename:'depth-compositor.js'});
for(const forbidden of ['runtime.scale(','runtime.back(','runtime.deeper(','runtime.activate(','enterSystem(','enterBody(','selectObject(','history.push(','fetch(','XMLHttpRequest','WebSocket']){
 assert.equal(experience.includes(forbidden),false,'cinematic observer must not own semantic/network operation '+forbidden);
 assert.equal(depth.includes(forbidden),false,'depth compositor must not own semantic/network operation '+forbidden);
}
assert.match(experience,/prefers-reduced-motion: reduce/);
assert.match(experience,/semanticMutation:false/);
assert.match(experience,/cameraAuthority:false/);
assert.match(experience,/navigationAuthority:false/);
assert.match(depth,/maxStars:42/);
assert.match(depth,/continuousAnimation:false/);
assert.match(depth,/networkResources:0/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(css,/forced-colors:active/);
assert.match(css,/safe-area-inset-bottom/);
assert.match(css,/#living-view:focus-visible/);

const shaderSource=fs.readFileSync('src/shaders/v1/world-shaders.js','utf8');
const sandbox={OFU:{}};vm.createContext(sandbox);vm.runInContext(shaderSource,sandbox,{filename:'world-shaders.js'});
assert.equal(sandbox.OFU.v1WorldShaders.authority,'PRESENTATION_ONLY');
assert.equal(sandbox.OFU.v1WorldShaders.claims.proceduralSurfaceIsCanonical,false);
assert.equal(sandbox.OFU.v1WorldShaders.claims.atmosphereIsMeasuredOpticalDepth,false);
assert.equal(sandbox.OFU.v1WorldShaders.claims.specularCueIsMeasuredBRDF,false);
assert.match(sandbox.OFU.v1WorldShaders.globeFragment,/fresnel/);
assert.match(sandbox.OFU.v1WorldShaders.globeFragment,/oceanLike/);

console.log('V2 cinematic experience contract: PASS');

import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const manifest=JSON.parse(fs.readFileSync('config/components/v2-cinematic-experience.json','utf8'));
assert.equal(manifest.schema,'ofu-components-1');
assert.equal(manifest.components.length,5);
for(const component of manifest.components)assert.equal(component.authority,'PRESENTATION_ONLY',component.id+' must remain presentation-only');
const macroComponent=manifest.components.find(component=>component.id==='v2.cinematic.macro-director');
assert(macroComponent,'macro director must ship');
assert(macroComponent.dependencies.includes('v2x02.camera.living-binding'),'macro director must compose over authoritative Living camera');
assert(macroComponent.dependencies.includes('v1x02.spatial-universe.runtime'));
assert(macroComponent.dependencies.includes('v1x04.system.provider'));

const experience=fs.readFileSync('src/cinematic/v2/experience.js','utf8');
const depth=fs.readFileSync('src/cinematic/v2/depth-compositor.js','utf8');
const macro=fs.readFileSync('src/cinematic/v2/macro-director.js','utf8');
const css=fs.readFileSync('src/cinematic/v2/experience.css','utf8')+fs.readFileSync('src/cinematic/v2/depth-compositor.css','utf8');
new vm.Script(experience,{filename:'experience.js'});
new vm.Script(depth,{filename:'depth-compositor.js'});
new vm.Script(macro,{filename:'macro-director.js'});
for(const forbidden of ['runtime.scale(','runtime.back(','runtime.deeper(','runtime.activate(','enterSystem(','enterBody(','selectObject(','history.push(','fetch(','XMLHttpRequest','WebSocket']){
 assert.equal(experience.includes(forbidden),false,'cinematic observer must not own semantic/network operation '+forbidden);
 assert.equal(depth.includes(forbidden),false,'depth compositor must not own semantic/network operation '+forbidden);
 assert.equal(macro.includes(forbidden),false,'macro director must not own semantic/network operation '+forbidden);
}
assert.match(experience,/prefers-reduced-motion: reduce/);
assert.match(experience,/semanticMutation:false/);
assert.match(experience,/cameraAuthority:false/);
assert.match(experience,/navigationAuthority:false/);
assert.match(experience,/MATERIAL:'MICRO'/);
assert.match(experience,/MICROSTRUCTURE:'MICRO'/);
assert.match(depth,/MAX_PIXELS=1500000/);
assert.match(depth,/maxStars:42/);
assert.match(depth,/maxSurfacePixels:MAX_PIXELS/);
assert.match(depth,/continuousAnimation:false/);
assert.match(depth,/networkResources:0/);
assert.match(macro,/renderer\.cameraAuthority\?\.snapshot/);
assert.match(macro,/cameraComposition\.orientationAngles/);
assert.match(macro,/semanticMutation:false/);
assert.match(macro,/cameraAuthority:false/);
assert.match(macro,/networkResources:0/);
assert.match(macro,/labelSlots/);
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

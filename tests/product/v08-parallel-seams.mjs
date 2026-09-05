import './startup-selection.mjs';
import fs from 'node:fs';
import {composeProductTemplate} from '../../tools/product-template-compose.mjs';

const read=path=>fs.readFileSync(path,'utf8').replace(/\r\n?/g,'\n');
const count=(source,token)=>source.split(token).length-1;
const fragments=[
 ['src/bootstrap/product/workspace-nav.html','data-workspace="explore"'],
 ['src/bootstrap/product/viewport.html','id="planet-view"'],
 ['src/bootstrap/product/explore-panel.html','data-workspace-panel="explore"'],
 ['src/bootstrap/product/inspect-panel.html','data-workspace-panel="inspect"'],
 ['src/bootstrap/product/lab-panel.html','data-workspace-panel="lab"']
];
const extensions=[
 'src/bootstrap/product/selection-bridge.js',
 'src/bootstrap/product/explore-navigation.js',
 'src/bootstrap/product/inspector-product.js',
 'src/bootstrap/product/mobile-interaction.js',
 'src/bootstrap/product/lab-technical.js',
 'src/bootstrap/product/mobile.css'
];
const required=[...fragments.map(([path])=>path),...extensions];
for(const path of required){
 if(!fs.existsSync(path))throw new Error('missing v0.8 product seam '+path);
 if(read(path).trim().length===0)throw new Error('empty v0.8 product seam '+path);
}

const template=read('src/bootstrap/ofu-template.html');
const composed=composeProductTemplate(template,read);
for(const [path,marker] of fragments){
 const source=read(path).trimEnd();
 if(!composed.includes(source))throw new Error('composed template does not contain owned fragment '+path);
 if(count(composed,marker)!==1)throw new Error('composed template marker must remain unique: '+marker);
}
if(count(composed,'id="planet-view"')!==1)throw new Error('viewport composition duplicated the canonical presentation canvas');
if(count(composed,'data-workspace-panel=')!==3)throw new Error('Explore / Inspect / Lab workspace composition drifted');

const build=read('tools/build-ofu-rendering-v08.mjs');
for(const path of required)if(!build.includes(path))throw new Error('v0.8 build does not compose declared product source '+path);
if(!/build-ofu-rendering\.mjs/.test(build))throw new Error('v0.8 build must retain the certified rendering build as its canonical runtime foundation');
if(build.indexOf('selection-bridge.js')>build.indexOf('explore-navigation.js'))throw new Error('selection bridge must initialize before Explore navigation');

for(const path of extensions.filter(path=>path.endsWith('.js'))){
 const source=read(path);
 if(/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/.test(source))throw new Error('product lane extension introduced a network runtime dependency: '+path);
}
const bridge=read('src/bootstrap/product/selection-bridge.js');
if(!/authority:'SELECTION_ONLY'/.test(bridge)||!/O\.inspectorTest/.test(bridge)||!/\.retarget\(/.test(bridge))throw new Error('central selection bridge contract drifted');
if(/realizePhysicalPlanet|environmentV2Projection|p6Biosphere/.test(bridge))throw new Error('selection bridge crossed scientific authority boundary');

console.log(JSON.stringify({
 status:'PASS',
 contract:'v08-product-composition-integrity-2',
 frozenBaselineNeutralityReplacedBy:'multi-lane composition ownership',
 fragments:fragments.length,
 extensions:extensions.length,
 singleFileComposition:true,
 selectionBridge:'SELECTION_ONLY',
 externalRuntimeDependencyIntroduced:false
}));

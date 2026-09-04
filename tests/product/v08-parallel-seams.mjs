import fs from 'node:fs';
import {composeProductTemplate} from '../../tools/product-template-compose.mjs';

const read=path=>fs.readFileSync(path,'utf8').replace(/\r\n?/g,'\n');
const template=read('src/bootstrap/ofu-template.html');
const composed=composeProductTemplate(template,read);
if(composed!==template)throw new Error('v0.8 extracted HTML fragments are not byte-equivalent to the v0.7 template baseline');
const required=[
 'src/bootstrap/product/workspace-nav.html',
 'src/bootstrap/product/viewport.html',
 'src/bootstrap/product/explore-panel.html',
 'src/bootstrap/product/inspect-panel.html',
 'src/bootstrap/product/lab-panel.html',
 'src/bootstrap/product/explore-navigation.js',
 'src/bootstrap/product/inspector-product.js',
 'src/bootstrap/product/mobile-interaction.js',
 'src/bootstrap/product/lab-technical.js',
 'src/bootstrap/product/mobile.css'
];
for(const path of required)if(!fs.existsSync(path)||read(path).length===0)throw new Error('missing v0.8 lane seam '+path);
const mobile=read('src/bootstrap/product/mobile.css');
if(!/Intentionally empty/.test(mobile))throw new Error('frozen baseline mobile seam must remain behavior-neutral');
for(const path of required.filter(path=>path.endsWith('.js'))){const source=read(path);if(/document\.|addEventListener|requestAnimationFrame|setInterval|setTimeout/.test(source))throw new Error('frozen baseline extension is not behavior-neutral: '+path)}
console.log(JSON.stringify({status:'PASS',htmlFragmentsByteEquivalent:true,behaviorNeutralExtensionPoints:true,seams:required.length}));

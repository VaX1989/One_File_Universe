import fs from 'node:fs';
import {composeProductTemplate} from '../../tools/product-template-compose.mjs';

const read=path=>fs.readFileSync(path,'utf8').replace(/\r\n?/g,'\n');
const template=read('src/bootstrap/ofu-template.html');
const composed=composeProductTemplate(template,read);
const branch=process.env.GITHUB_REF_NAME||'';
const laneOwnership={
 'feature/v08-explore-navigation':new Set([
  'src/bootstrap/product/workspace-nav.html',
  'src/bootstrap/product/explore-panel.html',
  'src/bootstrap/product/explore-navigation.js'
 ]),
 'feature/v08-rendering-camera':new Set(['src/bootstrap/product/viewport.html']),
 'feature/v08-inspector-product':new Set([
  'src/bootstrap/product/inspect-panel.html',
  'src/bootstrap/product/inspector-product.js'
 ]),
 'feature/v08-mobile-interaction':new Set([
  'src/bootstrap/product/mobile-interaction.js',
  'src/bootstrap/product/mobile.css'
 ]),
 'feature/v08-lab-technical':new Set([
  'src/bootstrap/product/lab-panel.html',
  'src/bootstrap/product/lab-technical.js'
 ])
};
const active=laneOwnership[branch]||new Set();
const activeHtml=[...active].filter(path=>path.endsWith('.html'));
if(activeHtml.length===0&&composed!==template)throw new Error('v0.8 extracted HTML fragments are not byte-equivalent to the v0.7 template baseline');
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
const mobile='src/bootstrap/product/mobile.css';
if(!active.has(mobile)&&!/Intentionally empty/.test(read(mobile)))throw new Error('unowned mobile seam must remain behavior-neutral');
const behavior=/document\.|addEventListener|requestAnimationFrame|setInterval|setTimeout/;
for(const path of required.filter(path=>path.endsWith('.js'))){
 if(active.has(path))continue;
 if(behavior.test(read(path)))throw new Error('unowned v0.8 extension is not behavior-neutral: '+path);
}
if(branch==='feature/v08-mobile-interaction')await import('./v08-mobile-interaction.mjs');
console.log(JSON.stringify({status:'PASS',htmlFragmentsByteEquivalent:activeHtml.length===0,behaviorNeutralUnownedExtensionPoints:true,activeLane:branch||'BASELINE',activeOwnedSeams:[...active],seams:required.length}));

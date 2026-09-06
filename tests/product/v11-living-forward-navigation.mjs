import fs from 'node:fs';
import assert from 'node:assert/strict';
import {load} from '../v1/integration/runtime-helper.mjs';
const {O,runtime:r,plan}=load({extraComponents:['v1.exploration.living-forward-navigation']});
let cases=0;const ok=(value,message)=>{assert.ok(value,message);cases++;};
const eq=(actual,expected,message)=>{assert.equal(actual,expected,message);cases++;};
const id=()=>r.snapshot().node?.entityId||null;
const componentIndex=name=>plan.findIndex(c=>c.id===name);
ok(O.v1LivingRuntime.FORWARD_NAVIGATION_VERSION==='ofu-v11-living-forward-navigation-1','Living factory is wrapped by the forward-navigation controller');
ok(componentIndex('v1.exploration.living-runtime')>=0&&componentIndex('v1.exploration.living-forward-navigation')>componentIndex('v1.exploration.living-runtime'),'forward controller is ordered after the base Living runtime');
ok(componentIndex('v1.product.living-universe')>componentIndex('v1.exploration.living-forward-navigation'),'forward controller is ordered before shipping Living product boot');
eq(r.snapshot().forwardDepth,0,'initial forward history is empty');

r.enterGalaxy(r.seedGraph.galaxy);const galaxyId=id();
r.enterRegion(r.seedGraph.region);const regionId=id();
eq(r.snapshot().stage,'REGION','known navigation reaches seed region');
ok(r.snapshot().historyDepth>=2&&r.snapshot().forwardKnownDepth>=2,'known reversible history tracks successful Living commands');
r.back();eq(r.snapshot().stage,'GALAXY','Back restores previous Living stage');eq(id(),galaxyId,'Back restores exact previous Living node');eq(r.snapshot().forwardDepth,1,'Back exposes one forward context');
r.forward();eq(r.snapshot().stage,'REGION','Forward restores next Living stage');eq(id(),regionId,'Forward restores exact next Living node');eq(r.snapshot().forwardDepth,0,'Forward consumes restored context');eq(r.snapshot().forwardCount,1,'successful exact forward replay is counted');

r.enterNeighborhood();const hoodId=id();r.enterSystem(r.seedGraph.system);const systemId=id();
r.back();r.back();eq(r.snapshot().stage,'REGION','two Back operations unwind a deeper path');eq(r.snapshot().forwardDepth,2,'two Back operations expose a two-entry redo path');
r.forward();eq(id(),hoodId,'first Forward restores exact neighborhood');r.forward();eq(id(),systemId,'second Forward restores exact system');eq(r.snapshot().stage,'SYSTEM','multi-step Forward returns to system stage');

r.back();eq(r.snapshot().forwardDepth,1,'Back creates redo before branch replacement');r.enterSystem(r.seedGraph.system);eq(r.snapshot().forwardDepth,0,'new successful navigation after Back truncates obsolete forward branch');
r.back();eq(r.snapshot().forwardDepth,1,'redo becomes available again after another Back');
const coordinate=r.snapshot().navigationCoordinate;r.setNavigationCoordinate(coordinate+0.05,{source:'forward-oracle-same-stage'});eq(r.snapshot().forwardDepth,0,'non-history continuous adjustment invalidates redo rather than guessing continuity');eq(r.snapshot().forwardKnownDepth,0,'fail-closed invalidation also drops unknown prior command chain');ok(r.snapshot().forwardInvalidations>=1,'forward invalidation is observable');

r.enterKey(r.seedGraph.body.canonicalKey);const epoch=r.snapshot().world.civilization.epoch;for(let i=0;i<90;i++)r.time(epoch);
ok(r.snapshot().historyDepth<=r.snapshot().maxHistory,'base Living history remains bounded');ok(r.snapshot().forwardKnownDepth<=r.snapshot().maxHistory&&r.snapshot().forwardDepth<=r.snapshot().maxHistory,'forward controller stacks remain bounded to Living history limit');eq(r.snapshot().canonicalMutation,false,'forward navigation never gains canonical mutation authority');

const controls=fs.readFileSync('src/bootstrap/product/living-forward-controls.js','utf8');
assert.match(controls,/data\.livingAction='forward'/);assert.match(controls,/event\.key==='\['/);assert.match(controls,/event\.key==='\]'/);assert.match(controls,/historyDepth/);assert.match(controls,/forwardDepth/);cases+=5;
console.log(JSON.stringify({status:'PASS',suite:'v11-living-forward-navigation',cases,forwardVersion:r.snapshot().forwardNavigationVersion,maxHistory:r.snapshot().maxHistory,invalidations:r.snapshot().forwardInvalidations}));

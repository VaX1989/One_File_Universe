import assert from 'node:assert/strict';import fs from 'node:fs';
const css=fs.readFileSync(new URL('../../src/product/v2x14/product-experience.css',import.meta.url),'utf8');
for(const required of ['touch-action:none','overscroll-behavior:contain','safe-area-inset-left','safe-area-inset-right','safe-area-inset-bottom','orientation:landscape','pointer:coarse','prefers-reduced-motion:reduce','forced-colors:active','min-height:48px'])assert(css.includes(required),'missing '+required);
for(const forbidden of ['#living-stage','.v2x14-skip','.v2x14-secondary','#v2x14-discovery'])assert(!css.includes(forbidden),'forbidden central selector '+forbidden);
assert(css.includes('[data-v2x14-authority="PRESENTATION_ONLY"]'),'central canvas styling must be gated by the lane-owned presentation marker');
console.log(JSON.stringify({status:'PASS',oracle:'V2X14_RESPONSIVE_AFFORDANCE_CSS',safeAreas:true,landscape:true,reducedMotion:true,coarseTargets:true}));

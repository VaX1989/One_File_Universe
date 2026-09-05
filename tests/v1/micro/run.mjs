import {spawnSync} from 'node:child_process';
const suites=['material-scenarios.mjs','determinism-bounds.mjs','regime-transitions.mjs'];
for(const suite of suites){const r=spawnSync(process.execPath,['tests/v1/micro/'+suite],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);}
console.log(JSON.stringify({status:'PASS',suite:'v1-micro-wave-a',suites:suites.length}));

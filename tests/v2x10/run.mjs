import {spawnSync} from 'node:child_process';
const files=['tests/v2x10/persistent-individuals.mjs','tests/v2x10/continuity-and-performance.mjs'];
for(const file of files){const r=spawnSync(process.execPath,[file],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
console.log(JSON.stringify({status:'PASS',suite:'v2x10-persistent-individuals',files}));

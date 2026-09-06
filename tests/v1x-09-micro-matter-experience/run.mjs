import {spawnSync} from 'node:child_process';
const files=['tests/v1x-09-micro-matter-experience/journey.mjs','tests/v1x-09-micro-matter-experience/bounds-authority.mjs'];for(const file of files){const r=spawnSync(process.execPath,[file],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}console.log(JSON.stringify({status:'PASS',suite:'v1x-09-micro-matter-experience',files}));

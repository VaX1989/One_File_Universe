import {spawnSync} from 'node:child_process';
const files=['tests/v2x-12-matter-continuity/authority-provenance.mjs','tests/v2x-12-matter-continuity/continuity-biology.mjs'];
for(const file of files){const r=spawnSync(process.execPath,[file],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
console.log(JSON.stringify({status:'PASS',suite:'v2x-12-matter-continuity',files}));

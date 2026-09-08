import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('./differential-browser.mjs',import.meta.url),'utf8');
const domains=['Universe','Galaxy','Region','Neighborhood','System','Planet','Surface','Human','Life','Civilization','Matter','Molecular','Atomic'];
for(const domain of domains)assert(source.includes(`'${domain}'`),`missing founder domain ${domain}`);
for(const token of ['MATERIAL_IMPROVEMENT','HUMAN_FOUNDER_REVIEW_REQUIRED','unexpectedNetworkRequests','artifactSha256','forward','reverse'])assert(source.includes(token),`missing audit contract token ${token}`);
assert(!source.includes("classification:'MATERIAL_IMPROVEMENT'"),'automation must never self-promote qualitative founder quality');
console.log(JSON.stringify({suite:'founder-visual-quality-contract',status:'PASS',domains:domains.length}));

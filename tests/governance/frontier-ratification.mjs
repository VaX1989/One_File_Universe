import fs from 'node:fs';
import assert from 'node:assert/strict';
import {validateFrontier} from '../../tools/validate-frontier-docs.mjs';
const dag=JSON.parse(fs.readFileSync('docs/frontier/WORKSTREAM_DAG.json','utf8'));
const schema=JSON.parse(fs.readFileSync('docs/frontier/WORKSTREAM_DAG.schema.json','utf8'));
assert.deepEqual(validateFrontier(dag,schema),[]);
const corruptions=[
 d=>{d.extra='unrecognized';},d=>{delete d.implementationProgram;},
 d=>{d.implementationProgram.state='COMPLETED';},d=>{d.implementationProgram.ratifiedAdrs.pop();},
 d=>{d.implementationProgram.phaseOrder.reverse();},d=>{d.implementationProgram.releaseTag='v0.9';},
 d=>{d.workstreams[0].criticalPath='yes';},d=>{d.workstreams[0].canonicalInputs=[42];},
 d=>{d.workstreams[0].currentMaturity='CERTIFIED_BY_DOCUMENT';},
 d=>{d.workstreams[0].dependencies=['F-MISSING'];},
 d=>{d.workstreams[0].dependencies=[d.workstreams[0].id];},
 d=>{d.workstreams[0].dependencies=[d.workstreams[1].id];d.workstreams[1].dependencies=[d.workstreams[0].id];},
 d=>{d.workstreams[1].id=d.workstreams[0].id;},
 d=>{d.workstreams[0].dependencies=['F-MISSING','F-MISSING'];},
 d=>{d.workstreams[0]=null;},d=>{d.baseMainSha='main';}
];
for(const mutate of corruptions){const d=structuredClone(dag);mutate(d);assert(validateFrontier(d,schema).length>0,'corrupt metadata must fail closed');}
assert(validateFrontier(null,schema).length>0);
console.log(JSON.stringify({status:'PASS',corruptionsRejected:corruptions.length+1,authority:'GOVERNANCE_METADATA_ONLY',implementationClaim:false}));

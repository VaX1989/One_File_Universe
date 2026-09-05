import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';import {load} from './helpers.mjs';
const source=fs.readFileSync('src/extensions/resources.js','utf8'),digest=s=>createHash('sha256').update(s).digest('hex');let cases=0;
function environment(records){load();globalThis.document={querySelectorAll:()=>records.map(r=>({id:'ofu-resource-'+r.id,textContent:JSON.stringify(r)}))};vm.runInThisContext(source);return OFU.pxResources;}
const json={id:'px.providers.fixture',kind:'data',encoding:'utf-8',sourceSha256:digest('source'),contentSha256:digest('{"a":1}'),content:'{"a":1}'};
let R=environment([json]);assert.deepEqual(R.json(json.id),{a:1});assert(Object.isFrozen(R.json(json.id)));assert.equal(R.snapshot().entries,1);cases++;
const bytes=Buffer.from([0,1,255,32]),binary={id:'test.binary',kind:'image',encoding:'base64',sourceSha256:digest(bytes),contentSha256:digest(bytes),content:bytes.toString('base64')};R=environment([binary]);assert.deepEqual([...R.bytes('test.binary')],[0,1,255,32]);cases++;
for(const [records,code] of [[[json,json],'COLLISION'],[[{...json,content:'{"a":2}'}],'INTEGRITY'],[[{...json,kind:'script'}],'RESOURCE'],[[{...binary,content:'AB/='}],'RESOURCE'],[[{...json,content:'x'.repeat(6*1024*1024+1)}],'BUDGET']]){R=environment(records);assert.throws(()=>R.load(),e=>e.code===code);cases++;}
R=environment([json]);assert.throws(()=>R.bytes('missing'),e=>e.code==='RESOURCE');cases++;delete globalThis.document;
console.log(JSON.stringify({status:'PASS',suite:'px-resources',cases}));

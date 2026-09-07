import fs from 'node:fs';
import assert from 'node:assert/strict';

const workflowDir='.github/workflows';
const workflows=[
  'p1-conformance.yml',
  'p1-p4-baseline.yml',
  'p2-conformance.yml',
  'p3-conformance.yml',
  'p4-conformance.yml',
  'p5-conformance.yml',
  'p5-environment-v2-canonical.yml',
  'p6-v1-conformance.yml',
].map(name=>`${workflowDir}/${name}`);

const expected=Object.freeze({
  'actions/checkout':'fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09',
  'actions/setup-node':'a0853c24544627f65ddf259abe73b1d18a591444',
  'actions/setup-python':'ece7cb06caefa5fff74198d8649806c4678c61a1',
  'actions/upload-artifact':'b7c566a772e6b6bfb58ed0dc250532a479d7789f',
  'actions/download-artifact':'37930b1c2abaa49bbe596cd826c3c89aef350131',
});
const legacy=[
  '11d5960a326750d5838078e36cf38b85af677262',
  '49933ea5288caeca8642d1e84afbd3f7d6820020',
  'a26af69be951a213d495a4c3e4e4022e16d87065',
  'ea165f8d65b6e75b540449e92b4886f43607fa02',
  'd3f86a106a0bac45b974a628896c90dbdf5c8093',
];
const seen=new Map(Object.keys(expected).map(name=>[name,0]));
let checks=0;
for(const file of workflows){
  const text=fs.readFileSync(file,'utf8');
  for(const sha of legacy){assert(!text.includes(sha),`${file}: legacy action runtime pin remains ${sha}`);checks++;}
  for(const line of text.split(/\r?\n/)){
    const match=line.trim().match(/^[-]?\s*uses:\s*([^\s@]+)@([0-9a-f]{40})(?:\s+#.*)?$/);
    if(!match)continue;
    const [,name,sha]=match;
    if(!(name in expected))continue;
    assert.equal(sha,expected[name],`${file}: ${name} must use the authenticated Node 24-native immutable pin`);
    seen.set(name,seen.get(name)+1);checks++;
  }
  assert(text.includes('OFU_SOURCE_SHA: ${{ github.event.pull_request.head.sha || github.sha }}'),`${file}: exact source identity must remain intact`);checks++;
}
for(const [name,count] of seen){assert(count>0,`historical workflows must exercise ${name}`);checks++;}
console.log(JSON.stringify({status:'PASS',suite:'historical-action-runtimes',workflows:workflows.length,actions:Object.fromEntries(seen),checks}));

import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium,firefox,webkit}=require('playwright');
const browserName=process.env.BROWSER||'chromium';
const expectedPlatform=process.env.EXPECTED_PLATFORM||process.platform;
const expectedArch=process.env.EXPECTED_ARCH||process.arch;
const sourceCommit=process.env.OFU_SOURCE_SHA||'LOCAL-UNPINNED';
const files=['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/temporal/p4-temporal.js'];
const source=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
function scenario(){
  const P=globalThis.OFU.p2,T=globalThis.OFU.p4,h=P.hex;
  const universe=Uint8Array.from({length:32},(_,i)=>i+1),lineage=T.lineageId(universe,null,'browser'),a=P.entityIdentity(universe,'synthetic',{id:'A'}),b=P.entityIdentity(universe,'synthetic',{id:'B'});
  const make=(sec,op,target,type,payload)=>T.canonicalEvent({universeIdentity:universe,lineageId:lineage,time:{seconds:BigInt(sec),micros:0n},type,version:1n,operationKey:op,targets:[target],payload,causes:[],preconditionStateDigest:null});
  const events=[make(2,'b',b,'core.field.set',{field:'name',value:'B'}),make(1,'a',a,'core.field.set',{field:'name',value:'A'}),make(2,'n',a,'core.counter.add',{counter:'n',delta:3n})];
  const r=T.replay({universeIdentity:universe,lineage,events}),cp=T.checkpoint({universeIdentity:universe,lineage,events:T.sortEvents(events).slice(0,1)}),suffix=T.replayFromCheckpoint({checkpoint:cp,events:T.sortEvents(events).slice(1)}),archive=T.exportArchive({universeIdentity:universe,lineage,events});
  if(h(r.digest)!==h(suffix.digest))throw new Error('checkpoint mismatch');
  return{stateDigest:h(r.digest),eventRoot:h(T.eventRoot(events)),archiveDigest:OFU.sha256.hex(archive),order:T.sortEvents(events).map(e=>h(e.id))};
}
const browser=await ({chromium,firefox,webkit}[browserName]).launch({headless:true});
try{
  const page=await browser.newPage();
  await page.goto('data:text/html,<meta charset=utf-8><title>P4</title>');
  await page.addScriptTag({content:source});
  const direct=await page.evaluate(scenario);
  const worker=await page.evaluate(async(src,scenarioText)=>{
    const blob=new Blob([src,'\nself.onmessage=()=>{try{const fn=eval("("+self.__scenario+")");postMessage({ok:true,value:fn()})}catch(e){postMessage({ok:false,error:String(e&&e.stack||e)})}};\nself.__scenario=',JSON.stringify(scenarioText),';'],{type:'text/javascript'});
    const url=URL.createObjectURL(blob);try{return await new Promise((resolve,reject)=>{const w=new Worker(url);w.onmessage=e=>{w.terminate();e.data.ok?resolve(e.data.value):reject(new Error(e.data.error))};w.onerror=e=>reject(e.error||new Error(e.message));w.postMessage(null)})}finally{URL.revokeObjectURL(url)}
  },source,scenario.toString());
  if(JSON.stringify(direct)!==JSON.stringify(worker))throw new Error('direct/Worker temporal mismatch');
  fs.mkdirSync('dist/evidence',{recursive:true});
  const evidence={evidenceSchemaVersion:1,phase:'P4',evidenceKind:'p4-browser-worker',producer:'tests/p4/browser-p4.mjs',sourceCommit,p2FinalCandidate:'9272a36fe2cb6c5b887e2f99d7e6ce671c5a8883',status:'PASS',browser:browserName,platform:expectedPlatform,arch:expectedArch,temporalProtocol:'ofu-p4-temporal-v1',canonical:direct};
  fs.writeFileSync(path.join('dist/evidence',`p4-${expectedPlatform}-${expectedArch}-${browserName}.json`),JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify(evidence));
}finally{await browser.close()}

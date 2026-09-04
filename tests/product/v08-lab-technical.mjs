import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(path,'utf8').replace(/\r\n?/g,'\n');
const panel=read('src/bootstrap/product/lab-panel.html');
const source=read('src/bootstrap/product/lab-technical.js');
const requiredSections=['Canonical evidence','Temporal laboratory','Archive / replay','Rendering diagnostics'];
for(const heading of requiredSections)if(!panel.includes('>'+heading+'<'))throw new Error('missing Lab information-architecture section: '+heading);
for(const id of ['world-create','event-submit','world-checkpoint','archive-export','archive-import','archive','archive-output','event-id','world-digest','temporal-output','integrity','universe-id','p3-version','p4-version','source-sha','render-scale','render-distance','render-patches','render-gpu','render-backend','render-depth','provenance']){
  const count=(panel.match(new RegExp('id="'+id+'"','g'))||[]).length;
  if(count!==1)throw new Error('shared compatibility id must exist exactly once in Lab: '+id+' count='+count);
}
if(/id="query"|id="requery"|id="entity-type"|id="query-fields"/.test(panel))throw new Error('Lab must not duplicate shared sparse-query state ownership');
if(!/not planetary physics/.test(panel))throw new Error('P4 diagnostic warning missing');
if(!/Presentation engineering evidence only/.test(panel))throw new Error('renderer authority separation warning missing');
if(/\.retarget\s*\(|\.navigateToRadii\s*\(/.test(source))throw new Error('Lab must not mutate renderer target or camera state');

class FakeNode{
  constructor(id=''){this.id=id;this.textContent='';this.dataset={};this.focused=0;}
  focus(){this.focused++;}
  closest(){return null;}
}
const ids=['lab-entity-type','lab-entity-id','lab-entity-digest','lab-canonical-address','lab-canonical-record','lab-canonical-provenance','lab-requery-status','lab-target-continuity','lab-renderer-snapshot','entity-type'];
const nodes=Object.fromEntries(ids.map(id=>[id,new FakeNode(id)]));
const sections=Object.fromEntries(['canonical-evidence','temporal-laboratory','archive-replay','rendering-diagnostics','artifact-integrity'].map(id=>{const n=new FakeNode(id);n.dataset.labSectionId=id;return[id,n]}));
const listeners=[];
const document={
  readyState:'complete',
  getElementById:id=>nodes[id]||null,
  querySelector:selector=>{const match=/^\[data-lab-section-id="([^"]+)"\]$/.exec(selector);return match?sections[match[1]]||null:null},
  addEventListener:(type,handler,options)=>listeners.push({type,handler,options})
};
const workspaceCalls=[];
const announcements=[];
let requeryCalls=0;
let rendererMutations=0;
const idBytes=Uint8Array.from([1,2,3,4]);
const universeBytes=Uint8Array.from([5,6,7,8]);
const OFU={
  p2:{hex:value=>Array.from(value,x=>x.toString(16).padStart(2,'0')).join('')},
  p3Astronomy:{
    VERSION:'p3-test',SCHEMA_VERSION:1,BASELINE_EPOCH:'P4_T0',
    digestFact:()=>Uint8Array.from([10,11]),
    canonicalEnvelope:r=>({entityIdentity:r.id,entityType:r.entityType,canonicalFacts:r.facts}),
    semanticManifestHash:()=>Uint8Array.from([12,13])
  },
  BASELINE_BUILD:{sourceCommit:'base-sha'},
  inspectorTest:{
    state:{universe:universeBytes,current:{type:'Planet',key:{orbitSlot:0n},digest:'fact-digest',r:{status:'PRESENT',entityType:'PLANET',id:idBytes,address:['planet',0n],key:{orbitSlot:0n},facts:{mass:1n},relations:{host:'star'}}}},
    requery:()=>{requeryCalls++;return true}
  },
  productUI:{
    workspace:(name,options)=>workspaceCalls.push({name,options}),
    announce:message=>announcements.push(message)
  }
};
const preview={
  provider:{planetId:'01020304'},chosen:{planetId:'01020304'},
  snapshot:()=>({planetId:'01020304',backend:'webgl2',workingSet:{activePatches:4}}),
  retarget:()=>{rendererMutations++},navigateToRadii:()=>{rendererMutations++}
};
const context={OFU,document,__OFU_PLANET_PREVIEW__:preview,console,Uint8Array,JSON,Object,BigInt};
context.globalThis=context;
vm.runInNewContext(source,context,{filename:'lab-technical.js'});
const api=context.OFU.v08LabTechnical;
if(api.seamVersion!==2)throw new Error('unexpected Lab seam version');
api.sync();
if(nodes['lab-entity-type'].textContent!=='Planet')throw new Error('canonical entity type projection failed');
if(nodes['lab-entity-id'].textContent!=='01020304')throw new Error('canonical Entity Identity projection failed');
if(!nodes['lab-canonical-address'].textContent.includes('orbitSlot'))throw new Error('canonical address projection failed');
if(!nodes['lab-canonical-record'].textContent.includes('canonicalEnvelope'))throw new Error('raw canonical record projection failed');
if(!nodes['lab-canonical-provenance'].textContent.includes('P3_CANONICAL'))throw new Error('canonical provenance projection failed');
if(!nodes['lab-target-continuity'].textContent.startsWith('MATCH'))throw new Error('target continuity diagnostic failed');
api.open('canonical-evidence');
if(workspaceCalls.at(-1)?.name!=='lab'||sections['canonical-evidence'].focused!==1)throw new Error('Inspect-to-Lab handoff API failed');
api.verifyRequery();
if(requeryCalls!==1||nodes['lab-requery-status'].textContent!=='PASS')throw new Error('deterministic re-query delegation failed');
api.openSparseQuery();
if(workspaceCalls.at(-1)?.name!=='inspect'||nodes['entity-type'].focused!==1)throw new Error('sparse query handoff failed');
api.refreshRendering();
if(!nodes['lab-renderer-snapshot'].textContent.includes('webgl2'))throw new Error('renderer snapshot projection failed');
if(rendererMutations!==0)throw new Error('Lab invoked renderer mutation while reading diagnostics');
if(!announcements.includes('Deterministic re-query passed'))throw new Error('accessible re-query announcement missing');
console.log(JSON.stringify({status:'PASS',sections:requiredSections.length,sharedCompatibilityIdsPreserved:true,canonicalStateOwnership:'delegated',rendererMutationCalls:rendererMutations,requeryDelegationCalls:requeryCalls,inspectLabHandoff:true}));

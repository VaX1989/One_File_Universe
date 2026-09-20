import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const ROOT=process.cwd();
const read=p=>fs.readFileSync(p);
const j=p=>JSON.parse(read(p));
const hex=b=>Buffer.from(b).toString('hex');
const u=h=>Uint8Array.from(Buffer.from(h,'hex'));
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const rejects=(fn,id)=>{let hit=false;try{fn()}catch{hit=true}assert(hit,`${id}: expected rejection`)};
const eq=(a,b,msg)=>assert(a===b,`${msg}: ${a} != ${b}`);

const manifest=j('conformance/iw0/manifest.json');
const p2=j('conformance/iw0/p2-vectors.json');
const p4=j('conformance/iw0/p4-vectors.json');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const ordered=[...manifest.files].sort((a,b)=>a.path.localeCompare(b.path));
let pre=[];
for(const f of ordered){
  const raw=read(f.path);
  eq(raw.length,f.bytes,`manifest byte count ${f.path}`);
  eq(hash(raw),f.sha256,`manifest sha256 ${f.path}`);
  pre.push(Buffer.from(f.path),Buffer.of(0),raw,Buffer.of(0));
}
eq(hash(Buffer.concat(pre)),manifest.corpus_digest,'corpus digest');
const digestLine=read('conformance/iw0/CORPUS.sha256').toString('utf8').trim().split(/\s+/)[0];
eq(digestLine,manifest.corpus_digest,'CORPUS.sha256');

globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/temporal/p4-temporal.js']){
  vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
}
const P=OFU.p2,T=OFU.p4;

function value(node){
  switch(node.kind){
    case 'null': return null;
    case 'bool': return node.value;
    case 'int': return BigInt(node.decimal);
    case 'bytes': return u(node.hex);
    case 'text': return node.value;
    case 'array': return node.items.map(value);
    case 'map': {const o=Object.create(null);for(const e of node.entries)o[e.key]=value(e.value);return o;}
    default: throw new Error(`unknown value DSL ${node.kind}`);
  }
}
function neutral(node){
  if(node===null||typeof node==='string'||typeof node==='boolean')return node;
  if(Array.isArray(node))return node.map(neutral);
  if(typeof node==='object'){
    if(Object.keys(node).length===1&&'$bytes' in node)return u(node.$bytes);
    if(Object.keys(node).length===1&&'$int' in node)return BigInt(node.$int);
    const o=Object.create(null);for(const [k,v] of Object.entries(node))o[k]=neutral(v);return o;
  }
  throw new Error('invalid neutral node');
}
function segments(spec){return spec.map(s=>({kind:s.kind,value:s.kind==='bytes'?u(s.value):s.kind==='u64'||s.kind==='i64'?BigInt(s.value):s.value}))}
function domainHash(tag,v){const a=new TextEncoder().encode(tag+'\0'),b=P.encode(v),c=new Uint8Array(a.length+b.length);c.set(a);c.set(b,a.length);return OFU.sha256.digest(c)}
function eventInput(rec){
  const d=neutral(rec.descriptor);
  return {universeIdentity:d.universeIdentity,lineageId:d.lineageId,time:d.time,type:d.type,version:d.version,operationKey:d.operationKey,targets:d.targets,payload:d.payload,causes:d.causes,preconditionStateDigest:d.preconditionStateDigest};
}

let positive=0,rejections=0;
for(const c of p2.positive_canonical_values){
  const v=value(c.input),b=P.encode(v);eq(hex(b),c.expected_hex,`P2 positive ${c.id}`);eq(hex(P.encode(P.decode(b))),c.expected_hex,`P2 roundtrip ${c.id}`);positive++;
}
for(const c of p2.malformed_canonical_bytes){rejects(()=>P.decode(u(c.input_hex)),c.id);rejections++;}
const addressById=new Map();
for(const c of p2.positive_addresses){
  const b=P.address(segments(c.segments));eq(hex(b),c.expected_hex,`address ${c.id}`);eq(hex(P.address(P.parseAddress(b))),c.expected_hex,`address roundtrip ${c.id}`);
  const d=P.derive({masterSeed:u(p2.seed_hex),semanticManifestHash:u(p2.semantic_manifest_hash),domain:c.derive.domain,addressBytes:b,property:c.derive.property,counter:BigInt(c.derive.counter)});
  eq(hex(d),c.derive.expected_hex,`derive ${c.id}`);addressById.set(c.id,b);positive++;
}
for(const c of p2.malformed_addresses){rejects(()=>P.parseAddress(u(c.input_hex)),`address ${c.id}`);rejections++;}

eq(hex(P.semanticManifestHash(p2.semantic_manifest)),p2.semantic_manifest_hash,'semantic manifest hash');
const uid=P.universeIdentity(u(p2.seed_hex),u(p2.semantic_manifest_hash));eq(hex(uid.descriptor),p2.universe_descriptor_hex,'universe descriptor');eq(hex(uid.digest),p2.universe_identity,'universe identity');positive+=2;
for(const c of p2.identity_cases){eq(hex(P.entityIdentity(u(c.universe_identity),c.namespace,value(c.stable_key))),c.expected_entity_identity,`entity ${c.id}`);positive++;}
for(const c of p2.derivation_separation){const d=P.derive({masterSeed:u(p2.seed_hex),semanticManifestHash:u(p2.semantic_manifest_hash),domain:c.domain,addressBytes:addressById.get(c.address_ref),property:c.property,counter:BigInt(c.counter)});eq(hex(d),c.expected_hex,`derive separation ${c.id}`);positive++;}
assert(new Set(p2.derivation_separation.map(x=>x.expected_hex)).size===p2.derivation_separation.length,'derivation separation collision');

function generatedReject(c){const p=c.pattern;switch(p.kind){
  case 'map-normalization-collision': {const o={};o[p.keys[0]]=1;o[p.keys[1]]=2;return()=>P.encode(o)}
  case 'integer': return()=>P.encode(BigInt(p.decimal));
  case 'nested-array-depth': return()=>{let v=null;for(let i=0;i<p.depth;i++)v=[v];return P.encode(v)};
  case 'map-null-pairs': return()=>{const o=Object.create(null);for(let i=0;i<p.pairs;i++)o['k'+String(i).padStart(5,'0')]=null;return P.encode(o)};
  case 'zero-bytes': return()=>P.encode(new Uint8Array(p.length));
  case 'ascii-text': return()=>P.encode('a'.repeat(p.length));
  case 'null-array': return()=>P.encode(Array(p.length).fill(null));
  case 'namespace': return()=>P.address([{kind:'namespace',value:'a'.repeat(p.length)}]);
  case 'bytes': return()=>P.address([{kind:'bytes',value:new Uint8Array(p.length)}]);
  case 'manifest-mutation': return()=>{const m=structuredClone(p2.semantic_manifest);if(p.mutation==='add-unknown-field')m.browser='chromium';else if(p.mutation==='delete-domains')delete m.domains;else if(p.mutation==='semantic-version-2')m.semanticManifestVersion=2;return P.semanticManifestHash(m)};
  default: throw new Error(`unknown reject pattern ${p.kind}`);
}}
for(const c of p2.generated_rejections){rejects(generatedReject(c),c.id);rejections++;}

// P4: freeze only explicit identity/order bytes plus the already-proven narrow behavioral invariants.
const universe=u(p4.universe_identity),lineage=T.lineageId(universe,null,p4.lineage.branch_key);eq(hex(lineage),p4.lineage.expected_lineage_id,'P4 lineage');positive++;
for(const [k,v] of Object.entries(p4.entities))eq(hex(P.entityIdentity(universe,'synthetic',{id:k})),v,`P4 entity ${k}`);
const byLabel=new Map();
for(const rec of p4.events){const ev=T.canonicalEvent(eventInput(rec));eq(hex(ev.id),rec.expected_event_id,`P4 event id ${rec.label}`);eq(hex(P.encode(ev.descriptor)),hex(P.encode(neutral(rec.descriptor))),`P4 descriptor bytes ${rec.label}`);byLabel.set(rec.label,ev);positive++;}
const sorted=T.sortEvents(p4.input_order.map(x=>byLabel.get(x)));const actualOrder=sorted.map(e=>p4.events.find(x=>x.expected_event_id===hex(e.id)).label);eq(JSON.stringify(actualOrder),JSON.stringify(p4.expected_canonical_order),'P4 canonical order');positive++;
eq(hex(T.transitionContractDigest(neutral(p4.transition_contract.descriptor))),p4.transition_contract.expected_digest,'P4 transition digest');positive++;

const history=p4.input_order.map(x=>byLabel.get(x)),full=T.replay({universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:history});
const perm=T.replay({universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:[byLabel.get('e3'),byLabel.get('e1'),byLabel.get('e4'),byLabel.get('e2')]});eq(hex(full.digest),hex(perm.digest),'P4 historical permutation invariant');
assert(T.sortEvents([byLabel.get('e1'),byLabel.get('e1'),byLabel.get('e2')]).length===2,'P4 exact event dedup');
const cp=T.checkpoint({universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:[byLabel.get('e1'),byLabel.get('e2')]});const suffix=T.replayFromCheckpoint({checkpoint:cp,events:[byLabel.get('e4'),byLabel.get('e3')]});eq(hex(full.digest),hex(suffix.digest),'P4 checkpoint suffix equivalence');
const archive=T.exportArchive({universeIdentity:universe,lineage,baseline:{kind:'synthetic'},events:history});const imported=T.importArchive(archive);const reexport=T.exportArchive({universeIdentity:imported.universeIdentity,lineage:imported.lineageId,baseline:imported.baseline,checkpoint:imported.checkpoint,events:imported.events,compactionPolicy:imported.compactionPolicy});eq(hex(reexport),hex(archive),'P4 archive byte roundtrip');
function worldThrough(frontierLabel){
  let w=T.createLiveWorld({universeIdentity:universe,lineage,baseline:{kind:'synthetic'}});
  if(frontierLabel===null)return w;
  for(const label of p4.expected_canonical_order){const result=T.commit({world:w,command:eventInput(p4.events.find(x=>x.label===label))});w=result.world;if(label===frontierLabel)return w;}
  throw new Error('unknown frontier event '+frontierLabel);
}
let frontierRejections=0;
for(const scenario of p4.live_frontier_scenarios){const base=worldThrough(scenario.frontier_event);let actual;try{const result=T.commit({world:base,command:eventInput(p4.events.find(x=>x.label===scenario.candidate_event))});actual=result.duplicate?'DUPLICATE_NOOP':'ACCEPT';}catch{actual='REJECT_NON_CANONICAL_ORDER';}eq(actual,scenario.expected,'P4 live frontier '+scenario.id);positive++;if(actual==='REJECT_NON_CANONICAL_ORDER'){frontierRejections++;rejections++;}}
const reordered=P.decode(archive);reordered.payload.events.reverse();reordered.integrity=domainHash('OFU-P4-ARCHIVE-v2',reordered.payload);rejects(()=>T.importArchive(P.encode(reordered)),'P4 reordered archive');rejections++;
const duplicated=P.decode(archive);duplicated.payload.events.push(duplicated.payload.events[duplicated.payload.events.length-1]);duplicated.integrity=domainHash('OFU-P4-ARCHIVE-v2',duplicated.payload);rejects(()=>T.importArchive(P.encode(duplicated)),'P4 duplicate archive event');rejections++;
const forged=P.decode(P.encode(cp));const u2=Uint8Array.from(universe);u2[0]^=0xff;const l2=T.lineageId(u2,null,p4.lineage.branch_key);forged.descriptor.state.universeIdentity=u2;forged.descriptor.state.lineageId=l2;forged.descriptor.stateDigest=domainHash('OFU-P4-STATE-v1',forged.descriptor.state);forged.id=domainHash('OFU-P4-CHECKPOINT-v1',forged.descriptor);rejects(()=>T.verifyCheckpoint(forged),'P4 forged checkpoint lineage');rejections++;
const cpA=T.checkpoint({universeIdentity:universe,lineage,baseline:{seed:'A'},events:[]});rejects(()=>T.exportArchive({universeIdentity:universe,lineage,baseline:{seed:'B'},checkpoint:cpA,events:[]}),'P4 checkpoint baseline mismatch');rejections++;
const fakePre=new Uint8Array(32);fakePre.fill(3);const ent=P.entityIdentity(universe,'synthetic',{id:'pre'});const preCmd={universeIdentity:universe,lineageId:lineage,time:{seconds:1n,micros:0n},type:'core.counter.add',version:1n,operationKey:'pre-reject',targets:[ent],payload:{counter:'n',delta:1n},causes:[],preconditionStateDigest:fakePre};const preWorld=T.createLiveWorld({universeIdentity:universe,lineage});rejects(()=>T.commit({world:preWorld,command:preCmd}),'P4 precondition failure');rejections++;
for(const c of p4.malformed_inputs){if(c.id==='time-micros-one-million')rejects(()=>T.canonicalTime({seconds:BigInt(c.input.seconds),micros:BigInt(c.input.micros)}),c.id);else {const base=eventInput(p4.events.find(x=>x.label===c.mutation.event));if(c.id==='event-version-zero')base.version=0n;else if(c.id==='event-duplicate-target')base.targets=[base.targets[0],base.targets[0]];rejects(()=>T.canonicalEvent(base),c.id)}rejections++;}

const evidence={schema:'ofu-ind-conf-a-js-authority-evidence-v1',status:'PASS',source_commit:process.env.OFU_SOURCE_SHA||'LOCAL-UNPINNED',corpus_digest:manifest.corpus_digest,positive_checks:positive,rejection_checks:rejections,p2_protocol:p2.protocol,p4_protocol:p4.protocol,p4_live_frontier_scenarios:p4.live_frontier_scenarios.length,p4_live_frontier_rejections:frontierRejections,p4_frontier_model:'CURRENT_AUTHORITY_DIFFERENTIAL_AGAINST_LANGUAGE_NEUTRAL_SCENARIOS',rejection_class_note:'Corpus classes are stable expectations; current JS exception strings are intentionally non-normative.'};
fs.mkdirSync('dist/evidence/industrialization',{recursive:true});fs.writeFileSync('dist/evidence/industrialization/ind-conf-a-js.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify(evidence));

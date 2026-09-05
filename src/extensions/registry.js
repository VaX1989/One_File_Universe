(function(root) {
'use strict';
const O=root.OFU=root.OFU||{}, C=O.pxContracts;
if(!C) throw new Error('PX contracts must load before registries');
const VERSION='ofu-px-registry-1';
const scientific=new Set(['CANONICAL_PROVEN','DERIVED','MODEL_DERIVED_SIMULATION']);
const lex=(a,b)=>a<b?-1:a>b?1:0;
function create(policyInput) {
  const policy=C.data(policyInput); C.keys(policy,['owners','canonicalAdmissions','maxEntries']);
  C.assert(Number.isSafeInteger(policy.maxEntries)&&policy.maxEntries>0&&policy.maxEntries<=C.LIMITS.entries,'REGISTRY_BUDGET','maxEntries');
  C.assert(Array.isArray(policy.owners)&&policy.owners.length<=128,'OWNER','policy');
  C.assert(Array.isArray(policy.canonicalAdmissions)&&policy.canonicalAdmissions.length<=128,'AUTHORITY','admissions');
  const owners=new Map(),entries=new Map(),bindings=new Map(); let order=null,manifest=null,manifestDigest=null,totalBytes=0,closed=false;
  for(const p of policy.owners) {
    C.keys(p,['id','prefixes','kinds','authorities']);C.token(p.id);C.assert(!owners.has(p.id),'OWNER','duplicate owner');
    C.list(p.prefixes,'prefixes',C.token);C.list(p.kinds,'kinds',k=>C.assert(C.KINDS.includes(k),'KIND',k));
    C.list(p.authorities,'authorities',a=>C.assert(C.AUTHORITIES.includes(a),'AUTHORITY',a));owners.set(p.id,p);
  }
  for(const a of policy.canonicalAdmissions) {C.keys(a,['id','owner','version','authorityDigest']);C.token(a.id);C.token(a.owner);C.version(a.version);C.hash(a.authorityDigest);}
  C.assert(new Set(policy.canonicalAdmissions.map(a=>a.id)).size===policy.canonicalAdmissions.length,'DUPLICATE','canonical admission');
  function register(value) {
    C.assert(order===null,'REGISTRY_SEALED','descriptors are immutable after seal');const d=C.provider(value),p=owners.get(d.owner);
    C.assert(p&&p.kinds.includes(d.kind)&&p.authorities.includes(d.authority.class)&&p.prefixes.some(prefix=>d.id===prefix||d.id.startsWith(prefix+'.')),'OWNER',d.id);
    C.assert(!entries.has(d.id),'DUPLICATE',d.id); C.assert(entries.size<policy.maxEntries,'REGISTRY_BUDGET','entries');
    if(d.authority.class==='CANONICAL_PROVEN') C.assert(policy.canonicalAdmissions.some(a=>a.id===d.id&&a.owner===d.owner&&a.version===d.version&&a.authorityDigest===C.digest(d.authority)),'AUTHORITY','unadmitted canonical descriptor '+d.id);
    const size=new TextEncoder().encode(C.stable(d)).length;C.assert(totalBytes+size<=C.LIMITS.bytes,'REGISTRY_BUDGET','metadata bytes');
    entries.set(d.id,d);totalBytes+=size;return d;
  }
  function seal() {
    if(order)return manifest; const claims=new Map(),marks=new Map(),sorted=[];
    for(const d of entries.values()) {
      for(const claim of d.claims) {const reserved=claim.split('.')[0];if(['scene','scene-id','renderer','query','inspector','interaction','persistence','domain','model','scale','representation','test'].includes(reserved))C.assert(d.kind===(reserved==='scene-id'?'scene':reserved),'CAPABILITY','claim kind '+claim);C.assert(!claims.has(claim),'COLLISION',claim);claims.set(claim,d.id);}
      for(const dep of d.requires) {
        const target=entries.get(dep.id);C.assert(target,'DEPENDENCY',dep.id);C.assert(target.version===dep.version,'DEPENDENCY_VERSION',dep.id);
        C.assert(target.authority.class===dep.authority,'AUTHORITY','dependency authority '+dep.id);
        if(d.authority.class==='CANONICAL_PROVEN')C.assert(dep.authority==='CANONICAL_PROVEN','AUTHORITY','canonical dependency downgrade');
        if(scientific.has(d.authority.class))C.assert(scientific.has(dep.authority),'AUTHORITY','scientific state cannot depend on presentation/telemetry');
      }
    }
    function visit(id) {C.assert(marks.get(id)!==1,'DEPENDENCY_CYCLE',id);if(marks.get(id)===2)return;marks.set(id,1);for(const dep of [...entries.get(id).requires].sort((a,b)=>lex(a.id,b.id)))visit(dep.id);marks.set(id,2);sorted.push(id);}
    for(const id of [...entries.keys()].sort(lex))visit(id);
    // Commit atomically only after the complete graph validates.
    manifest=C.data({version:VERSION,providers:sorted.map(id=>entries.get(id))});manifestDigest=C.digest(manifest);order=Object.freeze(sorted);return manifest;
  }
  function descriptor(id) {C.assert(order,'REGISTRY_UNSEALED','seal before use');const d=entries.get(id);C.assert(d,'PROVIDER_MISSING',id);return d;}
  function resolve(claim) {C.assert(order,'REGISTRY_UNSEALED','seal before use');C.token(claim);const matches=order.filter(id=>entries.get(id).claims.includes(claim));C.assert(matches.length===1,'CAPABILITY',claim);return matches[0];}
  function bind(id,owner,version,implementation) {
    C.assert(!closed,'BINDINGS_SEALED','no late replacement');const d=descriptor(id);C.assert(d.owner===owner&&d.version===version,'OWNER','binding '+id);C.assert(!bindings.has(id),'DUPLICATE','binding '+id);
    C.assert(implementation&&Object.getPrototypeOf(implementation)===Object.prototype,'IMPLEMENTATION',id);
    const funcs={};for(const k of Reflect.ownKeys(implementation)) {C.assert(typeof k==='string'&&['handle','setActive','setDistanceRadii','cameraIntent','dispose','snapshot','probe','render','encode','decode'].includes(k),'IMPLEMENTATION','unexpected method');const v=Object.getOwnPropertyDescriptor(implementation,k);C.assert(v&&'value' in v&&typeof v.value==='function','IMPLEMENTATION',k);funcs[k]=v.value;}
    C.assert(Object.keys(funcs).length>0,'IMPLEMENTATION','empty');bindings.set(id,Object.freeze(funcs));return d;
  }
  function implementation(id) {descriptor(id);return bindings.get(id)||null;}
  function sealBindings() {for(const id of order||[])C.assert(!entries.get(id).mandatory||bindings.has(id),'EVIDENCE_MISSING','mandatory implementation '+id);C.assert(order,'REGISTRY_UNSEALED','seal before bindings');closed=true;return snapshot();}
  function invoke(id,input) {
    const d=descriptor(id),request=C.request(input,d),impl=implementation(id);C.assert(impl?.handle,'IMPLEMENTATION','handler '+id);
    C.assert(request.operation!=='TRANSITION','AUTHORITY','world changes require P4 event admission, not query invocation');
    let operations=0,entities=0;const meter=Object.freeze({consume(n=1,count=0){C.assert(Number.isSafeInteger(n)&&n>0&&Number.isSafeInteger(count)&&count>=0,'BUDGET','meter');operations+=n;entities+=count;C.assert(operations<=request.budget.operations&&entities<=request.budget.entities,'BUDGET','executed work');}});
    const out=C.envelope(impl.handle(request,meter),d,request);C.assert(out.usage.operations>=operations&&out.usage.entities>=entities,'BUDGET','under-reported executed work');return out;
  }
  function snapshot(){return C.data({version:VERSION,sealed:order!==null,bindingsSealed:closed,entries:entries.size,metadataBytes:totalBytes,manifestDigest,order:order||[],bound:[...bindings.keys()].sort(lex)});}
  return Object.freeze({register,seal,descriptor,resolve,bind,implementation,sealBindings,invoke,snapshot});
}
O.pxRegistry=Object.freeze({VERSION,create});
})(globalThis);

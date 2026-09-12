(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.pxContracts,R=O.v2x01Contracts,V='ofu-v2x01-bounded-prefetch-2';
function create(o={}){
  C.keys(o,[],['maxCandidates','maxRequests']);const mc=R.integer(o.maxCandidates??64,'prefetch candidates',1,512),mr=R.integer(o.maxRequests??8,'prefetch requests',1,64);C.assert(mr<=mc,'BUDGET','prefetch');
  const m={plans:0,candidates:0,selected:0,dropped:0,duplicatesDropped:0};
  function plan(x){
    C.keys(x,['intentSnapshot','candidates']);C.data(x.intentSnapshot,{bytes:16384,nodes:512});C.assert(Array.isArray(x.candidates)&&x.candidates.length<=mc,'BUDGET','prefetch candidates');m.plans++;m.candidates+=x.candidates.length;
    const a=x.candidates.map(y=>{
      C.keys(y,['request','priority','distanceHint']);const q=C.data(y.request,{bytes:65536,nodes:4096});C.keys(q,['durable','targetState','taskClass','semantic','presentation','estimate'],['preferWorker']);
      const durable=R.durable(q.durable);R.taskClass(q.taskClass);R.state(q.targetState);R.estimate(q.estimate);if(q.preferWorker!==undefined)C.assert(typeof q.preferWorker==='boolean','SCHEMA','preferWorker');C.data(q.semantic,{bytes:65536,nodes:4096});C.data(q.presentation,{bytes:65536,nodes:4096});
      C.assert(q.taskClass==='PREFETCH'&&q.targetState!=='IMMEDIATE','AUTHORITY','prefetch cannot elevate scheduling or own interaction');C.assert(Number.isSafeInteger(y.priority)&&y.priority>=0,'BUDGET','priority');C.assert(Number.isFinite(y.distanceHint)&&y.distanceHint>=0,'BUDGET','distance');
      return{q,p:y.priority,d:y.distanceHint,k:R.logicalIdentityKey(durable.identity)};
    }).sort((a,b)=>b.p-a.p||a.d-b.d||a.k.localeCompare(b.k));
    const seen=new Set(),selected=[];for(const candidate of a){if(seen.has(candidate.k)){m.duplicatesDropped++;continue}seen.add(candidate.k);if(selected.length<mr)selected.push(candidate.q)}
    m.selected+=selected.length;m.dropped+=a.length-selected.length;return Object.freeze(selected);
  }
  function snapshot(){return C.data({version:V,limits:{maxCandidates:mc,maxRequests:mr},metrics:m})}
  return Object.freeze({VERSION:V,plan,snapshot});
}
O.v2x01BoundedPrefetch=Object.freeze({VERSION:V,create});
})(globalThis);

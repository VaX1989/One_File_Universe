(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.pxContracts;if(!C)throw new Error('PX contracts required');
const VERSION='ofu-px-cross-scale-1';
function quantities(input){C.assert(Array.isArray(input)&&input.length<=64,'COMMITMENT','bounded quantities');const seen=new Set();for(const q of input){C.keys(q,['material','unit','amount']);C.token(q.material);C.token(q.unit);C.uint(q.amount);const k=q.material+'@'+q.unit;C.assert(!seen.has(k),'COLLISION','material/unit');seen.add(k);}return [...input].sort((a,b)=>(a.material+'@'+a.unit)<(b.material+'@'+b.unit)?-1:1);}
function signed(v){C.assert(typeof v==='string'&&/^(0|-?[1-9][0-9]{0,18})$/.test(v),'SPATIAL','fixed point coordinate');return BigInt(v);}
function spatial(input){C.keys(input,['frame','unit','anchor','bounds']);C.token(input.frame);C.token(input.unit);C.assert(Array.isArray(input.anchor)&&input.anchor.length===3&&Array.isArray(input.bounds)&&input.bounds.length===3,'SPATIAL','three axes');for(let i=0;i<3;i++){signed(input.anchor[i]);C.assert(Array.isArray(input.bounds[i])&&input.bounds[i].length===2,'SPATIAL','axis bounds');const lo=signed(input.bounds[i][0]),hi=signed(input.bounds[i][1]);C.assert(lo<=hi,'SPATIAL','inverted extent');}return input;}
function parent(input){const p=C.data(input);C.keys(p,['contract','selection','regime','authority','spatial','matter','observables','commitmentDigest']);C.assert(p.contract===VERSION,'CONTRACT','cross-scale parent');C.selection(p.selection);C.token(p.regime);C.authority(p.authority);spatial(p.spatial);quantities(p.matter);C.assert(p.observables&&typeof p.observables==='object'&&!Array.isArray(p.observables)&&Object.keys(p.observables).length<=64,'COMMITMENT','observables');const {commitmentDigest,...body}=p;C.assert(C.digest(body)===commitmentDigest,'INTEGRITY','parent commitment digest');return p;}
function commit(input){const body=C.data({...input,contract:VERSION});return parent({...body,commitmentDigest:C.digest(body)});}
function rule(input){const r=C.data(input);C.keys(r,['id','version','from','to','authority','fidelity','observableKeys']);C.token(r.id);C.version(r.version);C.token(r.from);C.token(r.to);C.authority(r.authority);C.fidelity(r.fidelity);C.list(r.observableKeys,'observable keys');C.assert(r.fidelity.regime===r.to,'REGIME','rule fidelity');return r;}
function childId(p,r,key){return C.digest({contract:VERSION,universe:p.selection.target.universeId,parent:p.selection.target.entityId,model:r.authority.model,version:r.authority.version,regime:r.to,key});}
function project(parentInput,ruleInput,resultInput,budgetInput){
 const p=parent(parentInput),r=rule(ruleInput),b=C.budget(budgetInput),result=C.data(resultInput,{bytes:b.bytes});
 C.assert(r.from===p.regime,'REGIME','parent/rule mismatch');
 if(r.authority.class==='CANONICAL_PROVEN')C.assert(p.authority.class==='CANONICAL_PROVEN','AUTHORITY','no canonical promotion during refinement');
 if(['DERIVED','MODEL_DERIVED_SIMULATION'].includes(r.authority.class))C.assert(!['PRESENTATION_ONLY','MEASURED_RUNTIME_EVIDENCE'].includes(p.authority.class),'AUTHORITY','science from presentation is forbidden');
 C.keys(result,['contract','rule','version','inherited','authority','fidelity','details']);C.assert(result.contract===VERSION&&result.rule===r.id&&result.version===r.version,'CONTRACT','refinement descriptor');
 C.assert(result.inherited===p.commitmentDigest,'INTEGRITY','inherited parent');C.assert(C.stable(result.authority)===C.stable(r.authority),'AUTHORITY','refinement provenance');C.assert(C.stable(result.fidelity)===C.stable(r.fidelity),'REGIME','refinement fidelity');
 C.assert(Array.isArray(result.details)&&result.details.length>0&&result.details.length<=b.entities,'BUDGET','detail count');
 C.assert(result.details.length*(1+p.matter.length+Object.keys(p.observables).length)<=b.operations,'BUDGET','independent reconciliation work');
 const allowed=new Set(r.observableKeys);C.assert(Object.keys(p.observables).every(k=>allowed.has(k)),'COMMITMENT','undeclared coarse observable');
 const sums=new Map(p.matter.map(q=>[q.material+'@'+q.unit,0n])),seen=new Set();
 for(const d of result.details){
  C.keys(d,['id','key','parentId','selectionDigest','spatial','matter','observables','representation']);C.text(d.key,'detail key',256);C.hash(d.id);
  C.assert(!seen.has(d.key),'COLLISION','detail key');seen.add(d.key);C.assert(d.id===childId(p,r,d.key)&&d.parentId===p.selection.target.entityId,'IDENTITY','deterministic child identity');
  C.assert(d.selectionDigest===C.digest(p.selection),'IDENTITY','selection/time/history/context changed');spatial(d.spatial);
  C.assert(d.spatial.frame===p.spatial.frame&&d.spatial.unit===p.spatial.unit&&C.stable(d.spatial.anchor)===C.stable(p.spatial.anchor),'SPATIAL','frame/anchor mismatch');
  for(let i=0;i<3;i++)C.assert(signed(d.spatial.bounds[i][0])>=signed(p.spatial.bounds[i][0])&&signed(d.spatial.bounds[i][1])<=signed(p.spatial.bounds[i][1]),'SPATIAL','detail escapes parent extent');
  quantities(d.matter);for(const q of d.matter){const key=q.material+'@'+q.unit;C.assert(sums.has(key),'COMMITMENT','undeclared material/unit '+key);sums.set(key,sums.get(key)+BigInt(q.amount));}
  C.assert(C.stable(d.observables)===C.stable(p.observables),'COMMITMENT','fine result contradicts inherited observable');
 }
 const projected=quantities(p.matter.map(q=>({...q,amount:String(sums.get(q.material+'@'+q.unit))})));
 return C.data({contract:VERSION,parentDigest:p.commitmentDigest,ruleDigest:C.digest(r),selectionDigest:C.digest(p.selection),matter:projected,observables:p.observables,details:result.details.length,resultDigest:C.digest(result)});
}
function reconcile(parentInput,ruleInput,resultInput,budgetInput){const p=parent(parentInput),r=rule(ruleInput),projection=project(p,r,resultInput,budgetInput),expected=quantities(p.matter);C.assert(C.stable(expected)===C.stable(projection.matter),'CONSERVATION','independent material accounting');return C.data({contract:VERSION,operation:'RECONCILE',status:'PASS',parentDigest:p.commitmentDigest,ruleDigest:C.digest(r),projection,authority:r.authority,method:'INDEPENDENT_IDENTITY_SPATIAL_HISTORY_OBSERVABLE_AND_INTEGER_MATTER_CHECK'});}
function refine(parentInput,ruleInput,budgetInput,adapter){const p=parent(parentInput),r=rule(ruleInput),b=C.budget(budgetInput);C.assert(typeof adapter==='function','IMPLEMENTATION','refinement adapter');C.assert(p.regime===r.from,'REGIME','refinement direction');const result=C.data(adapter(C.data({parent:p,rule:r,budget:b})),{bytes:b.bytes}),witness=reconcile(p,r,result,b);return Object.freeze({result,witness});}
// A reversible change of presentation regime materializes one inherited context.
// This does not assert scientific physical terrain or atomistic refinement.
function contextDetail(p,r,representation={}){const key='context';return C.data({contract:VERSION,rule:r.id,version:r.version,inherited:p.commitmentDigest,authority:r.authority,fidelity:r.fidelity,details:[{id:childId(p,r,key),key,parentId:p.selection.target.entityId,selectionDigest:C.digest(p.selection),spatial:p.spatial,matter:p.matter,observables:p.observables,representation}]});}
O.pxCrossScale=Object.freeze({VERSION,commit,parent,rule,childId,refine,project,reconcile,contextDetail});
})(globalThis);

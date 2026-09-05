import assert from 'node:assert/strict';
import {load,authority,selection,budget,fidelity} from './helpers.mjs';
const O=load(['src/extensions/cross-scale.js']),X=O.pxCrossScale,C=O.pxContracts;
const p=X.commit({selection:selection(),regime:'coarse',authority:authority(),spatial:{frame:'planet-local',unit:'mm',anchor:['0','0','0'],bounds:[['-100','100'],['-100','100'],['-100','100']]},matter:[{material:'water',unit:'microgram',amount:'13'}],observables:{history:'committed',surface:'unknown'}});
const r=X.rule({id:'test.refine',version:'1.0.0',from:'coarse',to:'fine',authority:authority(),fidelity:{...fidelity,regime:'fine'},observableKeys:['history','surface']});
const details=X.contextDetail(p,r),clone=v=>JSON.parse(JSON.stringify(v));let cases=0;
assert.equal(X.refine(p,r,budget,()=>details).witness.status,'PASS');cases++;
const bad=(mutate,code)=>{const x=clone(details);mutate(x);assert.throws(()=>X.reconcile(p,r,x,budget),e=>e.code===code);cases++;};
bad(x=>x.inherited='a'.repeat(64),'INTEGRITY');bad(x=>x.details[0].id='b'.repeat(64),'IDENTITY');bad(x=>x.details[0].selectionDigest='c'.repeat(64),'IDENTITY');bad(x=>x.details[0].parentId='d'.repeat(64),'IDENTITY');
bad(x=>x.authority=authority('CANONICAL_PROVEN'),'AUTHORITY');bad(x=>x.fidelity.regime='other','REGIME');bad(x=>x.details[0].spatial.anchor[0]='1','SPATIAL');bad(x=>x.details[0].spatial.bounds[0][1]='101','SPATIAL');
bad(x=>x.details[0].matter[0].unit='kg','COMMITMENT');bad(x=>x.details[0].matter[0].amount='12','CONSERVATION');bad(x=>x.details[0].observables.surface='ocean','COMMITMENT');bad(x=>x.details.push(x.details[0]),'COLLISION');bad(x=>x.details=[],'BUDGET');
assert.throws(()=>X.reconcile({...p,regime:'changed'},r,details,budget),e=>e.code==='INTEGRITY');cases++;
assert.throws(()=>X.refine(p,{...r,from:'bad'},budget,()=>details),e=>e.code==='REGIME');cases++;
// Exact partition conservation and deterministic child identities at many counts.
for(let n=1;n<=128;n++) {const x=clone(details);x.details=Array.from({length:n},(_,i)=>{const d=clone(details.details[0]);d.key='cell-'+i;d.id=X.childId(p,r,d.key);d.matter[0].amount=String(13n/BigInt(n)+(BigInt(i)<13n%BigInt(n)?1n:0n));return d;});assert.equal(X.reconcile(p,r,x,{...budget,bytes:524288}).status,'PASS');const expected=X.project(p,r,x,{...budget,bytes:524288}).matter;x.details.reverse();assert.deepEqual(X.project(p,r,x,{...budget,bytes:524288}).matter,expected);cases++;}
console.log(JSON.stringify({status:'PASS',suite:'px-cross-scale',cases,independentConservation:true}));

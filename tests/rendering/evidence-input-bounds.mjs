import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assertExactRenderingBrowserMatrix,collectRenderingEvidence,readBoundedRegularFile,RENDERING_EVIDENCE_LIMITS as L,REQUIRED_RENDERING_BROWSER_TUPLES} from '../../tools/ci/rendering-evidence-input.mjs';

let cases=0;
const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'ofu-render-evidence-'));
const cleanup=root=>fs.rmSync(root,{recursive:true,force:true});

{
 const rows=REQUIRED_RENDERING_BROWSER_TUPLES.map(tuple=>{const [platform,arch,browser]=tuple.split('/');return{platform,arch,browser};});
 assert.deepEqual(assertExactRenderingBrowserMatrix(rows),[...REQUIRED_RENDERING_BROWSER_TUPLES].sort());cases++;
 const wrongArch=structuredClone(rows);wrongArch.find(row=>row.platform==='linux'&&row.browser==='firefox').arch='arm64';assert.throws(()=>assertExactRenderingBrowserMatrix(wrongArch),/exact required browser matrix/);cases++;
 const duplicate=structuredClone(rows);duplicate[4]={...duplicate[3]};assert.throws(()=>assertExactRenderingBrowserMatrix(duplicate),/exact required browser matrix/);cases++;
}
{
 const root=temp();try{
  fs.mkdirSync(path.join(root,'b'));fs.mkdirSync(path.join(root,'a'));
  fs.writeFileSync(path.join(root,'b','z.json'),'{"z":1}\n');
  fs.writeFileSync(path.join(root,'a','a.json'),'{"a":1}\n');
  fs.writeFileSync(path.join(root,'ignored.txt'),'not evidence');
  const out=collectRenderingEvidence(root);
  assert.equal(out.records.length,2);assert.deepEqual(out.records.map(r=>path.basename(r.file)),['a.json','z.json']);
  assert.deepEqual(out.records.map(r=>r.doc),[{a:1},{z:1}]);cases+=3;
 }finally{cleanup(root)}
}
{
 const root=temp();try{fs.writeFileSync(path.join(root,'bad.json'),'{');assert.throws(()=>collectRenderingEvidence(root),/invalid JSON evidence/);cases++;}finally{cleanup(root)}
}
{
 const root=temp();try{fs.writeFileSync(path.join(root,'large.json'),Buffer.alloc(L.maxJsonFileBytes+1,0x20));assert.throws(()=>collectRenderingEvidence(root),/per-file byte limit/);cases++;}finally{cleanup(root)}
}
{
 const root=temp();try{for(let i=0;i<=L.maxEntries;i++)fs.writeFileSync(path.join(root,'f'+String(i).padStart(3,'0')+'.txt'),'x');assert.throws(()=>collectRenderingEvidence(root),/entry limit/);cases++;}finally{cleanup(root)}
}
{
 const root=temp();try{let d=root;for(let i=0;i<=L.maxDepth;i++){d=path.join(d,'d'+i);fs.mkdirSync(d);}assert.throws(()=>collectRenderingEvidence(root),/depth limit/);cases++;}finally{cleanup(root)}
}
{
 const root=temp();try{
  const target=path.join(root,'target.json'),link=path.join(root,'linked.json');fs.writeFileSync(target,'{}');
  let linked=false;try{fs.symlinkSync(target,link);linked=true}catch(error){if(!['EPERM','EACCES','UNKNOWN'].includes(error?.code))throw error;}
  if(linked){assert.throws(()=>collectRenderingEvidence(root),/symbolic links are not admissible/);cases++;assert.throws(()=>readBoundedRegularFile(link),/must not be a symbolic link/);cases++;}
 }finally{cleanup(root)}
}
{
 const root=temp();try{const artifact=path.join(root,'One_File_Universe.html');fs.writeFileSync(artifact,'<!doctype html>');assert.equal(readBoundedRegularFile(artifact).toString(),'<!doctype html>');assert.throws(()=>readBoundedRegularFile(artifact,4),/exceeds byte limit/);cases+=2;}finally{cleanup(root)}
}
console.log(JSON.stringify({status:'PASS',suite:'rendering-evidence-input-bounds',cases,limits:L,requiredBrowserTuples:REQUIRED_RENDERING_BROWSER_TUPLES}));

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const mode=process.argv[2]||'full';
if(!['full','normalization'].includes(mode))throw new Error('usage: fetch-p2-unicode-test-data.mjs [full|normalization]');
const base='https://www.unicode.org/Public/15.1.0/ucd/';
const names=mode==='full'?['UnicodeData.txt','NormalizationTest.txt']:['NormalizationTest.txt'];
const outDir='.unicode';fs.mkdirSync(outDir,{recursive:true});
for(const name of names){
  const url=base+name,res=await fetch(url,{redirect:'follow'});if(!res.ok)throw new Error(`${url}: HTTP ${res.status}`);
  const bytes=new Uint8Array(await res.arrayBuffer());if(bytes.length<1000)throw new Error(`${name}: unexpectedly small download`);
  const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  if(name==='NormalizationTest.txt'&&!text.includes('NormalizationTest-15.1.0.txt'))throw new Error('NormalizationTest version mismatch');
  fs.writeFileSync(path.join(outDir,name),bytes);
  console.log(`${name} ${bytes.length} ${crypto.createHash('sha256').update(bytes).digest('hex')}`);
}

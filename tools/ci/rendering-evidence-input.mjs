import fs from 'node:fs';
import path from 'node:path';

export const RENDERING_EVIDENCE_LIMITS=Object.freeze({
 maxDepth:12,
 maxEntries:512,
 maxJsonFiles:64,
 maxJsonFileBytes:4*1024*1024,
 maxJsonBytes:32*1024*1024,
 maxArtifactBytes:8*1024*1024,
});

function fail(message){throw new Error('rendering evidence input: '+message);}
function statRegular(file,label){
 let stat;try{stat=fs.lstatSync(file);}catch(error){fail(label+' unavailable: '+String(error?.message||error));}
 if(stat.isSymbolicLink())fail(label+' must not be a symbolic link');
 if(!stat.isFile())fail(label+' must be a regular file');
 return stat;
}

export function readBoundedRegularFile(file,maxBytes=RENDERING_EVIDENCE_LIMITS.maxArtifactBytes){
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1)fail('invalid file byte bound');
 const stat=statRegular(file,'artifact '+path.basename(file));
 if(stat.size>maxBytes)fail('artifact '+path.basename(file)+' exceeds byte limit');
 return fs.readFileSync(file);
}

export function collectRenderingEvidence(root,limits=RENDERING_EVIDENCE_LIMITS){
 const resolved=path.resolve(root);
 let rootStat;try{rootStat=fs.lstatSync(resolved);}catch(error){fail('evidence root unavailable: '+String(error?.message||error));}
 if(rootStat.isSymbolicLink()||!rootStat.isDirectory())fail('evidence root must be a real directory');
 const records=[];let entries=0,totalJsonBytes=0;
 function walk(directory,depth){
  if(depth>limits.maxDepth)fail('evidence tree exceeds depth limit');
  let children;try{children=fs.readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'));}catch(error){fail('cannot enumerate evidence tree: '+String(error?.message||error));}
  for(const entry of children){
   entries++;if(entries>limits.maxEntries)fail('evidence tree exceeds entry limit');
   const file=path.join(directory,entry.name);let stat;try{stat=fs.lstatSync(file);}catch(error){fail('cannot inspect '+entry.name+': '+String(error?.message||error));}
   if(stat.isSymbolicLink())fail('symbolic links are not admissible evidence: '+entry.name);
   if(stat.isDirectory()){walk(file,depth+1);continue;}
   if(!stat.isFile())fail('non-regular evidence path rejected: '+entry.name);
   if(!entry.name.endsWith('.json'))continue;
   if(records.length>=limits.maxJsonFiles)fail('evidence tree exceeds JSON file limit');
   if(stat.size>limits.maxJsonFileBytes)fail('JSON evidence exceeds per-file byte limit: '+entry.name);
   totalJsonBytes+=stat.size;if(totalJsonBytes>limits.maxJsonBytes)fail('evidence tree exceeds cumulative JSON byte limit');
   let text;try{text=fs.readFileSync(file,'utf8');}catch(error){fail('cannot read JSON evidence '+entry.name+': '+String(error?.message||error));}
   let doc;try{doc=JSON.parse(text);}catch{fail('invalid JSON evidence: '+entry.name);}
   records.push(Object.freeze({file,doc}));
  }
 }
 walk(resolved,0);
 return Object.freeze({root:resolved,records:Object.freeze(records),entries,totalJsonBytes});
}

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import process from 'node:process';

const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

export function immutableBrowserArtifact({root=process.cwd(),consumer='browser'}={}){
 const source=path.resolve(root,process.env.OFU_BROWSER_PRODUCT_PATH||'dist/One_File_Universe.html');
 const manifestPath=path.resolve(root,process.env.OFU_BROWSER_MANIFEST_PATH||'dist/rendering-build-manifest.json');
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 const bytes=fs.readFileSync(source),hash=sha256(bytes);
 if(manifest.productVersion!=='2.0.0'||manifest.releaseLine!=='v2.0.0'||manifest.releaseStatus!=='STABLE_RELEASE'||manifest.candidateOnly!==false)throw new Error('browser evidence requires the full stable V2 artifact');
 if(manifest.artifactSha256!==hash||manifest.artifactBytes!==bytes.length)throw new Error('browser artifact does not match its full-build manifest');
 if(process.env.OFU_SOURCE_SHA&&manifest.sourceCommit!==process.env.OFU_SOURCE_SHA)throw new Error('browser artifact manifest source mismatch');
 const token=String(consumer).replace(/[^A-Za-z0-9._-]/g,'-').slice(0,64)||'browser';
 const dir=path.resolve(root,'dist/evidence/browser-input',manifest.sourceCommit,`${token}-${process.pid}-${hash.slice(0,12)}`);
 fs.mkdirSync(dir,{recursive:true});
 const artifactPath=path.join(dir,'One_File_Universe.html'),frozenManifestPath=path.join(dir,'rendering-build-manifest.json');
 fs.writeFileSync(artifactPath,bytes,{flag:'wx'});fs.writeFileSync(frozenManifestPath,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 try{fs.chmodSync(artifactPath,0o444);fs.chmodSync(frozenManifestPath,0o444);}catch{}
 const verify=()=>{const after=fs.readFileSync(artifactPath),afterHash=sha256(after);if(after.length!==bytes.length||afterHash!==hash)throw new Error('immutable browser artifact changed during evidence transaction');return Object.freeze({artifactPath,manifestPath:frozenManifestPath,sourceCommit:manifest.sourceCommit,bytes:after.length,sha256:afterHash,hashBeforeEqualsAfter:true});};
 return Object.freeze({artifactPath,manifestPath:frozenManifestPath,sourceCommit:manifest.sourceCommit,bytes:bytes.length,sha256:hash,manifest:Object.freeze(manifest),verify});
}

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {composeProductTemplate} from './product-template-compose.mjs';

const root=process.cwd();
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8').replace(/\r\n?/g,'\n');
const artifactPath=path.join(root,'dist','One_File_Universe.html');
const manifestPath=path.join(root,'dist','rendering-build-manifest.json');

execFileSync(process.execPath,['tools/build-ofu-rendering.mjs'],{cwd:root,env:process.env,stdio:['ignore','inherit','inherit']});
const legacy=fs.readFileSync(artifactPath,'utf8').replace(/\r\n?/g,'\n');
const composed=composeProductTemplate(legacy,read);
fs.writeFileSync(artifactPath,composed,'utf8');
const bytes=fs.readFileSync(artifactPath);
const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
const fragmentPaths=['src/bootstrap/product/workspace-nav.html','src/bootstrap/product/viewport.html','src/bootstrap/product/explore-panel.html','src/bootstrap/product/inspect-panel.html','src/bootstrap/product/lab-panel.html'];
const productSourceFragments=fragmentPaths.map(componentId=>{const source=read(componentId);return{componentId,hashAlgorithm:'SHA-256',hash:crypto.createHash('sha256').update(source).digest('hex'),embeddedBytes:Buffer.byteLength(source,'utf8')}});
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
manifest.productSourceComposition='v08-product-template-fragments-1';
manifest.productSourceFragments=productSourceFragments;
manifest.artifactBytes=bytes.length;
manifest.artifactSha256=sha256;
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',sourceCommit:manifest.sourceCommit,artifact:manifest.artifact,artifactBytes:manifest.artifactBytes,artifactSha256:manifest.artifactSha256,productSourceComposition:manifest.productSourceComposition,productSourceFragments},null,2));

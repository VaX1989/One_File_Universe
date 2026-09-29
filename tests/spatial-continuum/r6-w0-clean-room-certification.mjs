import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const root=process.cwd(),artifact=path.join(root,'dist','One_File_Universe_Spatial_Continuum.html'),evidenceDir=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','spatial-continuum-r6-w0-clean-room'));
const run=(command,args=[])=>execFileSync(command,args,{cwd:root,encoding:'utf8',env:process.env}).trim();
const sha256=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const sourceSha=run('git',['rev-parse','HEAD']),sourceTree=run('git',['rev-parse','HEAD^{tree}']),expectedSha=String(process.env.OFU_SOURCE_SHA||sourceSha);
assert.equal(sourceSha,expectedSha,'clean-room checkout must match the exact candidate SHA');
const cleanBefore=run('git',['status','--porcelain','--untracked-files=no']);assert.equal(cleanBefore,'','tracked worktree must be clean before deterministic build certification');
const buildOnce=label=>{fs.rmSync(path.join(root,'dist'),{recursive:true,force:true});execFileSync(process.execPath,['tools/build-spatial-continuum.mjs'],{cwd:root,stdio:'inherit',env:process.env});assert.ok(fs.existsSync(artifact),`${label} must produce the direct-file application`);const bytes=fs.readFileSync(artifact);return Object.freeze({label,sha256:sha256(bytes),bytes:bytes.length,content:bytes})};
const first=buildOnce('build-1'),second=buildOnce('build-2');assert.equal(first.sha256,second.sha256,'continuum builds must have identical SHA-256');assert.equal(first.bytes,second.bytes,'continuum builds must have identical byte length');assert.equal(first.content.equals(second.content),true,'continuum builds must be byte-identical');
const cleanAfterBuild=run('git',['status','--porcelain','--untracked-files=no']);assert.equal(cleanAfterBuild,'','deterministic builds must not mutate tracked source');
const browser=await chromium.launch({headless:true});let browserVersion;try{browserVersion=await browser.version()}finally{await browser.close()}
const playwrightPackage=JSON.parse(fs.readFileSync(path.join(root,'node_modules','playwright','package.json'),'utf8')),npmCommand=process.platform==='win32'?'npm.cmd':'npm',npmVersion=run(npmCommand,['--version']),osRelease=fs.existsSync('/etc/os-release')?fs.readFileSync('/etc/os-release','utf8').trim():null;
const cleanAfter=run('git',['status','--porcelain','--untracked-files=no']);assert.equal(cleanAfter,'','tracked worktree must remain clean after certification');
fs.mkdirSync(evidenceDir,{recursive:true});const output={status:'PASS',suite:'r6-w0-clean-room-deterministic-build',sourceSha,sourceTree,environment:{node:process.version,npm:npmVersion,playwright:playwrightPackage.version,browser:'chromium',browserVersion,platform:process.platform,arch:process.arch,osType:os.type(),osReleaseKernel:os.release(),runnerOsRelease:osRelease},worktree:{cleanBefore:true,cleanAfterBuild:true,cleanAfter:true},builds:[{label:first.label,sha256:first.sha256,bytes:first.bytes},{label:second.label,sha256:second.sha256,bytes:second.bytes}],byteIdentical:true,artifact:'dist/One_File_Universe_Spatial_Continuum.html'};fs.writeFileSync(path.join(evidenceDir,'clean-room-certification.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const repoRoot=path.resolve(here,'../../..');
const fixtureDir=path.join(here,'fixture');
const fixturePackage=JSON.parse(fs.readFileSync(path.join(fixtureDir,'package.json'),'utf8'));
const consumerSource=fs.readFileSync(path.join(fixtureDir,'consumer.mjs'),'utf8');
const PUBLIC_SPECIFIER='one-file-universe/sdk/reference-headless/index.js';

function specifiers(source){
  const out=[];
  const patterns=[
    /\bimport\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bexport\s+[^'";]+?\s+from\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  ];
  for(const pattern of patterns)for(const match of source.matchAll(pattern))out.push(match[1]);
  return out;
}

function assertConsumerImportsOnlyPublicSeam(source){
  const imports=specifiers(source);
  assert.ok(imports.length>0,'consumer fixture must import the public seam');
  for(const item of imports)assert.equal(item,PUBLIC_SPECIFIER,'consumer fixture may import only the supported public headless seam');
  return imports;
}

const consumerImports=assertConsumerImportsOnlyPublicSeam(consumerSource);
assert.throws(
  ()=>assertConsumerImportsOnlyPublicSeam("await import('one-file-universe/src/kernel/p2-canonical.js')"),
  /supported public headless seam/,
  'source-internal imports must be actively rejected by the proof harness'
);
assert.deepEqual(fixturePackage.dependencies,{'one-file-universe':'file:./one-file-universe.tgz'});

function run(command,args,options={}){
  const result=spawnSync(command,args,{encoding:'utf8',maxBuffer:1024*1024,...options});
  if(result.error)throw result.error;
  assert.equal(result.status,0,[command,...args].join(' ')+' failed\nSTDOUT:\n'+result.stdout+'\nSTDERR:\n'+result.stderr);
  return result;
}

function collectClosure(entry,packageRoot){
  const visited=new Set();
  const stack=[entry];
  while(stack.length){
    const file=stack.pop();
    const relative=path.relative(packageRoot,file).split(path.sep).join('/');
    assert.ok(!relative.startsWith('../')&&!path.isAbsolute(relative),'dependency escaped installed package root: '+relative);
    if(visited.has(relative))continue;
    visited.add(relative);
    const source=fs.readFileSync(file,'utf8');
    assert.doesNotMatch(source,/\b(document|window|navigator|canvas|camera|renderer|BABYLON|fetch|WebSocket|XMLHttpRequest|EventSource)\b/,'forbidden browser/product/network global in dependency closure: '+relative);
    for(const item of specifiers(source)){
      assert.ok(item.startsWith('.'),'headless dependency closure contains a bare/package import: '+item+' from '+relative);
      let resolved=path.resolve(path.dirname(file),item);
      if(!path.extname(resolved)&&fs.existsSync(resolved+'.js'))resolved+='.js';
      assert.ok(fs.existsSync(resolved),'unresolved dependency '+item+' from '+relative);
      const depRelative=path.relative(packageRoot,resolved).split(path.sep).join('/');
      assert.ok(!depRelative.startsWith('../')&&!path.isAbsolute(depRelative),'dependency escaped installed package root: '+depRelative);
      assert.ok(
        depRelative.startsWith('sdk/reference-headless/')||
        depRelative.startsWith('src/headless/')||
        depRelative.startsWith('src/kernel/')||
        depRelative.startsWith('src/temporal/'),
        'dependency closure escaped headless/kernel/temporal boundary: '+depRelative
      );
      stack.push(resolved);
    }
  }
  return [...visited].sort();
}

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ofu-ind-ext-consumer-'));
try{
  const packDir=path.join(temp,'pack');
  fs.mkdirSync(packDir,{recursive:true});
  const packed=run('npm',['pack','--json','--pack-destination',packDir],{cwd:repoRoot,timeout:30000});
  const packMeta=JSON.parse(packed.stdout.trim());
  assert.equal(Array.isArray(packMeta),true,'npm pack --json must return an array');
  assert.equal(packMeta.length,1,'npm pack must produce exactly one artifact');
  const tarball=path.join(packDir,packMeta[0].filename);
  assert.ok(fs.existsSync(tarball),'npm pack artifact missing');

  const packedFiles=new Set((packMeta[0].files??[]).map(item=>item.path));
  for(const required of ['package.json','sdk/reference-headless/index.js','src/headless/index.js'])assert.ok(packedFiles.has(required),'packed artifact missing '+required);

  const results=[];
  let closureReference=null;
  for(let runIndex=0;runIndex<2;runIndex++){
    const cleanRoot=path.join(temp,'clean-'+runIndex);
    const staging=path.join(temp,'stage-'+runIndex);
    const packageRoot=path.join(cleanRoot,'node_modules','one-file-universe');
    fs.mkdirSync(staging,{recursive:true});
    fs.mkdirSync(path.dirname(packageRoot),{recursive:true});
    run('tar',['-xzf',tarball,'-C',staging],{timeout:30000});
    fs.renameSync(path.join(staging,'package'),packageRoot);
    fs.copyFileSync(path.join(fixtureDir,'package.json'),path.join(cleanRoot,'package.json'));
    fs.copyFileSync(path.join(fixtureDir,'consumer.mjs'),path.join(cleanRoot,'consumer.mjs'));

    assert.notEqual(fs.realpathSync(packageRoot),fs.realpathSync(repoRoot),'clean consumer must not resolve the source repository as its installed package');
    assert.ok(fs.realpathSync(packageRoot).startsWith(fs.realpathSync(temp)+path.sep),'installed package must live in clean-room temp space');

    const installedPackage=JSON.parse(fs.readFileSync(path.join(packageRoot,'package.json'),'utf8'));
    assert.equal(installedPackage.name,'one-file-universe');
    assert.equal(installedPackage.type,'module');

    const entry=path.join(packageRoot,'sdk','reference-headless','index.js');
    const closure=collectClosure(entry,packageRoot);
    if(closureReference===null)closureReference=closure;
    else assert.deepEqual(closure,closureReference,'dependency closure changed across clean-room runs');

    const child=run(process.execPath,['--max-old-space-size=64','consumer.mjs'],{
      cwd:cleanRoot,
      env:{...process.env,OFU_SOURCE_REPOSITORY_PATH:''},
      timeout:10000,
      maxBuffer:128*1024
    });
    const lines=child.stdout.trim().split(/\r?\n/).filter(Boolean);
    assert.equal(lines.length,1,'consumer must emit one bounded JSON evidence line');
    const parsed=JSON.parse(lines[0]);
    assert.equal(parsed.status,'PASS');
    results.push(parsed);
  }

  assert.deepEqual(results[1],results[0],'independent clean-room executions must reproduce exactly');
  assert.ok(closureReference.length>=3,'dependency closure unexpectedly small');
  console.log('IND-EXT-CONSUMER external seam proof: PASS');
  console.log(JSON.stringify({
    packageArtifact:packMeta[0].filename,
    packageName:packMeta[0].name,
    packageVersion:packMeta[0].version,
    packageSize:packMeta[0].size,
    unpackedSize:packMeta[0].unpackedSize,
    consumerImports,
    dependencyClosure:closureReference,
    cleanRoomRuns:2,
    resourceEnvelope:{nodeOldSpaceMiB:64,timeoutMs:10000,consumerIterations:64},
    witness:results[0].witness
  }));
}finally{
  fs.rmSync(temp,{recursive:true,force:true});
}

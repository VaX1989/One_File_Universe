import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const workflowDir='.github/workflows',repoRoot=fs.realpathSync('.');
const privilegedWriteKeys=new Set([
  'actions','attestations','checks','contents','deployments','discussions','id-token',
  'issues','packages','pages','pull-requests','repository-projects','security-events','statuses',
]);

function normalizedPermissionLine(raw){return raw.replace(/\s+#.*$/,'').trim()}
function unquote(value){value=String(value).trim();if((value.startsWith("'")&&value.endsWith("'"))||(value.startsWith('"')&&value.endsWith('"')))return value.slice(1,-1).trim();return value}
function privilegedPermissionOnLine(raw){
  const line=normalizedPermissionLine(raw),scalar=line.match(/^permissions:\s*(.+)$/);
  if(scalar&&!scalar[1].trim().startsWith('{')&&unquote(scalar[1])==='write-all')return true;
  const direct=line.match(/^([a-z-]+):\s*(.+)$/);
  if(direct&&privilegedWriteKeys.has(direct[1])&&unquote(direct[2])==='write')return true;
  const inline=line.match(/^permissions:\s*\{(.*)\}\s*$/);
  if(inline){for(const entry of inline[1].split(',')){const pair=entry.trim().match(/^["']?([a-z-]+)["']?\s*:\s*(.+)$/);if(pair&&privilegedWriteKeys.has(pair[1])&&unquote(pair[2])==='write')return true}}
  return false;
}
function hasPrivilegedPermission(text){return text.split(/\r?\n/).some(privilegedPermissionOnLine)}
function runtimeVersionValue(line,key){const cleaned=line.replace(/\s+#.*$/,''),match=cleaned.match(new RegExp(`^\\s*${key}:\\s*(.*?)\\s*$`));return match?unquote(match[1]):null}
function usesTargets(text){
  const out=[];
  for(const raw of text.split(/\r?\n/)){
    const line=raw.replace(/\s+#.*$/,'').trim(),match=line.match(/^(?:-\s*)?uses:\s*(.+)$/);
    if(match)out.push(unquote(match[1]));
  }
  return out;
}
function localDependencyFile(target,owner){
  const resolved=path.resolve(repoRoot,target);
  assert(resolved===repoRoot||resolved.startsWith(repoRoot+path.sep),`${owner}: local dependency escapes repository: ${target}`);
  if(fs.existsSync(resolved)&&fs.statSync(resolved).isFile())return resolved;
  for(const name of ['action.yml','action.yaml']){const candidate=path.join(resolved,name);if(fs.existsSync(candidate)&&fs.statSync(candidate).isFile())return candidate}
  throw new Error(`${owner}: local action/workflow dependency is missing an exact-source definition: ${target}`);
}
function assertPinnedTarget(owner,target,seen=new Set()){
  if(target.startsWith('./')){
    const file=localDependencyFile(target,owner),real=fs.realpathSync(file);
    assert(real===repoRoot||real.startsWith(repoRoot+path.sep),`${owner}: local dependency resolves outside repository: ${target}`);
    if(seen.has(real))return 0;
    seen.add(real);
    let count=1;
    for(const nested of usesTargets(fs.readFileSync(real,'utf8')))count+=assertPinnedTarget(file,nested,seen);
    return count;
  }
  if(target.startsWith('docker://')){
    assert(/^docker:\/\/[^@\s]+@sha256:[a-f0-9]{64}$/.test(target),`${owner}: privileged Docker action must use an immutable sha256 image digest: ${target}`);
    return 1;
  }
  assert(/^[^@\s]+@[0-9a-f]{40}$/.test(target),`${owner}: privileged workflow action dependency must be pinned to an immutable 40-hex commit: ${target}`);
  return 1;
}

function assertPrivilegedDependencies(file,text){
  const broad=text.split(/\r?\n/).some(raw=>{const line=normalizedPermissionLine(raw),scalar=line.match(/^permissions:\s*(.+)$/);return Boolean(scalar&&!scalar[1].trim().startsWith('{')&&unquote(scalar[1])==='write-all')});
  assert(!broad,`${file}: write-all is forbidden; grant only the capability the job needs`);
  let actions=0,runtimes=0;const seen=new Set();
  for(const target of usesTargets(text))actions+=assertPinnedTarget(file,target,seen);
  for(const raw of text.split(/\r?\n/))for(const key of ['node-version','python-version']){
    const value=runtimeVersionValue(raw,key);if(value===null)continue;
    assert(/^\d+\.\d+\.\d+$/.test(value),`${file}: privileged workflow ${key} must pin an exact patch version: ${raw.trim()}`);runtimes++;
  }
  return{actions,runtimes};
}

const privilegedWorkflows=fs.readdirSync(workflowDir).filter(name=>/\.ya?ml$/.test(name)).map(name=>`${workflowDir}/${name}`).filter(file=>hasPrivilegedPermission(fs.readFileSync(file,'utf8'))).sort();
assert(privilegedWorkflows.length>0,'expected at least one privileged workflow');
let actions=0,runtimes=0;
for(const file of privilegedWorkflows){const result=assertPrivilegedDependencies(file,fs.readFileSync(file,'utf8'));actions+=result.actions;runtimes+=result.runtimes}

assert.equal(hasPrivilegedPermission('permissions:\n  contents: write\n'),true);
assert.equal(hasPrivilegedPermission('jobs:\n  publish:\n    permissions:\n      pull-requests: "write"\n'),true);
assert.equal(hasPrivilegedPermission('permissions:\n  id-token: write\n'),true,'OIDC minting authority is a privileged credential boundary');
assert.equal(hasPrivilegedPermission('permissions:\n  attestations: write\n'),true);
assert.equal(hasPrivilegedPermission('permissions:\n  pages: write\n'),true);
assert.equal(hasPrivilegedPermission("permissions: 'write-all'\n"),true);
assert.equal(hasPrivilegedPermission('permissions: {contents: read, id-token: write}\n'),true,'inline permission maps must not evade privilege discovery');
assert.equal(hasPrivilegedPermission("permissions: {'contents': 'write', actions: read}\n"),true,'quoted inline permission maps must not evade privilege discovery');
assert.equal(hasPrivilegedPermission('permissions:\n  contents: read\n  # issues: write\n'),false);

const mutableAction=`permissions:\n  contents: write\nsteps:\n  - uses: actions/checkout@v4\n`;
assert.throws(()=>assertPrivilegedDependencies('synthetic-mutable.yml',mutableAction),/immutable 40-hex/);
const floatingRuntime=`permissions:\n  contents: write\nsteps:\n  - uses: actions/setup-node@${'a'.repeat(40)}\n    with:\n      node-version: '24'\n`;
assert.throws(()=>assertPrivilegedDependencies('synthetic-floating.yml',floatingRuntime),/exact patch version/);
const expressionRuntime=`permissions:\n  contents: write\nsteps:\n  - uses: actions/setup-node@${'a'.repeat(40)}\n    with:\n      node-version: \${{ matrix.node }}\n`;
assert.throws(()=>assertPrivilegedDependencies('synthetic-expression.yml',expressionRuntime),/exact patch version/,'matrix/expression runtime selectors must not evade exact privileged runtime pins');
const broadWrite=`permissions: write-all\nsteps:\n  - uses: actions/checkout@${'a'.repeat(40)}\n`;
assert.throws(()=>assertPrivilegedDependencies('synthetic-write-all.yml',broadWrite),/write-all is forbidden/);
const quotedBroadWrite=`permissions: 'write-all'\nsteps:\n  - uses: actions/checkout@${'a'.repeat(40)}\n`;
assert.throws(()=>assertPrivilegedDependencies('synthetic-quoted-write-all.yml',quotedBroadWrite),/write-all is forbidden/);
const missingLocal=`permissions:\n  contents: write\nsteps:\n  - uses: ./.github/actions/definitely-missing\n`;
assert.throws(()=>assertPrivilegedDependencies('synthetic-missing-local.yml',missingLocal),/missing an exact-source definition/,'local privileged actions must resolve to source that can be recursively inspected');
const mutableDocker=`permissions:\n  packages: write\nsteps:\n  - uses: docker://alpine:3.20\n`;
assert.throws(()=>assertPrivilegedDependencies('synthetic-mutable-docker.yml',mutableDocker),/immutable sha256/);
const immutableDocker=`permissions:\n  packages: write\nsteps:\n  - uses: docker://example.invalid/ofu/tool@sha256:${'a'.repeat(64)}\n`;
assert.doesNotThrow(()=>assertPrivilegedDependencies('synthetic-immutable-docker.yml',immutableDocker));

console.log(JSON.stringify({status:'PASS',suite:'privileged-workflow-dependencies',workflows:privilegedWorkflows.length,actions,runtimes,syntheticCases:17,localDependencyTraversal:true,dockerDigestRequired:true}));

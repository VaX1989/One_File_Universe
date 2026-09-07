import fs from 'node:fs';
import assert from 'node:assert/strict';

const workflowDir='.github/workflows';
const privilegedWriteKeys=new Set([
  'actions','attestations','checks','contents','deployments','discussions','id-token',
  'issues','packages','pages','pull-requests','repository-projects','security-events','statuses',
]);

function normalizedPermissionLine(raw){
  return raw.replace(/\s+#.*$/,'').trim();
}
function unquote(value){
  value=String(value).trim();
  if((value.startsWith("'")&&value.endsWith("'"))||(value.startsWith('"')&&value.endsWith('"')))return value.slice(1,-1).trim();
  return value;
}
function privilegedPermissionOnLine(raw){
  const line=normalizedPermissionLine(raw);
  const scalar=line.match(/^permissions:\s*(.+)$/);
  if(scalar&&!scalar[1].trim().startsWith('{')&&unquote(scalar[1])==='write-all')return true;
  const direct=line.match(/^([a-z-]+):\s*(.+)$/);
  if(direct&&privilegedWriteKeys.has(direct[1])&&unquote(direct[2])==='write')return true;
  const inline=line.match(/^permissions:\s*\{(.*)\}\s*$/);
  if(inline){
    for(const entry of inline[1].split(',')){
      const pair=entry.trim().match(/^["']?([a-z-]+)["']?\s*:\s*(.+)$/);
      if(pair&&privilegedWriteKeys.has(pair[1])&&unquote(pair[2])==='write')return true;
    }
  }
  return false;
}
function hasPrivilegedPermission(text){return text.split(/\r?\n/).some(privilegedPermissionOnLine)}

function runtimeVersionValue(line,key){
  const cleaned=line.replace(/\s+#.*$/,'');
  const match=cleaned.match(new RegExp(`^\\s*${key}:\\s*(.*?)\\s*$`));
  if(!match)return null;
  return unquote(match[1]);
}

const immutableRemoteAction=/\buses:\s+[^\s@]+@[0-9a-f]{40}(?:\s+#.*)?$/;
function assertPrivilegedDependencies(file,text){
  const broad=text.split(/\r?\n/).some(raw=>{
    const line=normalizedPermissionLine(raw),scalar=line.match(/^permissions:\s*(.+)$/);
    return Boolean(scalar&&!scalar[1].trim().startsWith('{')&&unquote(scalar[1])==='write-all');
  });
  assert(!broad,`${file}: write-all is forbidden; grant only the capability the job needs`);
  let actions=0,runtimes=0;
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim();
    if(/\buses:\s+/.test(line)){
      const target=line.replace(/^[-]\s*/,'').replace(/^uses:\s+/,'');
      if(target.startsWith('./'))continue;
      assert(immutableRemoteAction.test(line),`${file}: privileged workflow action dependency must be pinned to an immutable 40-hex commit: ${line}`);
      actions++;
    }
    for(const key of ['node-version','python-version']){
      const value=runtimeVersionValue(raw,key);
      if(value===null)continue;
      assert(/^\d+\.\d+\.\d+$/.test(value),`${file}: privileged workflow ${key} must pin an exact patch version: ${line}`);
      runtimes++;
    }
  }
  return{actions,runtimes};
}

const privilegedWorkflows=fs.readdirSync(workflowDir)
  .filter(name=>/\.ya?ml$/.test(name))
  .map(name=>`${workflowDir}/${name}`)
  .filter(file=>hasPrivilegedPermission(fs.readFileSync(file,'utf8')))
  .sort();
assert(privilegedWorkflows.length>0,'expected at least one privileged workflow');

let actions=0,runtimes=0;
for(const file of privilegedWorkflows){
  const result=assertPrivilegedDependencies(file,fs.readFileSync(file,'utf8'));
  actions+=result.actions;runtimes+=result.runtimes;
}

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
const localAction=`permissions:\n  contents: write\nsteps:\n  - uses: ./.github/actions/release-helper\n`;
assert.doesNotThrow(()=>assertPrivilegedDependencies('synthetic-local.yml',localAction));

console.log(JSON.stringify({status:'PASS',suite:'privileged-workflow-dependencies',workflows:privilegedWorkflows.length,actions,runtimes,syntheticCases:15}));

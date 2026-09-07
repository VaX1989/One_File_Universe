import fs from 'node:fs';
import assert from 'node:assert/strict';

const workflowDir='.github/workflows';
const repositoryWriteKeys=new Set([
  'actions','checks','contents','deployments','issues','packages',
  'pull-requests','repository-projects','security-events','statuses',
]);

function normalizedPermissionLine(raw){
  return raw.replace(/\s+#.*$/,'').trim();
}

function hasRepositoryWritePermission(text){
  for(const raw of text.split(/\r?\n/)){
    const line=normalizedPermissionLine(raw);
    if(line==='permissions: write-all')return true;
    const match=line.match(/^([a-z-]+):\s*write$/);
    if(match&&repositoryWriteKeys.has(match[1]))return true;
  }
  return false;
}

function exactRuntimeVersion(line,key){
  const match=line.match(new RegExp(`^\\s*${key}:\\s*['\"]?([^'\"#\\s]+)['\"]?\\s*(?:#.*)?$`));
  if(!match)return null;
  return /^\d+\.\d+\.\d+$/.test(match[1]);
}

const immutableRemoteAction=/\buses:\s+[^\s@]+@[0-9a-f]{40}(?:\s+#.*)?$/;
function assertPrivilegedDependencies(file,text){
  assert(!/^\s*permissions:\s*write-all\s*(?:#.*)?$/m.test(text),`${file}: write-all is forbidden; grant only the repository capability the job needs`);
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
      const exact=exactRuntimeVersion(raw,key);
      if(exact===null)continue;
      assert.equal(exact,true,`${file}: privileged workflow ${key} must pin an exact patch version: ${line}`);
      runtimes++;
    }
  }
  return{actions,runtimes};
}

const privilegedWorkflows=fs.readdirSync(workflowDir)
  .filter(name=>/\.ya?ml$/.test(name))
  .map(name=>`${workflowDir}/${name}`)
  .filter(file=>hasRepositoryWritePermission(fs.readFileSync(file,'utf8')))
  .sort();
assert(privilegedWorkflows.length>0,'expected at least one repository-write workflow');

let actions=0,runtimes=0;
for(const file of privilegedWorkflows){
  const result=assertPrivilegedDependencies(file,fs.readFileSync(file,'utf8'));
  actions+=result.actions;runtimes+=result.runtimes;
}

assert.equal(hasRepositoryWritePermission('permissions:\n  contents: write\n'),true);
assert.equal(hasRepositoryWritePermission('jobs:\n  publish:\n    permissions:\n      pull-requests: write\n'),true);
assert.equal(hasRepositoryWritePermission('permissions: write-all\n'),true);
assert.equal(hasRepositoryWritePermission('permissions:\n  contents: read\n  # issues: write\n'),false);

const mutableAction=`permissions:\n  contents: write\nsteps:\n  - uses: actions/checkout@v4\n`;
assert.throws(()=>assertPrivilegedDependencies('synthetic-mutable.yml',mutableAction),/immutable 40-hex/);
const floatingRuntime=`permissions:\n  contents: write\nsteps:\n  - uses: actions/setup-node@${'a'.repeat(40)}\n    with:\n      node-version: '24'\n`;
assert.throws(()=>assertPrivilegedDependencies('synthetic-floating.yml',floatingRuntime),/exact patch version/);
const broadWrite=`permissions: write-all\nsteps:\n  - uses: actions/checkout@${'a'.repeat(40)}\n`;
assert.throws(()=>assertPrivilegedDependencies('synthetic-write-all.yml',broadWrite),/write-all is forbidden/);
const localAction=`permissions:\n  contents: write\nsteps:\n  - uses: ./.github/actions/release-helper\n`;
assert.doesNotThrow(()=>assertPrivilegedDependencies('synthetic-local.yml',localAction));

console.log(JSON.stringify({status:'PASS',suite:'privileged-workflow-dependencies',workflows:privilegedWorkflows.length,actions,runtimes,syntheticCases:8}));

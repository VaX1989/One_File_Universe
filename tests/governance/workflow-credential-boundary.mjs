import fs from 'node:fs';
import assert from 'node:assert/strict';

const workflowDir='.github/workflows';
const baselineProtectedWorkflows=[
  `${workflowDir}/foundation.yml`,
  `${workflowDir}/post-v1-development.yml`,
  `${workflowDir}/source-reproduction.yml`,
  `${workflowDir}/certified-preview-release.yml`,
  `${workflowDir}/v1-stable-release.yml`,
];
const repositoryWriteKeys=new Set(['actions','checks','contents','deployments','issues','packages','pull-requests','repository-projects','security-events','statuses']);

function hasRepositoryWritePermission(text){
  for(const raw of text.split(/\r?\n/)){
    const line=raw.replace(/\s+#.*$/,'');
    if(/^\s*permissions:\s*write-all\s*$/.test(line))return true;
    const match=line.match(/^\s*([a-z-]+):\s*write\s*$/);
    if(match&&repositoryWriteKeys.has(match[1]))return true;
  }
  return false;
}

const repositoryWriteWorkflows=fs.readdirSync(workflowDir)
  .filter(name=>/\.ya?ml$/.test(name))
  .map(name=>`${workflowDir}/${name}`)
  .filter(file=>hasRepositoryWritePermission(fs.readFileSync(file,'utf8')))
  .sort();
const protectedWorkflows=[...new Set([...baselineProtectedWorkflows,...repositoryWriteWorkflows])].sort();
const checkoutRequired=new Set(baselineProtectedWorkflows);

function checkoutBlocks(text){
  const lines=text.split(/\r?\n/),blocks=[];
  for(let i=0;i<lines.length;i++){
    if(!/\buses:\s+actions\/checkout@/.test(lines[i]))continue;
    const indent=(lines[i].match(/^\s*/)||[''])[0].length;
    const block=[lines[i]];
    for(let j=i+1;j<lines.length;j++){
      const line=lines[j],trim=line.trim(),nextIndent=(line.match(/^\s*/)||[''])[0].length;
      if(trim&&nextIndent<=indent&&/^-\s+/.test(trim))break;
      block.push(line);
    }
    blocks.push(block.join('\n'));
  }
  return blocks;
}

function assertCredentialBoundary(file,text,{requireCheckout=false}={}){
  const blocks=checkoutBlocks(text);
  if(requireCheckout)assert(blocks.length>0,`${file}: expected at least one repository checkout`);
  for(const block of blocks){
    assert(/^\s*persist-credentials:\s*false\s*(?:#.*)?$/m.test(block),`${file}: checkout must not persist GITHUB_TOKEN credentials into the repository`);
  }
  return blocks.length;
}

assert(repositoryWriteWorkflows.length>0,'expected at least one repository-write workflow');
let checkouts=0;
for(const file of protectedWorkflows)checkouts+=assertCredentialBoundary(file,fs.readFileSync(file,'utf8'),{requireCheckout:checkoutRequired.has(file)});

const unsafe=`steps:\n  - uses: actions/checkout@${'a'.repeat(40)}\n    with:\n      ref: deadbeef\n  - name: Untrusted repository test\n    run: node test.mjs\n`;
assert.throws(()=>assertCredentialBoundary('synthetic-unsafe.yml',unsafe),/must not persist GITHUB_TOKEN/);
const mutableUnsafe=`steps:\n  - uses: actions/checkout@v4\n    with:\n      ref: deadbeef\n  - run: node test.mjs\n`;
assert.throws(()=>assertCredentialBoundary('synthetic-mutable-unsafe.yml',mutableUnsafe),/must not persist GITHUB_TOKEN/,'mutable checkout refs must not evade the credential boundary');
const commentSpoof=`steps:\n  - uses: actions/checkout@${'a'.repeat(40)}\n    with:\n      ref: deadbeef\n      # persist-credentials: false\n  - name: Untrusted repository test\n    run: node test.mjs\n`;
assert.throws(()=>assertCredentialBoundary('synthetic-comment-spoof.yml',commentSpoof),/must not persist GITHUB_TOKEN/);
const safe=`steps:\n  - uses: actions/checkout@${'a'.repeat(40)}\n    with:\n      ref: deadbeef\n      persist-credentials: false # credential is intentionally ephemeral\n  - name: Test\n    run: node test.mjs\n`;
assert.equal(assertCredentialBoundary('synthetic-safe.yml',safe),1);
assert.equal(hasRepositoryWritePermission('permissions:\n  contents: write\n'),true);
assert.equal(hasRepositoryWritePermission('jobs:\n  release:\n    permissions:\n      pull-requests: write\n'),true);
assert.equal(hasRepositoryWritePermission('permissions: write-all\n'),true);
assert.equal(hasRepositoryWritePermission('permissions:\n  contents: read\n  # issues: write\n'),false);

console.log(JSON.stringify({status:'PASS',suite:'workflow-credential-boundary',workflows:protectedWorkflows.length,repositoryWriteWorkflows:repositoryWriteWorkflows.length,checkouts,syntheticCases:8}));

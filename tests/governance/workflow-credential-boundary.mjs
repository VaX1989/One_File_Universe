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
const privilegedWriteKeys=new Set([
  'actions','attestations','checks','contents','deployments','discussions','id-token',
  'issues','packages','pages','pull-requests','repository-projects','security-events','statuses',
]);
function normalizedPermissionLine(raw){return raw.replace(/\s+#.*$/,'').trim()}
function unquote(value){value=String(value).trim();if((value.startsWith("'")&&value.endsWith("'"))||(value.startsWith('"')&&value.endsWith('"')))return value.slice(1,-1).trim();return value}
function privilegedPermissionOnLine(raw){
  const line=normalizedPermissionLine(raw);
  const scalar=line.match(/^permissions:\s*(.+)$/);
  if(scalar&&!scalar[1].trim().startsWith('{')&&unquote(scalar[1])==='write-all')return true;
  const direct=line.match(/^([a-z-]+):\s*(.+)$/);
  if(direct&&privilegedWriteKeys.has(direct[1])&&unquote(direct[2])==='write')return true;
  const inline=line.match(/^permissions:\s*\{(.*)\}\s*$/);
  if(inline){for(const entry of inline[1].split(',')){const pair=entry.trim().match(/^["']?([a-z-]+)["']?\s*:\s*(.+)$/);if(pair&&privilegedWriteKeys.has(pair[1])&&unquote(pair[2])==='write')return true}}
  return false;
}
function hasPrivilegedPermission(text){return text.split(/\r?\n/).some(privilegedPermissionOnLine)}

const privilegedWorkflows=fs.readdirSync(workflowDir)
  .filter(name=>/\.ya?ml$/.test(name))
  .map(name=>`${workflowDir}/${name}`)
  .filter(file=>hasPrivilegedPermission(fs.readFileSync(file,'utf8')))
  .sort();
const protectedWorkflows=[...new Set([...baselineProtectedWorkflows,...privilegedWorkflows])].sort();
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

assert(privilegedWorkflows.length>0,'expected at least one privileged workflow');
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
assert.equal(hasPrivilegedPermission('permissions:\n  contents: write\n'),true);
assert.equal(hasPrivilegedPermission('jobs:\n  release:\n    permissions:\n      pull-requests: "write"\n'),true);
assert.equal(hasPrivilegedPermission('permissions:\n  id-token: write\n'),true,'OIDC token minting is a privileged credential boundary');
assert.equal(hasPrivilegedPermission('permissions:\n  attestations: write\n'),true);
assert.equal(hasPrivilegedPermission('permissions:\n  pages: write\n'),true);
assert.equal(hasPrivilegedPermission("permissions: 'write-all'\n"),true);
assert.equal(hasPrivilegedPermission('permissions: {contents: read, id-token: write}\n'),true,'inline permission maps must not evade privilege discovery');
assert.equal(hasPrivilegedPermission("permissions: {'contents': 'write', actions: read}\n"),true,'quoted inline permission maps must not evade privilege discovery');
assert.equal(hasPrivilegedPermission('permissions:\n  contents: read\n  # issues: write\n'),false);

console.log(JSON.stringify({status:'PASS',suite:'workflow-credential-boundary',workflows:protectedWorkflows.length,privilegedWorkflows:privilegedWorkflows.length,checkouts,syntheticCases:13}));

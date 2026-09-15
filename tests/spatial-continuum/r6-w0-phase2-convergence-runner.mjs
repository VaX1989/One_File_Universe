import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root=process.cwd();
const evidenceRoot=path.resolve(process.env.OFU_CONTINUUM_EVIDENCE_DIR||path.join(root,'reports','local','spatial-continuum-r6-w0-phase2-convergence'));
fs.mkdirSync(evidenceRoot,{recursive:true});
const node=process.execPath,npm=process.platform==='win32'?'npm.cmd':'npm';
const suites=[
  {name:'phase2-boot',command:node,args:['tests/spatial-continuum/r6-w0-boot-diagnostic.mjs']},
  {name:'phase2-macro',command:node,args:['tests/spatial-continuum/r6-w0-macro-renderer-browser.mjs']},
  {name:'phase2-surface',command:node,args:['tests/spatial-continuum/r6-w0-surface-handoff-browser.mjs']},
  {name:'phase2-human',command:node,args:['tests/spatial-continuum/r6-w0-human-browser.mjs']},
  {name:'phase2-causal',command:node,args:['tests/spatial-continuum/r6-w0-causal-browser.mjs']},
  {name:'phase2-epistemic',command:node,args:['tests/spatial-continuum/r6-w0-epistemic-renderer-browser.mjs']},
  {name:'phase2-orientation',command:node,args:['tests/spatial-continuum/r6-w0-orientation-browser.mjs']},
  {name:'open-product',command:npm,args:['run','test:continuum:open']},
  {name:'multi-world',command:npm,args:['run','test:continuum:open-generalization']},
  {name:'accessibility-mobile-context',command:npm,args:['run','test:continuum:accessibility-mobile']},
  {name:'visual-sequence',command:npm,args:['run','test:continuum:visual']},
  {name:'performance-resource',command:npm,args:['run','test:continuum:performance']}
];

function runSuite(suite){
  const directory=path.join(evidenceRoot,suite.name);fs.mkdirSync(directory,{recursive:true});
  const started=Date.now();
  console.log(`\n=== R6/W0 CONVERGENCE SUITE ${suite.name} ===`);
  return new Promise(resolve=>{
    const child=spawn(suite.command,suite.args,{cwd:root,stdio:'inherit',env:{...process.env,OFU_CONTINUUM_EVIDENCE_DIR:directory}});
    let timedOut=false;
    const timer=setTimeout(()=>{timedOut=true;child.kill('SIGTERM');setTimeout(()=>child.kill('SIGKILL'),3000).unref()},300000);
    child.on('error',error=>{clearTimeout(timer);resolve({name:suite.name,status:'FAIL',exitCode:null,timedOut,error:String(error?.stack||error),durationMs:Date.now()-started,evidenceDir:path.relative(root,directory)})});
    child.on('exit',(code,signal)=>{clearTimeout(timer);resolve({name:suite.name,status:code===0&&!timedOut?'PASS':'FAIL',exitCode:code,signal:signal||null,timedOut,durationMs:Date.now()-started,evidenceDir:path.relative(root,directory)})});
  });
}

const results=[];
for(const suite of suites){const result=await runSuite(suite);results.push(result);console.log('R6_W0_SUITE_RESULT='+JSON.stringify(result))}
const failures=results.filter(result=>result.status!=='PASS');
const report={contract:'ofu-r6-w0-phase2-convergence-runner-1',sourceSha:process.env.OFU_SOURCE_SHA||null,status:failures.length?'FAIL':'PASS',allMandatorySuitesExecuted:results.length===suites.length,results,failures:failures.map(result=>result.name)};
fs.writeFileSync(path.join(evidenceRoot,'phase2-convergence-runner-results.json'),JSON.stringify(report,null,2)+'\n');
console.log('\nR6_W0_PHASE2_CONVERGENCE_RUNNER='+JSON.stringify(report));
if(failures.length)process.exitCode=1;

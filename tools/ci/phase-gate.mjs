import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {collectGitRoute} from './git-phase-router.mjs';

const PHASES=Object.freeze(['P1','P2','P3','P4','P5','P6']);

function fail(message){throw new Error('OFU historical phase gate: '+message);}

export function normalizeGatePhases(input){
  const values=Array.isArray(input)?input:typeof input==='string'?input.split(','):[];
  if(values.length===0)fail('at least one phase is required');
  const requested=new Set();
  for(const raw of values){
    const phase=String(raw).trim().toUpperCase();
    if(!PHASES.includes(phase))fail('unknown phase '+phase);
    requested.add(phase);
  }
  return Object.freeze(PHASES.filter(phase=>requested.has(phase)));
}

export function evaluateHistoricalPhaseGate({phases,baseRef,baseSha,headSha,execGit}={}){
  const normalizedPhases=normalizeGatePhases(phases);
  const route=collectGitRoute({baseRef,baseSha,headSha,execGit});
  const run=normalizedPhases.some(phase=>route.requiredHistoricalPhases.includes(phase));
  return Object.freeze({
    schema:'ofu-historical-phase-gate-1',
    phases:normalizedPhases,
    run,
    adapterStatus:route.adapterStatus,
    mode:route.mode,
    failClosed:route.failClosed,
    earliestHistoricalPhase:route.earliestHistoricalPhase,
    route,
  });
}

export function formatGithubOutputs(result){
  if(!result||result.schema!=='ofu-historical-phase-gate-1')fail('invalid gate result');
  const earliest=result.earliestHistoricalPhase||'NONE';
  return [
    `run=${result.run?'true':'false'}`,
    `adapter_status=${result.adapterStatus}`,
    `mode=${result.mode}`,
    `fail_closed=${result.failClosed?'true':'false'}`,
    `earliest_phase=${earliest}`,
    `phases=${result.phases.join(',')}`,
    '',
  ].join('\n');
}

export function appendGithubOutputs(result,outputPath=process.env.GITHUB_OUTPUT){
  if(!outputPath)return false;
  fs.appendFileSync(outputPath,formatGithubOutputs(result),{encoding:'utf8'});
  return true;
}

function parseCli(argv){
  const out={phases:null,baseRef:'development/v1.1-quality-exploration',baseSha:null,headSha:null};
  for(let i=0;i<argv.length;i++){
    const flag=argv[i];
    if(!['--phases','--base-ref','--base-sha','--head-sha'].includes(flag)||i+1>=argv.length){
      fail('usage: --phases P1[,P2...] --base-ref REF --base-sha SHA --head-sha SHA');
    }
    const value=argv[++i];
    if(flag==='--phases')out.phases=value;
    if(flag==='--base-ref')out.baseRef=value;
    if(flag==='--base-sha')out.baseSha=value;
    if(flag==='--head-sha')out.headSha=value;
  }
  return out;
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  try{
    const result=evaluateHistoricalPhaseGate(parseCli(process.argv.slice(2)));
    appendGithubOutputs(result);
    process.stdout.write(JSON.stringify(result)+'\n');
  }catch(error){
    process.stderr.write(String(error?.stack||error)+'\n');
    process.exitCode=2;
  }
}

export const HISTORICAL_PHASE_GATE_PHASES=PHASES;

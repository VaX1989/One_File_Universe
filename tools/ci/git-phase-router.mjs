import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {routeHistoricalPhases} from './phase-router.mjs';

const DEFAULT_BASE_REF='development/v1.1-quality-exploration';
const SHA=/^[0-9a-f]{40}$/;
const ZERO_SHA='0'.repeat(40);
const MAX_DIFF_BYTES=1024*1024;

function cleanBaseRef(value){
  if(typeof value!=='string'||value.length===0||value.length>256||/[\u0000-\u001f\u007f]/.test(value))return'UNKNOWN';
  return value;
}
function validSha(value){return typeof value==='string'&&SHA.test(value)&&value!==ZERO_SHA;}
function failClosed(baseRef,reason){
  const route=routeHistoricalPhases({baseRef:cleanBaseRef(baseRef),changedPaths:[]});
  return Object.freeze({...route,adapterStatus:'FAIL_CLOSED',adapterReason:String(reason||'unknown-routing-error').slice(0,512),gitRange:null});
}

export function parseGitNameOnlyZ(input){
  const bytes=Buffer.isBuffer(input)?input:input instanceof Uint8Array?Buffer.from(input):typeof input==='string'?Buffer.from(input,'utf8'):null;
  if(!bytes)throw new Error('git diff output must be bytes or text');
  if(bytes.length>MAX_DIFF_BYTES)throw new Error('git diff output exceeds byte limit');
  if(bytes.length===0)return Object.freeze([]);
  if(bytes[bytes.length-1]!==0)throw new Error('git diff output must be NUL terminated');
  const text=bytes.toString('utf8');
  if(text.includes('\uFFFD'))throw new Error('git diff output must be valid UTF-8');
  const paths=text.slice(0,-1).split('\0');
  if(paths.some(path=>path.length===0))throw new Error('git diff output contains an empty path');
  return Object.freeze(paths);
}

export function routeGitDiff({baseRef=DEFAULT_BASE_REF,baseSha,headSha,diffOutput}={}){
  if(!validSha(baseSha)||!validSha(headSha))return failClosed(baseRef,'invalid-or-zero-git-range');
  try{
    const changedPaths=parseGitNameOnlyZ(diffOutput);
    const route=routeHistoricalPhases({baseRef:cleanBaseRef(baseRef),changedPaths});
    return Object.freeze({...route,adapterStatus:'OK',adapterReason:null,gitRange:Object.freeze({baseSha,headSha,noRenames:true})});
  }catch(error){
    return failClosed(baseRef,'diff-classification:'+String(error?.message||error));
  }
}

export function collectGitRoute({baseRef=DEFAULT_BASE_REF,baseSha,headSha,execGit}={}){
  if(!validSha(baseSha)||!validSha(headSha))return failClosed(baseRef,'invalid-or-zero-git-range');
  const args=['diff','--name-only','-z','--no-renames',`${baseSha}...${headSha}`,'--'];
  try{
    const output=(execGit||((argv)=>execFileSync('git',argv,{encoding:null,maxBuffer:MAX_DIFF_BYTES})))(args);
    return routeGitDiff({baseRef,baseSha,headSha,diffOutput:output});
  }catch(error){
    return failClosed(baseRef,'git-diff:'+String(error?.message||error));
  }
}

function parseCli(argv){
  const out={baseRef:DEFAULT_BASE_REF,baseSha:null,headSha:null};
  for(let i=0;i<argv.length;i++){
    const flag=argv[i];
    if(!['--base-ref','--base-sha','--head-sha'].includes(flag)||i+1>=argv.length)throw new Error('usage: --base-ref REF --base-sha SHA --head-sha SHA');
    const value=argv[++i];
    if(flag==='--base-ref')out.baseRef=value;
    if(flag==='--base-sha')out.baseSha=value;
    if(flag==='--head-sha')out.headSha=value;
  }
  return out;
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  let result;
  try{result=collectGitRoute(parseCli(process.argv.slice(2)));}
  catch(error){result=failClosed(DEFAULT_BASE_REF,'cli:'+String(error?.message||error));}
  process.stdout.write(JSON.stringify(result)+'\n');
}

export const GIT_PHASE_ROUTER_LIMITS=Object.freeze({maxDiffBytes:MAX_DIFF_BYTES,shaPattern:SHA.source});

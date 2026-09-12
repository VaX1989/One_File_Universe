import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {routeHistoricalPhases} from './phase-router.mjs';

const DEFAULT_BASE_REF='development/v1.1-quality-exploration';
const SHA=/^[0-9a-f]{40}$/;
const ZERO_SHA='0'.repeat(40);
const MAX_DIFF_BYTES=1024*1024;
const SUPPORTED_BASE_REFS=new Map([
  ['main','main'],
  ['refs/heads/main','main'],
  [DEFAULT_BASE_REF,DEFAULT_BASE_REF],
  [`refs/heads/${DEFAULT_BASE_REF}`,DEFAULT_BASE_REF],
]);

function cleanBaseRef(value){
  if(typeof value!=='string'||value.length===0||value.length>256||/[\u0000-\u001f\u007f]/.test(value))return'UNKNOWN';
  return value;
}
function supportedBaseRef(value){return SUPPORTED_BASE_REFS.get(cleanBaseRef(value))||null;}
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
  const canonicalBaseRef=supportedBaseRef(baseRef);
  if(!canonicalBaseRef)return failClosed(baseRef,'invalid-or-unsupported-base-ref');
  if(!validSha(baseSha)||!validSha(headSha))return failClosed(canonicalBaseRef,'invalid-or-zero-git-range');
  try{
    const changedPaths=parseGitNameOnlyZ(diffOutput);
    const route=routeHistoricalPhases({baseRef:canonicalBaseRef,changedPaths});
    return Object.freeze({...route,adapterStatus:'OK',adapterReason:null,gitRange:Object.freeze({baseSha,headSha,noRenames:true})});
  }catch(error){
    return failClosed(canonicalBaseRef,'diff-classification:'+String(error?.message||error));
  }
}

export function collectGitRoute({baseRef=DEFAULT_BASE_REF,baseSha,headSha,execGit}={}){
  const canonicalBaseRef=supportedBaseRef(baseRef);
  if(!canonicalBaseRef)return failClosed(baseRef,'invalid-or-unsupported-base-ref');
  if(!validSha(baseSha)||!validSha(headSha))return failClosed(canonicalBaseRef,'invalid-or-zero-git-range');
  const args=['diff','--name-only','-z','--no-renames',`${baseSha}...${headSha}`,'--'];
  try{
    const output=(execGit||((argv)=>execFileSync('git',argv,{encoding:null,maxBuffer:MAX_DIFF_BYTES})))(args);
    return routeGitDiff({baseRef:canonicalBaseRef,baseSha,headSha,diffOutput:output});
  }catch(error){
    return failClosed(canonicalBaseRef,'git-diff:'+String(error?.message||error));
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

export const GIT_PHASE_ROUTER_LIMITS=Object.freeze({maxDiffBytes:MAX_DIFF_BYTES,shaPattern:SHA.source,supportedBaseRefs:Object.freeze([...SUPPORTED_BASE_REFS.keys()])});

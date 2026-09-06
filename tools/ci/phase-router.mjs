const PHASES=Object.freeze(['P1','P2','P3','P4','P5','P6']);
const MAX_PATHS=512;
const MAX_PATH_BYTES=512;

function fail(message){throw new Error('OFU phase router: '+message);}
function phaseClosure(earliest){if(earliest==null)return[];const index=PHASES.indexOf(earliest);if(index<0)fail('unknown phase '+earliest);return PHASES.slice(index);}
function minPhase(a,b){if(a==null)return b;if(b==null)return a;return PHASES[Math.min(PHASES.indexOf(a),PHASES.indexOf(b))];}

export function normalizeChangedPaths(input){
  if(!Array.isArray(input))fail('changed paths must be an array');
  if(input.length>MAX_PATHS)fail('changed path count exceeds '+MAX_PATHS);
  const seen=new Set(),out=[];
  for(const raw of input){
    if(typeof raw!=='string'||raw.length===0)fail('changed path must be a non-empty string');
    if(Buffer.byteLength(raw,'utf8')>MAX_PATH_BYTES)fail('changed path exceeds '+MAX_PATH_BYTES+' bytes');
    if(/[\u0000-\u001f\u007f]/.test(raw))fail('changed path contains control characters');
    if(raw.includes('\\'))fail('changed path must use POSIX separators');
    if(raw.startsWith('/')||/^[A-Za-z]:\//.test(raw))fail('absolute changed path is not allowed');
    const parts=raw.split('/');
    if(parts.some(part=>part===''||part==='.'||part==='..'))fail('changed path is not canonical: '+raw);
    if(!seen.has(raw)){seen.add(raw);out.push(raw);}
  }
  return Object.freeze(out.sort());
}

function classifyPath(path){
  // Frozen foundation / deterministic kernel / generic build inputs fail closed to P1.
  if(/^(src\/(kernel|persistence|generators|bootstrap|workers)\/|tests\/(p1|build)\/|tools\/build-|package\.json$|package-lock\.json$)/.test(path))return['P1','foundation-or-deterministic-core'];
  if(/^tests\/p2\//.test(path)||/^tools\/.*p2/i.test(path)||/^\.github\/workflows\/p2-/.test(path))return['P2','p2-contract'];
  if(/^tests\/p3\//.test(path)||/^tools\/.*p3/i.test(path)||/^\.github\/workflows\/p3-/.test(path)||/^src\/domains\/astronomy\//.test(path))return['P3','p3-spatial-or-astronomy'];
  if(/^tests\/p4\//.test(path)||/^tools\/.*p4/i.test(path)||/^\.github\/workflows\/p4-/.test(path))return['P4','p4-temporal'];
  if(/^tests\/p5(?:-environment-v2)?\//.test(path)||/^tools\/.*p5/i.test(path)||/^\.github\/workflows\/p5-/.test(path)||/^src\/domains\/planetology\//.test(path))return['P5','p5-planetology'];
  if(/^tests\/p6\//.test(path)||/^tools\/.*p6/i.test(path)||/^\.github\/workflows\/p6-/.test(path)||/^src\/domains\/biosphere\//.test(path))return['P6','p6-biosphere'];

  // Cross-cutting shipping-domain code spans phase ownership and therefore fails closed.
  if(/^src\/domains\/v1\//.test(path))return['P1','cross-cutting-v1-domain'];
  if(/^tests\/integration\//.test(path))return['P1','cross-phase-integration'];
  if(/^config\/(?!conformance\/)/.test(path))return['P1','generic-config'];
  if(/^docs\/(adr|foundation)\//.test(path)||/^tools\/(validate-foundation|validate-frontier-docs)\.mjs$/.test(path))return['P1','governance-foundation'];

  // Post-v1 presentation/product surfaces still require the Post-v1 Development Gate,
  // but they do not independently require historical P1-P6 matrices.
  if(/^(src\/(rendering|navigation|exploration|extensions)\/|tests\/(product|wave-iv|extensions)\/|config\/conformance\/)/.test(path))return[null,'post-v1-product-surface'];
  if(/^\.github\/workflows\/(post-v1-development|v11-world-|product-v11-|reliability-phase-router)/.test(path))return[null,'post-v1-workflow'];
  if(/^docs\//.test(path))return[null,'post-v1-documentation'];

  // Unknown repository inputs are deliberately cumulative. This is the fail-closed rule
  // that makes future unclassified files safe until the router is explicitly extended.
  return['P1','unclassified-fail-closed'];
}

export function routeHistoricalPhases({baseRef='development/v1.1-quality-exploration',changedPaths=[]}={}){
  const paths=normalizeChangedPaths(changedPaths);
  const mainTarget=baseRef==='main'||baseRef==='refs/heads/main';
  if(mainTarget){
    return Object.freeze({schema:'ofu-phase-route-1',mode:'CUMULATIVE',baseRef,changedPaths:paths,earliestHistoricalPhase:'P1',requiredHistoricalPhases:PHASES,postV1:true,failClosed:true,reasons:Object.freeze(['main-target-requires-full-cumulative-certification'])});
  }
  if(paths.length===0){
    return Object.freeze({schema:'ofu-phase-route-1',mode:'LANE_TARGETED',baseRef,changedPaths:paths,earliestHistoricalPhase:'P1',requiredHistoricalPhases:PHASES,postV1:true,failClosed:true,reasons:Object.freeze(['empty-change-set-fails-closed'])});
  }
  let earliest=null,failClosed=false;
  const reasons=[];
  for(const path of paths){
    const [phase,reason]=classifyPath(path);
    earliest=minPhase(earliest,phase);
    if(reason.includes('fail-closed')||reason==='cross-cutting-v1-domain'||reason==='cross-phase-integration'||reason==='generic-config'||reason==='governance-foundation')failClosed=true;
    reasons.push(path+':'+reason+(phase?':'+phase:'':));
  }
  const required=phaseClosure(earliest);
  return Object.freeze({schema:'ofu-phase-route-1',mode:'LANE_TARGETED',baseRef,changedPaths:paths,earliestHistoricalPhase:earliest,requiredHistoricalPhases:Object.freeze(required),postV1:true,failClosed,reasons:Object.freeze(reasons)});
}

function parseCli(argv){
  let baseRef='development/v1.1-quality-exploration';const paths=[];
  for(let i=0;i<argv.length;i++){
    if(argv[i]==='--base-ref'){if(i+1>=argv.length)fail('--base-ref requires a value');baseRef=argv[++i];continue;}
    paths.push(argv[i]);
  }
  return {baseRef,changedPaths:paths};
}

if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1]){
  console.log(JSON.stringify(routeHistoricalPhases(parseCli(process.argv.slice(2)))));
}

export const PHASE_ROUTER_LIMITS=Object.freeze({maxPaths:MAX_PATHS,maxPathBytes:MAX_PATH_BYTES,phases:PHASES});

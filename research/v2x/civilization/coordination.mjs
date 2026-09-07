import { assertRecord, int, mulDivFloor, nonNegativeInt, ppm } from '../reference/bounded-math.mjs';
import { CIV_AUTHORITY } from './production.mjs';
const MAX_RESERVE = 1_000_000_000;
const MODES = new Set(['OPERATING','COLLAPSED']);

export function coordinationCapacity(input){assertRecord(input,'input');const institution=ppm(input.institutionCapacityPpm??0),cooperation=ppm(input.cooperationPpm??0),conflict=ppm(input.conflictLoadPpm??0),retained=mulDivFloor(institution,1_000_000-conflict,1_000_000),gain=mulDivFloor(1_000_000-retained,cooperation,1_000_000);return Object.freeze({authority:CIV_AUTHORITY,effectiveCapacityPpm:Math.min(1_000_000,retained+gain),sociologyClaim:false});}

export function collapseRecoveryStep(state,forcing,policy){
  assertRecord(state,'state');assertRecord(forcing,'forcing');assertRecord(policy,'policy');
  const reserve=nonNegativeInt(state.reserve??0,'reserve',MAX_RESERVE),delta=int(forcing.reserveDelta??0,'reserveDelta',-MAX_RESERVE,MAX_RESERVE),unconstrained=reserve+delta;
  if(!Number.isSafeInteger(unconstrained))throw new RangeError('reserve arithmetic overflow');
  const nextReserve=Math.max(0,Math.min(MAX_RESERVE,unconstrained)),lowerBoundRejected=Math.max(0,-unconstrained),capacityRejectedGain=Math.max(0,unconstrained-MAX_RESERVE),collapse=nonNegativeInt(policy.collapseThreshold,'collapseThreshold',MAX_RESERVE),recovery=nonNegativeInt(policy.recoveryThreshold,'recoveryThreshold',MAX_RESERVE),need=int(policy.requiredRecoveryTicks??1,'requiredRecoveryTicks',1,1_000_000);
  if(recovery<collapse)throw new Error('recoveryThreshold must be >= collapseThreshold');
  let mode=state.mode??'OPERATING';if(!MODES.has(mode))throw new Error('invalid coordination mode');
  let ticks=nonNegativeInt(state.recoveryTicks??0,'recoveryTicks',1_000_000);
  if(mode==='OPERATING'&&nextReserve<collapse){mode='COLLAPSED';ticks=0;}else if(mode==='COLLAPSED'){ticks=nextReserve>=recovery?ticks+1:0;if(ticks>=need){mode='OPERATING';ticks=0;}}
  return Object.freeze({authority:CIV_AUTHORITY,reserve:nextReserve,mode,recoveryTicks:ticks,evidence:Object.freeze({openingReserve:reserve,requestedDelta:delta,unconstrainedReserve:unconstrained,lowerBoundRejected,capacityRejectedGain}),nonClaim:'Systems abstraction, not prediction of societal collapse.'});
}

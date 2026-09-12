import { assertRecord,boundedArray,boundedAscii,mulDivFloor,ppm,uniqueIds } from '../reference/bounded-math.mjs';
import { CIV_AUTHORITY,CIV_LIMITS } from './production.mjs';

function causalOrigin(value,label='originEventId'){
  return boundedAscii(value,label,128);
}

export function advanceInfrastructure(assets,forcing){
  boundedArray(assets,'assets',CIV_LIMITS.routes+CIV_LIMITS.institutions);
  uniqueIds(assets,'assets');
  assertRecord(forcing,'forcing');
  const hazard=ppm(forcing.hazardPpm??0);
  return Object.freeze(assets.map(a=>{
    const originEventId=causalOrigin(a.originEventId,`${a.id}.originEventId`);
    const condition=ppm(a.conditionPpm??1_000_000),decayPpm=ppm(a.decayPpm??0),maintenance=ppm(a.maintenancePpm??0);
    const combinedLossPpm=decayPpm+Math.min(1_000_000-decayPpm,hazard);
    const decay=Math.min(condition,mulDivFloor(condition,combinedLossPpm,1_000_000,`infrastructureDecay.${a.id}`));
    const after=condition-decay;
    const restoration=mulDivFloor(1_000_000-after,maintenance,1_000_000,`infrastructureRestoration.${a.id}`);
    return Object.freeze({...a,originEventId,conditionPpm:Math.min(1_000_000,after+restoration),evidence:Object.freeze({decay,restoration,originEventId})});
  }));
}

export function archaeologicalTrace(asset,context){
  assertRecord(asset,'asset');
  assertRecord(context,'context');
  if(asset.originEventId==null||asset.originEventId==='')return Object.freeze({authority:CIV_AUTHORITY,state:'UNSUPPORTED_NO_CAUSAL_ORIGIN',trace:null,empiricalDatingClaim:false});
  const originEventId=causalOrigin(asset.originEventId,'asset.originEventId');
  const assetId=boundedAscii(asset.id,'asset.id',64);
  const retained=Math.max(0,Math.min(1_000_000,Math.floor((ppm(context.materialDurabilityPpm??0)+ppm(context.burialProtectionPpm??0)+ppm(asset.conditionPpm??0)-ppm(context.exposureDamagePpm??0))/2)));
  return Object.freeze({
    authority:CIV_AUTHORITY,
    state:retained>0?'MODEL_TRACE_PERSISTS':'MODEL_TRACE_NOT_PRESERVED',
    trace:Object.freeze({originEventId,assetId,preservationScorePpm:retained}),
    causalOriginRequired:true,
    empiricalDatingClaim:false,
    nonClaim:'Scenario preservation abstraction, not calibrated archaeology.'
  });
}

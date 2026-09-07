(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,Base=O.v2x12MatterContinuity;
if(!V||!Base)throw new Error('V2X-12 unit contract requires matter continuity');
const VERSION='ofu-v2x12-matter-coordinate-unit-contract-1';
const FACTOR_FM=Object.freeze({fm:1n,pm:1000n,angstrom:100000n,nm:1000000n});
function fail(message){throw new Error('OFU V2X-12 coordinate unit contract: '+message)}
function unit(value){const u=String(value??'').trim().toLowerCase();if(!Object.prototype.hasOwnProperty.call(FACTOR_FM,u))fail('unsupported inputUnit '+u);return u}
function decimalText(value,label){
 const s=typeof value==='bigint'?value.toString():typeof value==='number'?(Number.isFinite(value)?String(value):''):typeof value==='string'?value.trim():'';
 if(!/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(s))fail(label+' must be canonical decimal without exponent');
 return s;
}
function exactFm(value,u,label){
 const s=decimalText(value,label),negative=s.startsWith('-'),body=negative?s.slice(1):s,[whole,frac='']=body.split('.'),den=10n**BigInt(frac.length),digits=BigInt((whole||'0')+frac),signed=negative?-digits:digits,num=signed*FACTOR_FM[u];
 if(num%den!==0n)fail(label+' does not convert exactly to integer femtometres');
 const fm=num/den;if(fm<BigInt(Number.MIN_SAFE_INTEGER)||fm>BigInt(Number.MAX_SAFE_INTEGER))fail(label+' exceeds safe femtometre coordinate range');return Number(fm);
}
function normalizeSite(site,index,u){
 if(!site||typeof site!=='object'||Array.isArray(site))fail('atom site '+index+' must be record');
 const hasFm=Object.prototype.hasOwnProperty.call(site,'positionFm'),hasSource=Object.prototype.hasOwnProperty.call(site,'position');
 if(u==='fm'){
  if(!hasFm||hasSource)fail('fm input requires positionFm and forbids source position');
  if(!Array.isArray(site.positionFm)||site.positionFm.length!==3)fail('positionFm must contain three coordinates');
  const positionFm=site.positionFm.map((n,j)=>{if(!Number.isSafeInteger(n))fail('positionFm '+j+' must be a safe integer');return n});
  return {sanitized:{...site,positionFm},source:{siteId:String(site.siteId??('site-'+index)),unit:'fm',position:Object.freeze(positionFm.map(String))}};
 }
 if(hasFm||!hasSource)fail(u+' input requires source position and forbids positionFm');
 if(!Array.isArray(site.position)||site.position.length!==3)fail('source position must contain three coordinates');
 const sourcePosition=site.position.map((n,j)=>decimalText(n,'source position '+j)),positionFm=sourcePosition.map((n,j)=>exactFm(n,u,'source position '+j));
 const {position,...rest}=site;
 return {sanitized:{...rest,positionFm},source:{siteId:String(site.siteId??('site-'+index)),unit:u,position:Object.freeze(sourcePosition)}};
}
function normalizeSpec(spec){
 if(!spec||typeof spec!=='object'||Array.isArray(spec))fail('atomic structure record required');const u=unit(spec.inputUnit);
 if(!Array.isArray(spec.sites)||spec.sites.length>Base.CAPS.sourceAtomSites)fail('atomic sites bound');
 const rows=spec.sites.map((site,i)=>normalizeSite(site,i,u)),requestedRoundingPolicy=String(spec.roundingPolicy??'').trim();
 if(!requestedRoundingPolicy)fail('roundingPolicy required');
 const sanitized={...spec,inputUnit:u,roundingPolicy:u==='fm'?requestedRoundingPolicy:'EXACT_UNIT_CONVERSION_TO_INTEGER_FM',sites:rows.map(x=>x.sanitized)};
 return {unit:u,sanitized,sourceSites:rows.map(x=>x.source),requestedRoundingPolicy};
}
function atomicStructureRecord(spec){
 const normalized=normalizeSpec(spec),base=Base.atomicStructureRecord(normalized.sanitized);
 return V.freezeDeep({...base,sourceCoordinateUnit:normalized.unit,sourceSites:Object.freeze(normalized.sourceSites),sourceCoordinatesPreserved:true,sourceCoordinatesPreservedAsIntegerFm:normalized.unit==='fm',requestedRoundingPolicy:normalized.requestedRoundingPolicy,conversionPolicy:normalized.unit==='fm'?'IDENTITY_INTEGER_FM':'EXACT_UNIT_CONVERSION_TO_INTEGER_FM',unitContractVersion:VERSION});
}
function journey(sourceSpec,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))fail('journey options must be record');if(options.atomicStructure==null)return Base.journey(sourceSpec,options);
 const normalized=normalizeSpec(options.atomicStructure),baseJourney=Base.journey(sourceSpec,{...options,atomicStructure:normalized.sanitized}),strictAtomic=atomicStructureRecord(options.atomicStructure);
 if(baseJourney.atomicSourceStructure?.recordId!==strictAtomic.recordId)fail('atomic structure record identity changed during unit normalization');
 return V.freezeDeep({...baseJourney,atomicSourceStructure:strictAtomic});
}
O.v2x12MatterContinuity=Object.freeze({...Base,atomicStructureRecord,journey,unitContractVersion:VERSION,coordinateUnits:Object.freeze(Object.keys(FACTOR_FM))});
})(globalThis);

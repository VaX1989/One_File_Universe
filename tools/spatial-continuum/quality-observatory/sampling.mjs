import { canonicalJson, sha256 } from './canonical.mjs';

const requiredArray=(value,name)=>{
  if(!Array.isArray(value)||!value.length)throw new Error(`${name} must be a non-empty array`);
  return [...value];
};

export const exactWitnessKey = witness => [witness.address,witness.seed,witness.modelVersion,witness.stage??'',witness.sampleId??''].map(value=>String(value)).join('|');

export function planDeterministicSweep({campaignId,campaignSeed,addresses,seeds,modelVersions,stages=['UNSPECIFIED'],limit=64,maxCandidateProduct=100000}){
  for(const [name,value] of Object.entries({campaignId,campaignSeed}))if(!String(value??'').length)throw new Error(`${name} is required`);
  const a=requiredArray(addresses,'addresses'),s=requiredArray(seeds,'seeds'),m=requiredArray(modelVersions,'modelVersions'),g=requiredArray(stages,'stages');
  const product=a.length*s.length*m.length*g.length;
  if(product>maxCandidateProduct)throw new Error(`candidate product ${product} exceeds maxCandidateProduct ${maxCandidateProduct}`);
  const candidates=[];
  for(const address of a)for(const seed of s)for(const modelVersion of m)for(const stage of g){
    const witness={address:String(address),seed:String(seed),modelVersion:String(modelVersion),stage:String(stage)};
    const rank=sha256({campaignId:String(campaignId),campaignSeed:String(campaignSeed),witness});
    candidates.push({rank,witness});
  }
  candidates.sort((left,right)=>left.rank.localeCompare(right.rank)||exactWitnessKey(left.witness).localeCompare(exactWitnessKey(right.witness)));
  const selected=candidates.slice(0,Math.min(Math.max(0,Number(limit)||0),candidates.length)).map(({rank,witness},index)=>({index,rank,witness}));
  return {
    contract:'ofu.r6.quality-observatory.sampling-plan.v1',
    campaignId:String(campaignId),
    campaignSeed:String(campaignSeed),
    candidateCount:candidates.length,
    selectedCount:selected.length,
    selectionMethod:'SHA256_RANK_OVER_CANONICAL_CROSS_PRODUCT',
    orderIndependent:true,
    selected,
    planHash:sha256(canonicalJson(selected))
  };
}

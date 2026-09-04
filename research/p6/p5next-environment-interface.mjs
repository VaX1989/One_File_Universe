import {
  P6_READINESS_CONTRACT,
  CONTRACT_ID as P5_FRONTIER_CONTRACT,
  BASE_CONTRACT as P5_BASE_CONTRACT,
  AUTHORITY as P5_RESEARCH_AUTHORITY
} from '../p5-environment-next-science/environment-next-frontier-v3.mjs';
import {
  RESEARCH_CONTRACT as P6_RESEARCH_CONTRACT,
  RESEARCH_MODEL as P6_RESEARCH_MODEL,
  RESEARCH_AUTHORITY as P6_FIXTURE_AUTHORITY,
  validateResearchEnvironment
} from './biology-v2-bounded.mjs';

export const CONTRACT_ID='ofu-p6-p5next-environment-adapter-research-v1';
export const AUTHORITY='P6_RESEARCH_DEPENDENCY_ADAPTER_ONLY';
export const MODE='POST_GENESIS_RESEARCH_FIXTURE_ONLY';
export const P5_DEPENDENCY=Object.freeze({
  frontierContract:P5_FRONTIER_CONTRACT,
  baseContract:P5_BASE_CONTRACT,
  readinessContract:P6_READINESS_CONTRACT,
  authority:P5_RESEARCH_AUTHORITY,
  positiveCanonicalPath:false
});
export const EVIDENCE=Object.freeze({
  adapter:Object.freeze({authority:AUTHORITY,evidenceClass:'ESTABLISHED',fidelity:'FORMAL',provenance:'exact research-contract validation and fail-closed mapping',dependencies:Object.freeze([P5_FRONTIER_CONTRACT,P6_RESEARCH_CONTRACT]),failureSemantics:'REJECT_OR_ABSTAIN'}),
  fixtureSeparation:Object.freeze({authority:AUTHORITY,evidenceClass:'ESTABLISHED',fidelity:'FORMAL',provenance:'explicit P6 fixture authority and source binding',dependencies:Object.freeze([P6_RESEARCH_CONTRACT]),failureSemantics:'NO_POST_GENESIS_RESEARCH_WHEN_FIXTURE_AUTHORITY_OR_BINDING_FAILS'})
});
function fail(m){throw new Error('P6 P5-next research adapter: '+m)}
function exact(o,keys,n){if(!o||typeof o!=='object'||Array.isArray(o))fail(n+' must be map');const a=Object.keys(o).sort(),b=[...keys].sort();if(a.length!==b.length||a.some((x,i)=>x!==b[i]))fail(n+' fields invalid');return o}
function text(v,n){if(typeof v!=='string'||!v.length)fail(n+' must be non-empty text');return v}
function has(a,v){return Array.isArray(a)&&a.includes(v)}
export function validateP5ReadinessWitness(w){
  exact(w,['contractId','authority','sourceContract','epistemicStatus','canAuthorizeBiology','canonicalGenesisAvailable','persistentLineageTransitionsAuthorized','mandatoryForFuturePositiveEligibility','optionalContextNotByItselfEligibility','insufficient','unsupported','diagnostics','failureSemantics','evidence'],'P5 readiness witness');
  if(w.contractId!==P6_READINESS_CONTRACT||w.authority!==P5_RESEARCH_AUTHORITY||w.sourceContract!==P5_BASE_CONTRACT)fail('P5 readiness identity mismatch');
  if(w.epistemicStatus!=='INSUFFICIENT_ENVIRONMENT'||w.canAuthorizeBiology!==false||w.canonicalGenesisAvailable!==false||w.persistentLineageTransitionsAuthorized!==false||w.failureSemantics!=='ABSTAIN_FAIL_CLOSED')fail('P5 readiness must remain fail-closed');
  for(const key of ['mandatoryForFuturePositiveEligibility','optionalContextNotByItselfEligibility','insufficient','unsupported'])if(!Array.isArray(w[key]))fail(key+' must be array');
  for(const required of ['canonicalVolatileStateProducer','viableBiologicalMediumState','usablePhototrophicOrChemotrophicEnergyState','nutrientRedoxValidityState','abiogenesisTrigger'])if(!has(w.unsupported,required))fail('P5 witness omitted unsupported '+required);
  if(!w.evidence||w.evidence.evidenceClass!=='ESTABLISHED'||w.evidence.fidelity!=='FORMAL')fail('P5 readiness evidence metadata mismatch');
  return w;
}
export function canonicalEligibilityFromP5Next(witness){
  validateP5ReadinessWitness(witness);
  return Object.freeze({contractId:CONTRACT_ID,authority:AUTHORITY,sourceReadinessContract:witness.contractId,state:'INSUFFICIENT_ENVIRONMENT',canGenerateBiosphere:false,biologyEstablished:false,canonicalGenesisAvailable:false,persistentLineageTransitionsAuthorized:false,reason:'P5_NEXT_RESEARCH_DOES_NOT_ESTABLISH_POSITIVE_BIOLOGY_PREREQUISITES',unknown:Object.freeze([...witness.insufficient]),unsupported:Object.freeze([...witness.unsupported]),evidence:EVIDENCE.adapter});
}
export function postGenesisFixtureEligibility({p5ReadinessWitness,researchEnvironment}){
  const p5=canonicalEligibilityFromP5Next(p5ReadinessWitness),env=validateResearchEnvironment(researchEnvironment);
  text(env.sourceContract,'researchEnvironment.sourceContract');text(env.sourceModel,'researchEnvironment.sourceModel');
  const sourceMatchesP5Next=env.sourceContract===P5_FRONTIER_CONTRACT||env.sourceContract===P5_BASE_CONTRACT;
  if(!sourceMatchesP5Next)fail('research fixture must bind to the exact P5-next research contract family');
  if(env.authority!==P6_FIXTURE_AUTHORITY)fail('research fixture authority mismatch');
  return Object.freeze({contractId:CONTRACT_ID,authority:AUTHORITY,mode:MODE,p5CanonicalEligibility:p5,canGenerateBiosphere:false,canonicalGenesisAvailable:false,canExercisePostGenesisTransitions:true,fixtureIsCanonicalPlanetFact:false,fixtureEnvironmentAuthority:env.authority,fixtureSourceContract:env.sourceContract,p6ResearchContract:P6_RESEARCH_CONTRACT,p6ResearchModel:P6_RESEARCH_MODEL,evidence:EVIDENCE.fixtureSeparation});
}
export function dependencyStatus(){return Object.freeze({contractId:CONTRACT_ID,p5:P5_DEPENDENCY,p6:Object.freeze({contract:P6_RESEARCH_CONTRACT,model:P6_RESEARCH_MODEL}),canonicalPositivePath:false,postGenesisFixturePath:true,abiogenesisEstablished:false,readiness:'ORACLE_READY'});}

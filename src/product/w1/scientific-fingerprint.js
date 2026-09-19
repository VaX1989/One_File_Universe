import {
  W1_AUTHORITY,
  W1_FINGERPRINT_STATUS,
  createScientificFingerprint,
  createScientificFingerprintRef,
  serializeW1Contract
} from '../contracts/w1-observation-contracts.js';

export const SCIENTIFIC_FINGERPRINT_PROVIDER_VERSION='ofu-prod-w1-scientific-fingerprint-provider-1';
export const SCIENTIFIC_FINGERPRINT_PROVIDER_ID='ofu.product.w1.scientific-fingerprint';

const WORLD_CONTRACT='ofu-r6-world-generative-state-1';
const SCIENTIFIC_STATE_CONTRACT='ofu-r6-world-scientific-state-1';
const DOMAIN_KEYS=Object.freeze(['identity','astronomy','physicalPlanet','environment','surface','sample']);
const KNOWN_AUTHORITY=new Set([
  W1_AUTHORITY.CANONICAL,
  W1_AUTHORITY.MODEL_DERIVED,
  W1_AUTHORITY.ANALYSIS_ONLY,
  W1_AUTHORITY.PRESENTATION_ONLY,
  W1_AUTHORITY.UNKNOWN
]);

function fail(message){throw new Error('OFU Scientific Fingerprint: '+message)}
function normalizeAuthority(value){const text=String(value??'').toUpperCase();return KNOWN_AUTHORITY.has(text)?text:W1_AUTHORITY.UNKNOWN}
function frozenRecord(entries){return Object.freeze(Object.fromEntries(entries))}
function sortedUnique(values){return Object.freeze([...new Set(values.filter(value=>typeof value==='string'&&value.trim()).map(value=>value.normalize('NFC')))].sort())}
function authorityByDomain(scientificState,{unknown=false}={}){
  const source=scientificState?.authority||{};
  return frozenRecord(DOMAIN_KEYS.map(key=>[
    key,
    unknown?(key==='identity'?W1_AUTHORITY.CANONICAL:W1_AUTHORITY.UNKNOWN):normalizeAuthority(source[key])
  ]));
}
function requireHash(value,label,{nullable=false}={}){
  if(value===null&&nullable)return null;
  if(typeof value!=='string'||!/^[0-9a-f]{64}$/.test(value))fail(label+' must be a lowercase 32-byte digest');
  return value;
}
function validateSubjectBinding(subject,scientificState){
  if(subject.universeId!==String(scientificState.universeId))fail('subject universe does not match scientific state');
  const canonicalId=String(scientificState?.planet?.canonicalId||'').toLowerCase();
  if(subject.canonicalId!==canonicalId)fail('subject canonical identity does not match scientific state');
}
function validateWorldState(worldState){
  if(!worldState||typeof worldState!=='object')fail('world state is required');
  if(worldState.contract!==WORLD_CONTRACT)fail('unsupported world state contract');
  const scientificState=worldState.scientificState;
  if(!scientificState||scientificState.contract!==SCIENTIFIC_STATE_CONTRACT)fail('unsupported scientific state contract');
  if(!worldState.versions||worldState.versions.scientificModel!==scientificState.scientificModelVersion)fail('scientific model version mismatch');
  if(typeof worldState.versions.generator!=='string'||!worldState.versions.generator)fail('generator version is required');
  const hashes=worldState.scientificHashes;
  if(!hashes||typeof hashes!=='object')fail('scientific hashes are required');
  return Object.freeze({
    scientificState,
    hashes:Object.freeze({
      planet:requireHash(hashes.planet,'planet hash',{nullable:true}),
      context:requireHash(hashes.context,'context hash'),
      surface:requireHash(hashes.surface,'surface hash',{nullable:true}),
      sample:requireHash(hashes.sample,'sample hash',{nullable:true})
    })
  });
}
function sourceAuthorityForPath(path,scientificState){
  if(path.startsWith('stellar.'))return normalizeAuthority(scientificState.authority?.astronomy);
  if(path.startsWith('planet.'))return normalizeAuthority(scientificState.authority?.physicalPlanet);
  if(path.startsWith('environment.'))return normalizeAuthority(scientificState.authority?.environment);
  if(path.startsWith('surface.'))return normalizeAuthority(scientificState.authority?.surface);
  if(path.startsWith('sample.'))return normalizeAuthority(scientificState.authority?.sample);
  return W1_AUTHORITY.UNKNOWN;
}

export function projectScientificProvenance(worldState){
  const {scientificState}=validateWorldState(worldState);
  const trace=worldState.causalTrace||{};
  const edges=[...(Array.isArray(trace.influences)?trace.influences:[])].map(item=>Object.freeze({
    from:String(item?.from||''),
    to:String(item?.to||''),
    mode:String(item?.mode||''),
    sourceAuthority:sourceAuthorityForPath(String(item?.from||''),scientificState),
    projectionAuthority:W1_AUTHORITY.ANALYSIS_ONLY,
    downstreamAuthority:W1_AUTHORITY.PRESENTATION_ONLY,
    scientificClaim:false
  })).sort((left,right)=>left.from.localeCompare(right.from)||left.to.localeCompare(right.to)||left.mode.localeCompare(right.mode));
  const exclusions=[...(Array.isArray(trace.doesNotInfluence)?trace.doesNotInfluence:[])].map(item=>Object.freeze({
    from:String(item?.from||''),
    to:String(item?.to||''),
    relation:'DOES_NOT_INFLUENCE_SCIENTIFIC_STATE'
  })).sort((left,right)=>left.from.localeCompare(right.from)||left.to.localeCompare(right.to));
  return Object.freeze({
    contract:'ofu-prod-w1-scientific-provenance-projection-1',
    providerVersion:SCIENTIFIC_FINGERPRINT_PROVIDER_VERSION,
    authority:W1_AUTHORITY.ANALYSIS_ONLY,
    sourceScientificStateContract:scientificState.contract,
    sourceScientificModelVersion:scientificState.scientificModelVersion,
    edges:Object.freeze(edges),
    exclusions:Object.freeze(exclusions),
    unknown:sortedUnique(Array.isArray(trace.unknown)?trace.unknown:[]),
    scientificClaimsAdded:false
  });
}

export function createUnknownScientificFingerprint({subject,limitations=[]}={}){
  return createScientificFingerprint({
    status:W1_FINGERPRINT_STATUS.UNKNOWN,
    subject,
    scientificStateContract:SCIENTIFIC_STATE_CONTRACT,
    scientificModelVersion:null,
    generatorVersion:null,
    scientificHashes:{planet:null,context:null,surface:null,sample:null},
    authorityByDomain:authorityByDomain(null,{unknown:true}),
    limitations:sortedUnique([
      'Scientific state is unavailable; no scientific hash or model consequence is asserted.',
      ...limitations
    ])
  });
}

export function projectScientificFingerprint({subject,worldState=null,limitations=[]}={}){
  if(!subject||typeof subject!=='object')fail('canonical subject reference is required');
  if(worldState===null){
    const fingerprint=createUnknownScientificFingerprint({subject,limitations});
    return Object.freeze({
      provider:SCIENTIFIC_FINGERPRINT_PROVIDER,
      fingerprint,
      fingerprintRef:null,
      canonicalFingerprint:serializeW1Contract(fingerprint),
      provenance:null
    });
  }
  const {scientificState,hashes}=validateWorldState(worldState);
  validateSubjectBinding(subject,scientificState);
  const authority=authorityByDomain(scientificState);
  const fingerprint=createScientificFingerprint({
    status:W1_FINGERPRINT_STATUS.PRESENT,
    subject,
    scientificStateContract:scientificState.contract,
    scientificModelVersion:scientificState.scientificModelVersion,
    generatorVersion:worldState.versions.generator,
    scientificHashes:hashes,
    authorityByDomain:authority,
    limitations:sortedUnique([
      'Fingerprint hashes identify governed scientific/model state; they do not promote model-derived outputs to canonical science.',
      'Presentation consequences remain non-canonical and are excluded from scientific hash authority.',
      ...(Array.isArray(worldState.causalTrace?.unknown)?worldState.causalTrace.unknown:[]),
      ...limitations
    ])
  });
  const fingerprintRef=createScientificFingerprintRef({
    subjectCanonicalId:subject.canonicalId,
    contextHash:fingerprint.scientificHashes.context,
    scientificStateContract:fingerprint.scientificStateContract,
    scientificModelVersion:fingerprint.scientificModelVersion
  });
  return Object.freeze({
    provider:SCIENTIFIC_FINGERPRINT_PROVIDER,
    fingerprint,
    fingerprintRef,
    canonicalFingerprint:serializeW1Contract(fingerprint),
    provenance:projectScientificProvenance(worldState)
  });
}

export const SCIENTIFIC_FINGERPRINT_PROVIDER=Object.freeze({
  id:SCIENTIFIC_FINGERPRINT_PROVIDER_ID,
  version:SCIENTIFIC_FINGERPRINT_PROVIDER_VERSION,
  authority:W1_AUTHORITY.ANALYSIS_ONLY,
  canonicalPromotion:false,
  mutatesScientificState:false,
  mutatesProductState:false,
  operations:Object.freeze(['PROJECT','INSPECT'])
});

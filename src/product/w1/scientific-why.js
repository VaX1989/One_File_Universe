import {
  W1_AUTHORITY,
  W1_FINGERPRINT_STATUS
} from '../contracts/w1-observation-contracts.js';
import {
  SCIENTIFIC_FINGERPRINT_PROVIDER_ID,
  SCIENTIFIC_FINGERPRINT_PROVIDER_VERSION,
  projectScientificFingerprint
} from './scientific-fingerprint.js';
import {
  hashGenerativeState,
  stableGenerativeString
} from '../../experiments/spatial-continuum/generative-contract.js';

export const SCIENTIFIC_WHY_PROVIDER_ID='ofu.product.w1.scientific-why';
export const SCIENTIFIC_WHY_PROVIDER_VERSION='ofu-prod-w1-scientific-why-provider-1';
export const SCIENTIFIC_WHY_GRAPH_CONTRACT='ofu-prod-w1-scientific-why-graph-1';
export const SCIENTIFIC_WHY_INSPECTION_CONTRACT='ofu-prod-w1-scientific-why-inspection-1';

export const SCIENTIFIC_WHY_AUTHORITY=Object.freeze({
  ...W1_AUTHORITY,
  UNSUPPORTED:'UNSUPPORTED'
});
export const SCIENTIFIC_WHY_STATUS=Object.freeze({
  SUPPORTED:'SUPPORTED',
  UNKNOWN:'UNKNOWN',
  UNSUPPORTED:'UNSUPPORTED'
});
export const SCIENTIFIC_WHY_NODE_TYPE=Object.freeze({
  SUBJECT:'SUBJECT',
  FINGERPRINT:'FINGERPRINT',
  MODEL:'MODEL',
  SCIENTIFIC_DOMAIN:'SCIENTIFIC_DOMAIN',
  SCIENTIFIC_PROPERTY:'SCIENTIFIC_PROPERTY',
  MODEL_OUTPUT:'MODEL_OUTPUT',
  PRESENTATION_CONSEQUENCE:'PRESENTATION_CONSEQUENCE',
  OBSERVATION:'OBSERVATION',
  CONTROL_STATE:'CONTROL_STATE',
  ASSUMPTION:'ASSUMPTION',
  LIMITATION:'LIMITATION',
  UNCERTAINTY:'UNCERTAINTY'
});
export const SCIENTIFIC_WHY_EDGE_TYPE=Object.freeze({
  SUBJECT_BINDING:'SUBJECT_BINDING',
  FINGERPRINT_DOMAIN:'FINGERPRINT_DOMAIN',
  MODEL_APPLICABILITY:'MODEL_APPLICABILITY',
  MODEL_CONDITIONED_PRESENTATION:'MODEL_CONDITIONED_PRESENTATION',
  EXPLICIT_NON_INFLUENCE:'EXPLICIT_NON_INFLUENCE',
  FINGERPRINT_LIMITATION:'FINGERPRINT_LIMITATION',
  ASSUMPTION_APPLIES:'ASSUMPTION_APPLIES',
  UNCERTAINTY_APPLIES:'UNCERTAINTY_APPLIES',
  CAUSES:'CAUSES',
  CONSTRAINS:'CONSTRAINS',
  CORRELATES:'CORRELATES',
  UNKNOWN:'UNKNOWN',
  UNSUPPORTED:'UNSUPPORTED'
});
export const SCIENTIFIC_WHY_UNCERTAINTY_KIND=Object.freeze({
  INTERVAL:'INTERVAL',
  DISTRIBUTION:'DISTRIBUTION',
  QUALITATIVE:'QUALITATIVE',
  UNKNOWN:'UNKNOWN'
});
export const SCIENTIFIC_WHY_DEFAULT_LIMITS=Object.freeze({
  maxNodes:256,
  maxEdges:512,
  maxCandidates:128,
  maxAssumptions:64,
  maxUncertainties:64,
  maxTextBytes:2048,
  maxParameterBytes:4096,
  maxInspectionDepth:16,
  maxInspectionEdges:128
});

const enc=new TextEncoder();
const NODE_TYPES=new Set(Object.values(SCIENTIFIC_WHY_NODE_TYPE));
const EDGE_TYPES=new Set(Object.values(SCIENTIFIC_WHY_EDGE_TYPE));
const AUTHORITY_VALUES=new Set(Object.values(SCIENTIFIC_WHY_AUTHORITY));
const UNCERTAINTY_KINDS=new Set(Object.values(SCIENTIFIC_WHY_UNCERTAINTY_KIND));
const CANDIDATE_RELATIONS=new Set([
  SCIENTIFIC_WHY_EDGE_TYPE.CAUSES,
  SCIENTIFIC_WHY_EDGE_TYPE.CONSTRAINS,
  SCIENTIFIC_WHY_EDGE_TYPE.CORRELATES,
  SCIENTIFIC_WHY_EDGE_TYPE.UNKNOWN,
  SCIENTIFIC_WHY_EDGE_TYPE.UNSUPPORTED
]);
const AUTHORITY_RANK=Object.freeze({
  [SCIENTIFIC_WHY_AUTHORITY.UNSUPPORTED]:0,
  [W1_AUTHORITY.UNKNOWN]:1,
  [W1_AUTHORITY.PRESENTATION_ONLY]:2,
  [W1_AUTHORITY.ANALYSIS_ONLY]:3,
  [W1_AUTHORITY.MODEL_DERIVED]:4,
  [W1_AUTHORITY.CANONICAL]:5
});
const STATUS_RANK=Object.freeze({
  [SCIENTIFIC_WHY_STATUS.UNSUPPORTED]:0,
  [SCIENTIFIC_WHY_STATUS.UNKNOWN]:1,
  [SCIENTIFIC_WHY_STATUS.SUPPORTED]:2
});
const GRAPH_HASH_NAMESPACE='OFU_PRODUCT_SCIENTIFIC_WHY_GRAPH_V1';
const NODE_HASH_NAMESPACE='OFU_PRODUCT_SCIENTIFIC_WHY_NODE_V1';
const EDGE_HASH_NAMESPACE='OFU_PRODUCT_SCIENTIFIC_WHY_EDGE_V1';

function fail(message){throw new Error('OFU Scientific WHY: '+message)}
function plain(value){if(!value||typeof value!=='object'||Array.isArray(value))return false;const p=Object.getPrototypeOf(value);return p===Object.prototype||p===null}
function exactKeys(value,expected,label){
  if(!plain(value))fail(label+' must be a plain object');
  const keys=Object.keys(value).sort(),want=[...expected].sort();
  if(keys.length!==want.length||keys.some((key,index)=>key!==want[index]))fail(label+' has missing or unsupported fields');
}
function boundedInteger(value,label,min,max){
  if(!Number.isSafeInteger(value)||value<min||value>max)fail(label+' out of bounds');
  return value;
}
function text(value,label,{maxBytes=SCIENTIFIC_WHY_DEFAULT_LIMITS.maxTextBytes}={}){
  if(typeof value!=='string')fail(label+' must be text');
  const normalized=value.normalize('NFC').trim();
  if(!normalized)fail(label+' must be non-empty');
  if(enc.encode(normalized).length>maxBytes)fail(label+' exceeds byte limit');
  return normalized;
}
function enumValue(value,allowed,label){
  const normalized=text(value,label,{maxBytes:128}).toUpperCase();
  if(!allowed.has(normalized))fail(label+' is unsupported: '+normalized);
  return normalized;
}
function authority(value,label){
  return enumValue(value,AUTHORITY_VALUES,label);
}
function knowledgeFromAuthority(value){
  if(value===SCIENTIFIC_WHY_AUTHORITY.UNSUPPORTED)return SCIENTIFIC_WHY_STATUS.UNSUPPORTED;
  if(value===W1_AUTHORITY.UNKNOWN)return SCIENTIFIC_WHY_STATUS.UNKNOWN;
  return SCIENTIFIC_WHY_STATUS.SUPPORTED;
}
function lowerAuthority(...values){
  return values.map((value,index)=>authority(value,'authority['+index+']')).reduce((lowest,value)=>
    AUTHORITY_RANK[value]<AUTHORITY_RANK[lowest]?value:lowest
  );
}
function lowerStatus(...values){
  return values.reduce((lowest,value)=>STATUS_RANK[value]<STATUS_RANK[lowest]?value:lowest);
}
function normalizeLimits(input={}){
  if(!plain(input))fail('limits must be a plain object');
  const allowed=new Set(Object.keys(SCIENTIFIC_WHY_DEFAULT_LIMITS));
  for(const key of Object.keys(input))if(!allowed.has(key))fail('unsupported limit: '+key);
  return Object.freeze({
    maxNodes:boundedInteger(input.maxNodes??SCIENTIFIC_WHY_DEFAULT_LIMITS.maxNodes,'maxNodes',8,4096),
    maxEdges:boundedInteger(input.maxEdges??SCIENTIFIC_WHY_DEFAULT_LIMITS.maxEdges,'maxEdges',8,8192),
    maxCandidates:boundedInteger(input.maxCandidates??SCIENTIFIC_WHY_DEFAULT_LIMITS.maxCandidates,'maxCandidates',0,2048),
    maxAssumptions:boundedInteger(input.maxAssumptions??SCIENTIFIC_WHY_DEFAULT_LIMITS.maxAssumptions,'maxAssumptions',0,1024),
    maxUncertainties:boundedInteger(input.maxUncertainties??SCIENTIFIC_WHY_DEFAULT_LIMITS.maxUncertainties,'maxUncertainties',0,1024),
    maxTextBytes:boundedInteger(input.maxTextBytes??SCIENTIFIC_WHY_DEFAULT_LIMITS.maxTextBytes,'maxTextBytes',64,16384),
    maxParameterBytes:boundedInteger(input.maxParameterBytes??SCIENTIFIC_WHY_DEFAULT_LIMITS.maxParameterBytes,'maxParameterBytes',64,32768),
    maxInspectionDepth:boundedInteger(input.maxInspectionDepth??SCIENTIFIC_WHY_DEFAULT_LIMITS.maxInspectionDepth,'maxInspectionDepth',1,64),
    maxInspectionEdges:boundedInteger(input.maxInspectionEdges??SCIENTIFIC_WHY_DEFAULT_LIMITS.maxInspectionEdges,'maxInspectionEdges',1,2048)
  });
}
function endpoint(value,label,limits){
  exactKeys(value,['key','nodeType','authority'],label);
  return Object.freeze({
    key:text(value.key,label+'.key',{maxBytes:limits.maxTextBytes}),
    nodeType:enumValue(value.nodeType,NODE_TYPES,label+'.nodeType'),
    authority:authority(value.authority,label+'.authority')
  });
}
function binding(value,label,subjectCanonicalId,scientificModelVersion,limits){
  const subject=text(value.subjectCanonicalId,label+'.subjectCanonicalId',{maxBytes:128}).toLowerCase();
  if(subject!==subjectCanonicalId)fail(label+' subject identity mismatch');
  if(scientificModelVersion===null)fail(label+' cannot bind while scientific model is UNKNOWN');
  const model=text(value.scientificModelVersion,label+'.scientificModelVersion',{maxBytes:limits.maxTextBytes});
  if(model!==scientificModelVersion)fail(label+' scientific model version mismatch');
}
function normalizeCandidate(value,index,subjectCanonicalId,scientificModelVersion,limits){
  const label='ancestryCandidates['+index+']';
  exactKeys(value,['from','to','relation','subjectCanonicalId','scientificModelVersion','explicitCausalClaim','provenanceClass'],label);
  binding(value,label,subjectCanonicalId,scientificModelVersion,limits);
  const relation=enumValue(value.relation,CANDIDATE_RELATIONS,label+'.relation');
  if(typeof value.explicitCausalClaim!=='boolean')fail(label+'.explicitCausalClaim must be boolean');
  if(relation===SCIENTIFIC_WHY_EDGE_TYPE.CAUSES&&value.explicitCausalClaim!==true)fail(label+' CAUSES requires explicitCausalClaim=true');
  if(relation!==SCIENTIFIC_WHY_EDGE_TYPE.CAUSES&&value.explicitCausalClaim!==false)fail(label+' non-CAUSES relation cannot assert a causal claim');
  return Object.freeze({
    from:endpoint(value.from,label+'.from',limits),
    to:endpoint(value.to,label+'.to',limits),
    relation,
    subjectCanonicalId,
    scientificModelVersion,
    explicitCausalClaim:value.explicitCausalClaim,
    provenanceClass:text(value.provenanceClass,label+'.provenanceClass',{maxBytes:limits.maxTextBytes})
  });
}
function normalizeAssumption(value,index,subjectCanonicalId,scientificModelVersion,limits){
  const label='assumptions['+index+']';
  exactKeys(value,['id','text','scope','sourceAuthority','subjectCanonicalId','scientificModelVersion','provenanceClass'],label);
  binding(value,label,subjectCanonicalId,scientificModelVersion,limits);
  return Object.freeze({
    id:text(value.id,label+'.id',{maxBytes:256}),
    text:text(value.text,label+'.text',{maxBytes:limits.maxTextBytes}),
    scope:endpoint(value.scope,label+'.scope',limits),
    sourceAuthority:authority(value.sourceAuthority,label+'.sourceAuthority'),
    subjectCanonicalId,
    scientificModelVersion,
    provenanceClass:text(value.provenanceClass,label+'.provenanceClass',{maxBytes:limits.maxTextBytes})
  });
}
function normalizeParameters(value,label,limits){
  if(!plain(value))fail(label+' must be a plain object');
  let canonical;
  try{canonical=stableGenerativeString(value)}catch(error){fail(label+' is not canonicalizable: '+error.message)}
  if(enc.encode(canonical).length>limits.maxParameterBytes)fail(label+' exceeds byte limit');
  return Object.freeze(JSON.parse(JSON.stringify(value)));
}
function normalizeUncertainty(value,index,subjectCanonicalId,scientificModelVersion,limits){
  const label='uncertainties['+index+']';
  exactKeys(value,['id','scope','kind','parameters','sourceAuthority','subjectCanonicalId','scientificModelVersion','provenanceClass'],label);
  binding(value,label,subjectCanonicalId,scientificModelVersion,limits);
  return Object.freeze({
    id:text(value.id,label+'.id',{maxBytes:256}),
    scope:endpoint(value.scope,label+'.scope',limits),
    kind:enumValue(value.kind,UNCERTAINTY_KINDS,label+'.kind'),
    parameters:normalizeParameters(value.parameters,label+'.parameters',limits),
    sourceAuthority:authority(value.sourceAuthority,label+'.sourceAuthority'),
    subjectCanonicalId,
    scientificModelVersion,
    provenanceClass:text(value.provenanceClass,label+'.provenanceClass',{maxBytes:limits.maxTextBytes})
  });
}
function nodeIdentity(nodeType,key){
  return 'why-node-'+hashGenerativeState(NODE_HASH_NAMESPACE,{nodeType,key}).slice(0,32);
}
function edgeIdentity(core){
  return 'why-edge-'+hashGenerativeState(EDGE_HASH_NAMESPACE,core).slice(0,32);
}
function statusForRelation(relation,sourceAuthority,targetAuthority){
  if(relation===SCIENTIFIC_WHY_EDGE_TYPE.UNSUPPORTED)return SCIENTIFIC_WHY_STATUS.UNSUPPORTED;
  if(relation===SCIENTIFIC_WHY_EDGE_TYPE.UNKNOWN)return SCIENTIFIC_WHY_STATUS.UNKNOWN;
  return lowerStatus(knowledgeFromAuthority(sourceAuthority),knowledgeFromAuthority(targetAuthority));
}
function provenanceRecord({provenanceClass,scientificModelVersion,subjectCanonicalId,sourceProviderVersion=SCIENTIFIC_WHY_PROVIDER_VERSION}){
  return Object.freeze({
    provenanceClass,
    sourceProviderVersion,
    scientificModelVersion,
    subjectCanonicalId
  });
}
function pathAuthority(path,scientificStateAuthority){
  if(path.startsWith('stellar.'))return scientificStateAuthority.astronomy??W1_AUTHORITY.UNKNOWN;
  if(path.startsWith('planet.'))return scientificStateAuthority.physicalPlanet??W1_AUTHORITY.UNKNOWN;
  if(path.startsWith('environment.'))return scientificStateAuthority.environment??W1_AUTHORITY.UNKNOWN;
  if(path.startsWith('surface.'))return scientificStateAuthority.surface??W1_AUTHORITY.UNKNOWN;
  if(path.startsWith('sample.'))return scientificStateAuthority.sample??W1_AUTHORITY.UNKNOWN;
  return W1_AUTHORITY.UNKNOWN;
}
function sourceTypeForPath(path){
  if(path==='camera state'||path==='materialization order'||path==='representationVersion')return SCIENTIFIC_WHY_NODE_TYPE.CONTROL_STATE;
  return SCIENTIFIC_WHY_NODE_TYPE.SCIENTIFIC_PROPERTY;
}
function payloadFromGraph(graph){
  if(!plain(graph)||graph.contract!==SCIENTIFIC_WHY_GRAPH_CONTRACT)fail('scientific WHY graph contract mismatch');
  const {graphId,graphHash,canonicalGraph,...payload}=graph;
  return payload;
}
export function serializeScientificWhyGraph(graph){
  return stableGenerativeString(payloadFromGraph(graph));
}
export function hashScientificWhyGraph(graph){
  return hashGenerativeState(GRAPH_HASH_NAMESPACE,payloadFromGraph(graph));
}
function freezeArray(values){return Object.freeze(values.map(value=>Object.freeze(value)))}

export function projectScientificWhy({
  subject,
  worldState=null,
  ancestryCandidates=[],
  assumptions=[],
  uncertainties=[],
  limits={}
}={}){
  const bounds=normalizeLimits(limits);
  if(!Array.isArray(ancestryCandidates)||ancestryCandidates.length>bounds.maxCandidates)fail('ancestry candidate count out of bounds');
  if(!Array.isArray(assumptions)||assumptions.length>bounds.maxAssumptions)fail('assumption count out of bounds');
  if(!Array.isArray(uncertainties)||uncertainties.length>bounds.maxUncertainties)fail('uncertainty count out of bounds');

  const fp=projectScientificFingerprint({subject,worldState});
  const fingerprint=fp.fingerprint;
  const subjectCanonicalId=fingerprint.subject.canonicalId;
  const scientificModelVersion=fingerprint.scientificModelVersion;
  const normalizedCandidates=ancestryCandidates.map((value,index)=>normalizeCandidate(value,index,subjectCanonicalId,scientificModelVersion,bounds));
  const normalizedAssumptions=assumptions.map((value,index)=>normalizeAssumption(value,index,subjectCanonicalId,scientificModelVersion,bounds));
  const normalizedUncertainties=uncertainties.map((value,index)=>normalizeUncertainty(value,index,subjectCanonicalId,scientificModelVersion,bounds));
  const nodes=new Map(),edges=new Map();

  function addNode({nodeType,key,authority:nodeAuthority,knowledgeStatus=null,provenanceClass}){
    const type=enumValue(nodeType,NODE_TYPES,'node type');
    const normalizedKey=text(key,'node key',{maxBytes:bounds.maxTextBytes});
    const normalizedAuthority=authority(nodeAuthority,'node authority');
    const status=knowledgeStatus??knowledgeFromAuthority(normalizedAuthority);
    const id=nodeIdentity(type,normalizedKey),existing=nodes.get(id);
    if(existing){
      const merged=Object.freeze({
        ...existing,
        authority:lowerAuthority(existing.authority,normalizedAuthority),
        knowledgeStatus:lowerStatus(existing.knowledgeStatus,status),
        provenanceClasses:Object.freeze([...new Set([...existing.provenanceClasses,provenanceClass])].sort())
      });
      nodes.set(id,merged);
      return merged;
    }
    if(nodes.size>=bounds.maxNodes)fail('node resource bound exceeded');
    const created=Object.freeze({
      id,
      nodeType:type,
      key:normalizedKey,
      authority:normalizedAuthority,
      knowledgeStatus:status,
      provenanceClasses:Object.freeze([text(provenanceClass,'node provenanceClass',{maxBytes:bounds.maxTextBytes})])
    });
    nodes.set(id,created);
    return created;
  }
  function addEdge({edgeType,from,to,sourceAuthority,targetAuthority,knowledgeStatus,causalClaim,provenanceClass}){
    const type=enumValue(edgeType,EDGE_TYPES,'edge type');
    if(typeof causalClaim!=='boolean')fail('edge causalClaim must be boolean');
    const sourceAuth=authority(sourceAuthority,'edge source authority'),targetAuth=authority(targetAuthority,'edge target authority');
    const scientificAuthorityFloor=lowerAuthority(sourceAuth,targetAuth);
    const projectionAuthority=W1_AUTHORITY.ANALYSIS_ONLY;
    const effectiveAuthority=lowerAuthority(scientificAuthorityFloor,projectionAuthority);
    const core={
      edgeType:type,
      from:from.id,
      to:to.id,
      causalClaim,
      knowledgeStatus,
      authorities:{
        source:sourceAuth,
        target:targetAuth,
        scientificFloor:scientificAuthorityFloor,
        projection:projectionAuthority,
        effective:effectiveAuthority
      },
      provenance:{
        provenanceClass:text(provenanceClass,'edge provenanceClass',{maxBytes:bounds.maxTextBytes}),
        sourceProviderVersion:SCIENTIFIC_WHY_PROVIDER_VERSION,
        scientificModelVersion,
        subjectCanonicalId
      }
    };
    const id=edgeIdentity(core);
    if(edges.has(id))return edges.get(id);
    if(edges.size>=bounds.maxEdges)fail('edge resource bound exceeded');
    const created=Object.freeze({
      id,
      edgeType:type,
      from:from.id,
      to:to.id,
      causalClaim,
      knowledgeStatus,
      authorities:Object.freeze(core.authorities),
      provenance:Object.freeze(core.provenance)
    });
    edges.set(id,created);
    return created;
  }

  const subjectNode=addNode({
    nodeType:SCIENTIFIC_WHY_NODE_TYPE.SUBJECT,
    key:'subject:'+subjectCanonicalId,
    authority:W1_AUTHORITY.CANONICAL,
    provenanceClass:'CANONICAL_SUBJECT_BINDING'
  });
  const fpNode=addNode({
    nodeType:SCIENTIFIC_WHY_NODE_TYPE.FINGERPRINT,
    key:'fingerprint:'+(fp.fingerprintRef?.contextHash??'UNKNOWN'),
    authority:W1_AUTHORITY.ANALYSIS_ONLY,
    knowledgeStatus:fingerprint.status===W1_FINGERPRINT_STATUS.PRESENT?SCIENTIFIC_WHY_STATUS.SUPPORTED:SCIENTIFIC_WHY_STATUS.UNKNOWN,
    provenanceClass:'SCIENTIFIC_FINGERPRINT_PROVIDER'
  });
  addEdge({
    edgeType:SCIENTIFIC_WHY_EDGE_TYPE.SUBJECT_BINDING,
    from:subjectNode,
    to:fpNode,
    sourceAuthority:subjectNode.authority,
    targetAuthority:fpNode.authority,
    knowledgeStatus:fpNode.knowledgeStatus,
    causalClaim:false,
    provenanceClass:'SCIENTIFIC_FINGERPRINT_SUBJECT_BINDING'
  });
  const modelNode=addNode({
    nodeType:SCIENTIFIC_WHY_NODE_TYPE.MODEL,
    key:'scientific-model:'+(scientificModelVersion??'UNKNOWN'),
    authority:scientificModelVersion===null?W1_AUTHORITY.UNKNOWN:W1_AUTHORITY.ANALYSIS_ONLY,
    knowledgeStatus:scientificModelVersion===null?SCIENTIFIC_WHY_STATUS.UNKNOWN:SCIENTIFIC_WHY_STATUS.SUPPORTED,
    provenanceClass:'SCIENTIFIC_MODEL_BINDING'
  });
  addEdge({
    edgeType:SCIENTIFIC_WHY_EDGE_TYPE.MODEL_APPLICABILITY,
    from:modelNode,
    to:fpNode,
    sourceAuthority:modelNode.authority,
    targetAuthority:fpNode.authority,
    knowledgeStatus:lowerStatus(modelNode.knowledgeStatus,fpNode.knowledgeStatus),
    causalClaim:false,
    provenanceClass:'EXACT_MODEL_VERSION_BINDING'
  });

  for(const [domain,domainAuthority] of Object.entries(fingerprint.authorityByDomain).sort(([a],[b])=>a.localeCompare(b))){
    const domainNode=addNode({
      nodeType:SCIENTIFIC_WHY_NODE_TYPE.SCIENTIFIC_DOMAIN,
      key:'domain:'+domain,
      authority:domainAuthority,
      provenanceClass:'SCIENTIFIC_FINGERPRINT_DOMAIN_AUTHORITY'
    });
    addEdge({
      edgeType:SCIENTIFIC_WHY_EDGE_TYPE.FINGERPRINT_DOMAIN,
      from:fpNode,
      to:domainNode,
      sourceAuthority:fpNode.authority,
      targetAuthority:domainNode.authority,
      knowledgeStatus:lowerStatus(fpNode.knowledgeStatus,domainNode.knowledgeStatus),
      causalClaim:false,
      provenanceClass:'SCIENTIFIC_FINGERPRINT_DOMAIN_AUTHORITY'
    });
  }

  const upstreamUnknown=new Set(fp.provenance?.unknown??[]);
  for(const limitation of fingerprint.limitations){
    const status=upstreamUnknown.has(limitation)?SCIENTIFIC_WHY_STATUS.UNKNOWN:SCIENTIFIC_WHY_STATUS.SUPPORTED;
    const limitationNode=addNode({
      nodeType:SCIENTIFIC_WHY_NODE_TYPE.LIMITATION,
      key:'limitation:'+limitation,
      authority:status===SCIENTIFIC_WHY_STATUS.UNKNOWN?W1_AUTHORITY.UNKNOWN:W1_AUTHORITY.ANALYSIS_ONLY,
      knowledgeStatus:status,
      provenanceClass:upstreamUnknown.has(limitation)?'UPSTREAM_EXPLICIT_UNKNOWN':'SCIENTIFIC_FINGERPRINT_LIMITATION'
    });
    addEdge({
      edgeType:SCIENTIFIC_WHY_EDGE_TYPE.FINGERPRINT_LIMITATION,
      from:fpNode,
      to:limitationNode,
      sourceAuthority:fpNode.authority,
      targetAuthority:limitationNode.authority,
      knowledgeStatus:status,
      causalClaim:false,
      provenanceClass:upstreamUnknown.has(limitation)?'UPSTREAM_EXPLICIT_UNKNOWN':'SCIENTIFIC_FINGERPRINT_LIMITATION'
    });
  }

  if(fp.provenance){
    const scientificStateAuthority=fingerprint.authorityByDomain;
    for(const item of fp.provenance.edges){
      const sourceAuthority=authority(item.sourceAuthority,'upstream provenance source authority');
      const sourceNode=addNode({
        nodeType:sourceTypeForPath(item.from),
        key:'upstream:'+item.from,
        authority:sourceAuthority,
        provenanceClass:'SCIENTIFIC_FINGERPRINT_CAUSAL_TRACE'
      });
      const targetNode=addNode({
        nodeType:SCIENTIFIC_WHY_NODE_TYPE.PRESENTATION_CONSEQUENCE,
        key:'presentation:'+item.to,
        authority:W1_AUTHORITY.PRESENTATION_ONLY,
        provenanceClass:'SCIENTIFIC_FINGERPRINT_CAUSAL_TRACE'
      });
      addEdge({
        edgeType:SCIENTIFIC_WHY_EDGE_TYPE.MODEL_CONDITIONED_PRESENTATION,
        from:sourceNode,
        to:targetNode,
        sourceAuthority,
        targetAuthority:W1_AUTHORITY.PRESENTATION_ONLY,
        knowledgeStatus:statusForRelation(SCIENTIFIC_WHY_EDGE_TYPE.MODEL_CONDITIONED_PRESENTATION,sourceAuthority,W1_AUTHORITY.PRESENTATION_ONLY),
        causalClaim:false,
        provenanceClass:'UPSTREAM_EXPLICIT_PRESENTATION_INFLUENCE:'+item.mode
      });
    }
    for(const item of fp.provenance.exclusions){
      const sourceAuth=pathAuthority(item.from,scientificStateAuthority);
      const targetAuth=pathAuthority(item.to,scientificStateAuthority);
      const sourceNode=addNode({
        nodeType:sourceTypeForPath(item.from),
        key:'exclusion-source:'+item.from,
        authority:sourceAuth,
        provenanceClass:'SCIENTIFIC_FINGERPRINT_EXPLICIT_NON_INFLUENCE'
      });
      const targetNode=addNode({
        nodeType:sourceTypeForPath(item.to),
        key:'exclusion-target:'+item.to,
        authority:targetAuth,
        provenanceClass:'SCIENTIFIC_FINGERPRINT_EXPLICIT_NON_INFLUENCE'
      });
      addEdge({
        edgeType:SCIENTIFIC_WHY_EDGE_TYPE.EXPLICIT_NON_INFLUENCE,
        from:sourceNode,
        to:targetNode,
        sourceAuthority:sourceAuth,
        targetAuthority:targetAuth,
        knowledgeStatus:statusForRelation(SCIENTIFIC_WHY_EDGE_TYPE.EXPLICIT_NON_INFLUENCE,sourceAuth,targetAuth),
        causalClaim:false,
        provenanceClass:'UPSTREAM_EXPLICIT_NON_INFLUENCE'
      });
    }
  }

  const sortedCandidates=[...normalizedCandidates].sort((a,b)=>stableGenerativeString(a).localeCompare(stableGenerativeString(b)));
  for(const item of sortedCandidates){
    const from=addNode({
      nodeType:item.from.nodeType,
      key:'candidate:'+item.from.key,
      authority:item.from.authority,
      provenanceClass:item.provenanceClass
    });
    const to=addNode({
      nodeType:item.to.nodeType,
      key:'candidate:'+item.to.key,
      authority:item.to.authority,
      provenanceClass:item.provenanceClass
    });
    const status=statusForRelation(item.relation,item.from.authority,item.to.authority);
    addEdge({
      edgeType:item.relation,
      from,
      to,
      sourceAuthority:item.from.authority,
      targetAuthority:item.to.authority,
      knowledgeStatus:status,
      causalClaim:item.explicitCausalClaim,
      provenanceClass:item.provenanceClass
    });
  }

  const sortedAssumptions=[...normalizedAssumptions].sort((a,b)=>stableGenerativeString(a).localeCompare(stableGenerativeString(b)));
  for(const item of sortedAssumptions){
    const assumptionNode=addNode({
      nodeType:SCIENTIFIC_WHY_NODE_TYPE.ASSUMPTION,
      key:'assumption:'+item.id+':'+item.text,
      authority:item.sourceAuthority,
      provenanceClass:item.provenanceClass
    });
    const scopeNode=addNode({
      nodeType:item.scope.nodeType,
      key:'assumption-scope:'+item.scope.key,
      authority:item.scope.authority,
      provenanceClass:item.provenanceClass
    });
    addEdge({
      edgeType:SCIENTIFIC_WHY_EDGE_TYPE.ASSUMPTION_APPLIES,
      from:assumptionNode,
      to:scopeNode,
      sourceAuthority:item.sourceAuthority,
      targetAuthority:item.scope.authority,
      knowledgeStatus:statusForRelation(SCIENTIFIC_WHY_EDGE_TYPE.ASSUMPTION_APPLIES,item.sourceAuthority,item.scope.authority),
      causalClaim:false,
      provenanceClass:item.provenanceClass
    });
  }

  const sortedUncertainties=[...normalizedUncertainties].sort((a,b)=>stableGenerativeString(a).localeCompare(stableGenerativeString(b)));
  for(const item of sortedUncertainties){
    const uncertaintyStatus=item.kind===SCIENTIFIC_WHY_UNCERTAINTY_KIND.UNKNOWN?SCIENTIFIC_WHY_STATUS.UNKNOWN:knowledgeFromAuthority(item.sourceAuthority);
    const uncertaintyNode=addNode({
      nodeType:SCIENTIFIC_WHY_NODE_TYPE.UNCERTAINTY,
      key:'uncertainty:'+item.id+':'+item.kind+':'+stableGenerativeString(item.parameters),
      authority:item.kind===SCIENTIFIC_WHY_UNCERTAINTY_KIND.UNKNOWN?W1_AUTHORITY.UNKNOWN:item.sourceAuthority,
      knowledgeStatus:uncertaintyStatus,
      provenanceClass:item.provenanceClass
    });
    const scopeNode=addNode({
      nodeType:item.scope.nodeType,
      key:'uncertainty-scope:'+item.scope.key,
      authority:item.scope.authority,
      provenanceClass:item.provenanceClass
    });
    addEdge({
      edgeType:SCIENTIFIC_WHY_EDGE_TYPE.UNCERTAINTY_APPLIES,
      from:uncertaintyNode,
      to:scopeNode,
      sourceAuthority:uncertaintyNode.authority,
      targetAuthority:item.scope.authority,
      knowledgeStatus:lowerStatus(uncertaintyNode.knowledgeStatus,scopeNode.knowledgeStatus),
      causalClaim:false,
      provenanceClass:item.provenanceClass
    });
  }

  const causalEdges=[...edges.values()].filter(edge=>
    edge.edgeType===SCIENTIFIC_WHY_EDGE_TYPE.CAUSES&&
    edge.causalClaim===true&&
    edge.knowledgeStatus===SCIENTIFIC_WHY_STATUS.SUPPORTED
  );
  const adjacency=new Map();
  for(const edge of causalEdges){
    if(edge.from===edge.to)fail('causal ancestry cycle detected');
    if(!adjacency.has(edge.from))adjacency.set(edge.from,[]);
    adjacency.get(edge.from).push(edge.to);
  }
  const visiting=new Set(),visited=new Set();
  function visit(nodeId){
    if(visiting.has(nodeId))fail('causal ancestry cycle detected');
    if(visited.has(nodeId))return;
    visiting.add(nodeId);
    for(const next of [...(adjacency.get(nodeId)||[])].sort())visit(next);
    visiting.delete(nodeId);visited.add(nodeId);
  }
  for(const nodeId of [...nodes.keys()].sort())visit(nodeId);

  const nodeList=Object.freeze([...nodes.values()].sort((a,b)=>a.id.localeCompare(b.id)));
  const edgeList=Object.freeze([...edges.values()].sort((a,b)=>a.id.localeCompare(b.id)));
  const unsupportedEdgeCount=edgeList.filter(edge=>edge.knowledgeStatus===SCIENTIFIC_WHY_STATUS.UNSUPPORTED).length;
  const unknownEdgeCount=edgeList.filter(edge=>edge.knowledgeStatus===SCIENTIFIC_WHY_STATUS.UNKNOWN).length;
  const payload=Object.freeze({
    schemaVersion:1,
    contract:SCIENTIFIC_WHY_GRAPH_CONTRACT,
    provider:Object.freeze({
      id:SCIENTIFIC_WHY_PROVIDER_ID,
      version:SCIENTIFIC_WHY_PROVIDER_VERSION,
      authority:W1_AUTHORITY.ANALYSIS_ONLY
    }),
    sourceFingerprintProvider:Object.freeze({
      id:SCIENTIFIC_FINGERPRINT_PROVIDER_ID,
      version:SCIENTIFIC_FINGERPRINT_PROVIDER_VERSION
    }),
    subject:fingerprint.subject,
    fingerprintRef:fp.fingerprintRef,
    fingerprintStatus:fingerprint.status,
    scientificStateContract:fingerprint.scientificStateContract,
    scientificModelVersion,
    generatorVersion:fingerprint.generatorVersion,
    assumptionsState:normalizedAssumptions.length?'EXPLICIT_UPSTREAM_BOUND_INPUT':'NOT_DECLARED_UPSTREAM',
    uncertaintyState:normalizedUncertainties.length?'EXPLICIT_UPSTREAM_BOUND_INPUT':'NOT_DECLARED_UPSTREAM',
    nodes:nodeList,
    edges:edgeList,
    assumptions:freezeArray(sortedAssumptions),
    uncertainties:freezeArray(sortedUncertainties),
    limitations:Object.freeze([...fingerprint.limitations]),
    bounds,
    counts:Object.freeze({
      nodes:nodeList.length,
      edges:edgeList.length,
      explicitCandidates:normalizedCandidates.length,
      assumptions:normalizedAssumptions.length,
      uncertainties:normalizedUncertainties.length,
      unknownEdges:unknownEdgeCount,
      unsupportedEdges:unsupportedEdgeCount
    }),
    scientificClaimsAdded:false,
    generatedProseAuthoritative:false
  });
  const canonicalGraph=stableGenerativeString(payload);
  const graphHash=hashGenerativeState(GRAPH_HASH_NAMESPACE,payload);
  return Object.freeze({
    ...payload,
    graphId:'why-'+graphHash.slice(0,24),
    graphHash,
    canonicalGraph
  });
}

export function inspectScientificWhy(graph,{focusNodeId=null,maxDepth=6,maxEdges=64}={}){
  const canonical=serializeScientificWhyGraph(graph);
  const expectedHash=hashScientificWhyGraph(graph);
  if(graph.canonicalGraph!==canonical||graph.graphHash!==expectedHash)fail('scientific WHY graph integrity mismatch');
  const depthLimit=boundedInteger(maxDepth,'inspection maxDepth',1,graph.bounds.maxInspectionDepth);
  const edgeLimit=boundedInteger(maxEdges,'inspection maxEdges',1,graph.bounds.maxInspectionEdges);
  const nodeMap=new Map(graph.nodes.map(node=>[node.id,node]));
  if(focusNodeId!==null&&!nodeMap.has(focusNodeId))fail('inspection focus node is unknown');

  let selectedEdges=[],selectedNodeIds=new Set(),truncated=false;
  if(focusNodeId===null){
    selectedEdges=graph.edges.slice(0,edgeLimit);
    truncated=graph.edges.length>selectedEdges.length;
    for(const edge of selectedEdges){selectedNodeIds.add(edge.from);selectedNodeIds.add(edge.to)}
    for(const node of graph.nodes){if(selectedNodeIds.size>=Math.min(graph.nodes.length,edgeLimit*2+1))break;selectedNodeIds.add(node.id)}
  }else{
    selectedNodeIds.add(focusNodeId);
    const incoming=new Map();
    for(const edge of graph.edges){
      if(!incoming.has(edge.to))incoming.set(edge.to,[]);
      incoming.get(edge.to).push(edge);
    }
    for(const list of incoming.values())list.sort((a,b)=>a.id.localeCompare(b.id));
    const queue=[{id:focusNodeId,depth:0}],expanded=new Set();
    while(queue.length){
      const current=queue.shift();
      const marker=current.id+'@'+current.depth;
      if(expanded.has(marker))continue;
      expanded.add(marker);
      const candidates=incoming.get(current.id)||[];
      if(current.depth>=depthLimit){
        if(candidates.length)truncated=true;
        continue;
      }
      for(const edge of candidates){
        if(selectedEdges.length>=edgeLimit){truncated=true;break}
        selectedEdges.push(edge);
        selectedNodeIds.add(edge.from);selectedNodeIds.add(edge.to);
        queue.push({id:edge.from,depth:current.depth+1});
      }
      if(selectedEdges.length>=edgeLimit&&queue.length){truncated=true;break}
    }
  }
  selectedEdges=[...new Map(selectedEdges.map(edge=>[edge.id,edge])).values()].sort((a,b)=>a.id.localeCompare(b.id));
  const selectedNodes=graph.nodes.filter(node=>selectedNodeIds.has(node.id));
  const explanations=selectedEdges.map(edge=>{
    const from=nodeMap.get(edge.from),to=nodeMap.get(edge.to);
    return edge.edgeType+': '+(from?.key??edge.from)+' -> '+(to?.key??edge.to)+' ['+edge.knowledgeStatus+', '+edge.authorities.effective+']';
  });
  return Object.freeze({
    schemaVersion:1,
    contract:SCIENTIFIC_WHY_INSPECTION_CONTRACT,
    authority:W1_AUTHORITY.PRESENTATION_ONLY,
    stateAuthority:false,
    sourceGraphHash:graph.graphHash,
    focusNodeId,
    maxDepth:depthLimit,
    maxEdges:edgeLimit,
    nodes:Object.freeze(selectedNodes),
    edges:Object.freeze(selectedEdges),
    explanations:Object.freeze(explanations),
    truncated,
    summary:graph.fingerprintStatus===W1_FINGERPRINT_STATUS.PRESENT
      ?'Typed WHY inspection of explicit governed bindings; explanation text is presentation-only.'
      :'Scientific state is UNKNOWN; the inspection does not infer missing causal authority.'
  });
}

export const SCIENTIFIC_WHY_PROVIDER=Object.freeze({
  id:SCIENTIFIC_WHY_PROVIDER_ID,
  version:SCIENTIFIC_WHY_PROVIDER_VERSION,
  authority:W1_AUTHORITY.ANALYSIS_ONLY,
  sourceFingerprintProvider:SCIENTIFIC_FINGERPRINT_PROVIDER_ID,
  canonicalPromotion:false,
  mutatesScientificState:false,
  mutatesProductState:false,
  generatedProseAuthoritative:false,
  boundedQuery:true,
  operations:Object.freeze(['PROJECT_WHY','INSPECT_WHY'])
});

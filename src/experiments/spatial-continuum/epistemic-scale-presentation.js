import { AUTHORITY } from './constants.js';

export const EPISTEMIC_REPRESENTATION = Object.freeze({
  AUTHORITATIVE_STRUCTURE: 'AUTHORITATIVE_STRUCTURE',
  MODEL_DERIVED_ENSEMBLE: 'MODEL_DERIVED_ENSEMBLE',
  STATISTICAL_FIELD: 'STATISTICAL_FIELD',
  EXPLANATORY_ABSTRACTION: 'EXPLANATORY_ABSTRACTION',
  UNKNOWN_STRUCTURE: 'UNKNOWN_STRUCTURE'
});

const MAX_AUTHORITATIVE_SITES = 128;
const MAX_AUTHORITATIVE_LINKS = 192;
const sourceBacked = value => /(?:CANONICAL|SOURCE_BACKED)/i.test(String(value || ''));
const modelDerived = value => /MODEL_DERIVED/i.test(String(value || ''));
const freezePoint = point => Object.freeze(point.map(value => Number(value.toFixed(6))));
const freezeLinks = links => Object.freeze(links.map(link => Object.freeze([...link])));
const finitePoint = point => Array.isArray(point) && point.length === 3 && point.every(Number.isFinite);

function authoritativeStructure(source = {}) {
  const evidence = source?.structureEvidence;
  if (!evidence || evidence.exact !== true || !sourceBacked(evidence.authority)) return null;
  const sites = Array.isArray(evidence.sites) ? evidence.sites : [];
  const links = Array.isArray(evidence.links) ? evidence.links : [];
  if (!sites.length || sites.length > MAX_AUTHORITATIVE_SITES || !sites.every(finitePoint)) return null;
  if (links.length > MAX_AUTHORITATIVE_LINKS) return null;
  const validLinks = links.every(link => Array.isArray(link) && link.length === 2 && link.every(Number.isInteger) && link[0] >= 0 && link[1] >= 0 && link[0] < sites.length && link[1] < sites.length && link[0] !== link[1]);
  if (!validLinks) return null;
  return Object.freeze({
    authority: String(evidence.authority),
    provenance: evidence.provenance == null ? null : String(evidence.provenance),
    sites: Object.freeze(sites.map(freezePoint)),
    links: freezeLinks(links)
  });
}

function scientistStatus({ code, authority, summary, claims }) {
  return Object.freeze({
    code,
    authority,
    summary,
    explorerLabel: null,
    scientistLabel: summary,
    claims: Object.freeze({ ...claims })
  });
}

function molecularPlan({ source, chemistryAuthority, knownElements, topology }) {
  const exact = authoritativeStructure(source);
  if (exact) return Object.freeze({
    representation: EPISTEMIC_REPRESENTATION.AUTHORITATIVE_STRUCTURE,
    visualLanguage: 'EXACT_SITES_AND_RELATIONS',
    exactStructure: exact,
    status: scientistStatus({
      code: 'EXACT_STRUCTURE_SOURCE_BACKED', authority: exact.authority,
      summary: 'Source-backed exact structure',
      claims: { exactGeometry: true, exactRelations: true, exactParticleCount: false }
    })
  });
  if (sourceBacked(chemistryAuthority)) return Object.freeze({
    representation: EPISTEMIC_REPRESENTATION.STATISTICAL_FIELD,
    visualLanguage: topology === 'LATTICE_ORIENTED_PRESENTATION' ? 'LOCAL_ORDER_DENSITY_AND_ORIENTATION' : 'COMPOSITION_CONDITIONED_DENSITY_FIELD',
    exactStructure: null,
    status: scientistStatus({
      code: 'COMPOSITION_KNOWN_STRUCTURE_UNKNOWN', authority: String(chemistryAuthority || AUTHORITY.UNKNOWN),
      summary: 'Known composition; arrangement unresolved',
      claims: { exactGeometry: false, exactRelations: false, exactParticleCount: false }
    })
  });
  if (modelDerived(chemistryAuthority)) return Object.freeze({
    representation: EPISTEMIC_REPRESENTATION.MODEL_DERIVED_ENSEMBLE,
    visualLanguage: 'SOURCE_CONDITIONED_MOTIF_ENSEMBLE',
    exactStructure: null,
    status: scientistStatus({
      code: 'MODEL_DERIVED_ENSEMBLE', authority: AUTHORITY.MODEL_DERIVED,
      summary: 'Model-derived motif ensemble; no exact bonds',
      claims: { exactGeometry: false, exactRelations: false, exactParticleCount: false }
    })
  });
  return Object.freeze({
    representation: EPISTEMIC_REPRESENTATION.UNKNOWN_STRUCTURE,
    visualLanguage: 'UNRESOLVED_CONTEXT_FIELD',
    exactStructure: null,
    status: scientistStatus({
      code: 'STRUCTURE_UNKNOWN', authority: AUTHORITY.UNKNOWN,
      summary: knownElements.length ? 'Element context known; structure unknown' : 'Molecular structure unknown',
      claims: { exactGeometry: false, exactRelations: false, exactParticleCount: false }
    })
  });
}

function atomicPlan({ source, chemistryAuthority, knownElements, atomicField }) {
  const exact = authoritativeStructure(source);
  if (exact) return Object.freeze({
    representation: EPISTEMIC_REPRESENTATION.AUTHORITATIVE_STRUCTURE,
    visualLanguage: 'EXACT_SOURCE_SITES_CONTEXT',
    exactStructure: exact,
    status: scientistStatus({
      code: 'EXACT_STRUCTURE_SOURCE_BACKED', authority: exact.authority,
      summary: 'Source-backed exact structural sites',
      claims: { exactGeometry: true, exactRelations: true, exactParticleCount: false, quantumState: false }
    })
  });
  const representation = knownElements.length || sourceBacked(chemistryAuthority)
    ? EPISTEMIC_REPRESENTATION.STATISTICAL_FIELD
    : EPISTEMIC_REPRESENTATION.EXPLANATORY_ABSTRACTION;
  return Object.freeze({
    representation,
    visualLanguage: 'CONTEXTUAL_DENSITY_ORIENTATION_FIELD',
    exactStructure: null,
    fieldDistribution: atomicField?.distribution || 'UNRESOLVED_CONTEXT_FIELD',
    status: scientistStatus({
      code: representation === EPISTEMIC_REPRESENTATION.STATISTICAL_FIELD ? 'ATOMIC_CONTEXT_STATISTICAL' : 'ATOMIC_CONTEXT_EXPLANATORY',
      authority: representation === EPISTEMIC_REPRESENTATION.STATISTICAL_FIELD ? String(chemistryAuthority || AUTHORITY.UNKNOWN) : AUTHORITY.PRESENTATION_ONLY,
      summary: representation === EPISTEMIC_REPRESENTATION.STATISTICAL_FIELD ? 'Atomic context field; positions not known' : 'Explanatory atomic context; structure unknown',
      claims: { exactGeometry: false, exactRelations: false, exactParticleCount: false, quantumState: false }
    })
  });
}

export function createEpistemicScalePresentation({ sourceSampleId, sourceKind, sourceContextFingerprint, source = {}, topology = 'UNRESOLVED_CONTEXT_PRESENTATION', chemistryAuthority = 'UNRESOLVED_CHEMISTRY', knownElements = [], atomicField = null } = {}) {
  const id = String(sourceSampleId || source.sourceEntityId || 'unknown-sample');
  const continuity = Object.freeze({
    sourceSampleId: id,
    sourceKind: String(sourceKind || source.kind || 'UNKNOWN').toUpperCase(),
    sourceContextFingerprint: String(sourceContextFingerprint || 'unresolved-context'),
    continuityKey: `sample:${id}`
  });
  const molecular = molecularPlan({ source, chemistryAuthority, knownElements, topology });
  const atomic = atomicPlan({ source, chemistryAuthority, knownElements, atomicField });
  return Object.freeze({
    contract: 'ofu-r6-w0-epistemic-scale-presentation-1',
    continuity,
    material: Object.freeze({
      representation: EPISTEMIC_REPRESENTATION.MODEL_DERIVED_ENSEMBLE,
      visualLanguage: 'SOURCE_CONDITIONED_MATERIAL_DOMAINS',
      status: scientistStatus({ code: 'MATERIAL_PRESENTATION_CONTEXT', authority: AUTHORITY.PRESENTATION_ONLY, summary: 'Contextual material presentation', claims: { exactGeometry: false, exactParticleCount: false } })
    }),
    microstructure: Object.freeze({
      representation: EPISTEMIC_REPRESENTATION.STATISTICAL_FIELD,
      visualLanguage: 'LOCAL_ORDER_DOMAINS_AND_ORIENTATION',
      status: scientistStatus({ code: 'MICROSTRUCTURE_CONTEXT_FIELD', authority: AUTHORITY.PRESENTATION_ONLY, summary: 'Local-order context; grain geometry not exact', claims: { exactGeometry: false, exactParticleCount: false } })
    }),
    molecular,
    atomic,
    bounded: Object.freeze({ authoritativeSiteLimit: MAX_AUTHORITATIVE_SITES, authoritativeLinkLimit: MAX_AUTHORITATIVE_LINKS }),
    explorerLabelsRequired: false,
    deterministic: true
  });
}

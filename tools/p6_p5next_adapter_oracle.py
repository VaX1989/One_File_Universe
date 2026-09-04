#!/usr/bin/env python3
MANDATORY_UNSUPPORTED={
    'canonicalVolatileStateProducer',
    'viableBiologicalMediumState',
    'usablePhototrophicOrChemotrophicEnergyState',
    'nutrientRedoxValidityState',
    'abiogenesisTrigger',
}
def classify(w):
    if w['epistemicStatus']!='INSUFFICIENT_ENVIRONMENT': raise ValueError('status')
    if w['canAuthorizeBiology'] or w['canonicalGenesisAvailable'] or w['persistentLineageTransitionsAuthorized']: raise ValueError('fail-closed')
    if not MANDATORY_UNSUPPORTED.issubset(set(w['unsupported'])): raise ValueError('missing blocker')
    return {
      'state':'INSUFFICIENT_ENVIRONMENT',
      'canGenerateBiosphere':False,
      'biologyEstablished':False,
      'canonicalGenesisAvailable':False,
      'postGenesisFixtureAllowed':True,
      'fixtureIsCanonicalPlanetFact':False,
    }
def main():
    witness={'epistemicStatus':'INSUFFICIENT_ENVIRONMENT','canAuthorizeBiology':False,'canonicalGenesisAvailable':False,'persistentLineageTransitionsAuthorized':False,'unsupported':sorted(MANDATORY_UNSUPPORTED),'insufficient':[]}
    out=classify(witness)
    assert out['canGenerateBiosphere'] is False
    assert out['canonicalGenesisAvailable'] is False
    assert out['postGenesisFixtureAllowed'] is True
    assert out['fixtureIsCanonicalPlanetFact'] is False
    bad=dict(witness,canAuthorizeBiology=True)
    try: classify(bad)
    except ValueError: pass
    else: raise AssertionError('positive readiness must reject')
    print('P6 P5-next adapter independent oracle: PASS')
if __name__=='__main__': main()

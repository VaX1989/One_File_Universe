export function p4Witness(O,ctx,planetKey){
 const P=O.p2,A=O.p3Astronomy,T=O.p4;
 const universe=P.universeIdentity(ctx.masterSeed,ctx.semanticManifestHash).digest;
 const lineage=T.lineageId(universe,null,'rendering-wave2-non-interference');
 const planet=A.resolvePlanet(ctx,planetKey);
 if(planet.status!=='PRESENT')throw new Error('P4 rendering witness requires PRESENT planet');
 const baseline={contract:'ofu-rendering-wave2-p4-witness-v1',entity:A.canonicalEnvelope(planet)};
 const world=T.createLiveWorld({universeIdentity:universe,lineage,baseline,compactionPolicy:{threshold:8,retainTail:2}});
 const current=T.replayLiveWorld(world);
 const replay=T.replayLiveWorld(world);
 return Object.freeze({current:P.hex(current.digest),replay:P.hex(replay.digest)});
}

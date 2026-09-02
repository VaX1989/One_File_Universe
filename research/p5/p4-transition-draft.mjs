// P5 owns transition physics/semantics only. P4 owns canonical time, event identity,
// ordering, acceptance, replay, checkpointing and lineage. No clock or event log exists here.
export const p5TransitionSemanticsDraft=Object.freeze({
  version:'p5-transition-semantics-research-v0.1',canonicalClockOwner:'P4',privateClock:false,
  transitions:Object.freeze([
    Object.freeze({id:'p5.atmosphere.escape.v0',state:['atmosphericMass','volatileInventory','planetMass'],forcing:['current stellar/orbital incident energy','XUV model state'],requiresP4Interval:true,status:'RESEARCH'}),
    Object.freeze({id:'p5.interior.cooling.v0',state:['internalHeatState','volatileOutgassingPotential'],forcing:['elapsed canonical interval'],requiresP4Interval:true,status:'RESEARCH'}),
    Object.freeze({id:'p5.climate.regime.v0',state:['persistent climate/ice macro state'],forcing:['current insolation','atmosphere','rotation/obliquity state'],requiresP4Interval:true,status:'RESEARCH'}),
    Object.freeze({id:'p5.terrain.macro-evolution.v0',state:['promoted terrain macro constraints only'],forcing:['geodynamic/erosional state'],requiresP4Interval:true,status:'DEFERRED'})]),
  forbidden:Object.freeze(['browser Date','performance.now','frame time','private event order','P5-owned replay log'])
});

import assert from 'node:assert/strict';

export async function travelAccepted(page,stage,{timeout=15000,settleDelay=450}={}){
  const accepted=await page.evaluate(stage=>__OFU_SPATIAL_CONTINUUM__.travelTo(stage),stage);assert.equal(accepted,true,'travel to '+stage+' must be accepted by current semantic context');await page.evaluate(timeout=>__OFU_SPATIAL_CONTINUUM__.waitForSettled(timeout),timeout);await page.waitForTimeout(settleDelay);return page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());
}

export async function enterSupportedOrbit(page){
  const initial=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot()),galaxyIds=Object.keys(initial.render.pickTargets?.macro||{});assert.ok(galaxyIds.length,'a selectable galaxy is required');await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseDestination(id),galaxyIds[0]);await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.settle());await page.waitForTimeout(80);
  let state=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());assert.equal(state.state.scale.semanticStage,'GALAXY');const regionId=state.openUniverse.catalogue[0]?.id;assert.ok(regionId,'a region is required');await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseDestination(id),regionId);await page.evaluate(()=>{__OFU_SPATIAL_CONTINUUM__.travelTo('NEIGHBORHOOD');__OFU_SPATIAL_CONTINUUM__.settle()});await page.waitForTimeout(80);
  const systemIds=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.openUniverse.catalogueFor('NEIGHBORHOOD').map(item=>item.id));assert.ok(systemIds.length,'a system catalogue is required');let selectedBody=null;
  for(const systemId of systemIds){await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseDestination(id),systemId);state=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());const body=state.openUniverse.catalogue.find(item=>item.kind==='PLANET'||item.kind==='MOON');if(!body)continue;try{await page.evaluate(id=>__OFU_SPATIAL_CONTINUUM__.chooseDestination(id),body.id);selectedBody=body.id;break}catch{}}
  assert.ok(selectedBody,'a supported planetary body must materialize');await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.settle());await page.waitForTimeout(120);state=await page.evaluate(()=>__OFU_SPATIAL_CONTINUUM__.snapshot());assert.equal(state.state.scale.semanticStage,'ORBIT');assert.equal(state.worldIdentity,selectedBody);return state;
}

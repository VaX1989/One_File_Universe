import { createLifeProvider, LIFE_V2_PROVIDER_DESCRIPTOR } from './provider.js';
import { buildOrganismRenderDescriptors } from './renderer.js';
import { createLifeViewportBridge, LIFE_V2_VIEWPORT_BRIDGE_DESCRIPTOR } from './viewport-bridge.js';

function invariant(condition, message) {
  if (!condition) throw new Error(`LIFE_V2_SHIPPING_INVALID: ${message}`);
}

export const LIFE_V2_SHIPPING_ADAPTER_DESCRIPTOR = Object.freeze({
  id: 'ofu.v2x-08.life-shipping-adapter',
  version: '2.0.0',
  authorityClass: 'MODEL_DERIVED_SIMULATION',
  providerId: LIFE_V2_PROVIDER_DESCRIPTOR.id,
  viewportBridgeId: LIFE_V2_VIEWPORT_BRIDGE_DESCRIPTOR.id,
  additiveOnly: true,
  centralAuthorityOverrides: Object.freeze([]),
  runtimeExports: Object.freeze([
    'modelProvider',
    'viewport',
    'buildViewportPacket',
    'revisit',
    'reachabilityWitness',
  ]),
});

export function createLifeShippingAdapter({ getState }) {
  invariant(typeof getState === 'function', 'getState function required');
  const checkedGetState = () => {
    const state = getState();
    invariant(state?.schema === 'ofu-v2x-08-life-state-1', 'valid V2X-08 life state required');
    return state;
  };
  const modelProvider = createLifeProvider({ getState: checkedGetState });
  const viewport = createLifeViewportBridge({
    provider: modelProvider,
    renderDescriptors: buildOrganismRenderDescriptors,
    getEventKey: () => checkedGetState().eventKey,
  });

  return Object.freeze({
    descriptor: LIFE_V2_SHIPPING_ADAPTER_DESCRIPTOR,
    modelProvider,
    viewport,
    buildViewportPacket: viewport.buildViewportPacket,
    revisit: viewport.revisit,
    reachabilityWitness: viewport.reachabilityWitness,
  });
}

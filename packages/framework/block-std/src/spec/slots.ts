import { Slot } from '@blocksuite/global/utils';

import type { BlockService } from '../service/index.js';

export type BlockSpecSlots<Service extends BlockService = BlockService> = {
  mounted: Slot<{ service: Service }>;
  unmounted: Slot<{ service: Service }>;
  viewConnected: Slot<{ component: BlockSuite.NodeView; service: Service }>;
  viewDisconnected: Slot<{ component: BlockSuite.NodeView; service: Service }>;
  widgetConnected: Slot<{ component: BlockSuite.NodeView; service: Service }>;
  widgetDisconnected: Slot<{
    component: BlockSuite.NodeView;
    service: Service;
  }>;
};

export const getSlots = (): BlockSpecSlots => {
  return {
    mounted: new Slot(),
    unmounted: new Slot(),
    viewConnected: new Slot(),
    viewDisconnected: new Slot(),
    widgetConnected: new Slot(),
    widgetDisconnected: new Slot(),
  };
};

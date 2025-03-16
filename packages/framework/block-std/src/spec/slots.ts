import { Subject } from 'rxjs';

import type { BlockService } from '../extension/service.js';
import type { BlockComponent, WidgetComponent } from '../view/index.js';

export type BlockSpecSlots<Service extends BlockService = BlockService> = {
  mounted: Subject<{ service: Service }>;
  unmounted: Subject<{ service: Service }>;
  viewConnected: Subject<{ component: BlockComponent; service: Service }>;
  viewDisconnected: Subject<{ component: BlockComponent; service: Service }>;
  widgetConnected: Subject<{ component: WidgetComponent; service: Service }>;
  widgetDisconnected: Subject<{
    component: WidgetComponent;
    service: Service;
  }>;
};

export const getSlots = (): BlockSpecSlots => {
  return {
    mounted: new Subject(),
    unmounted: new Subject(),
    viewConnected: new Subject(),
    viewDisconnected: new Subject(),
    widgetConnected: new Subject(),
    widgetDisconnected: new Subject(),
  };
};

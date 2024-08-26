import type { DocRemoteSelectionConfig } from './widgets/doc-remote-selection/config.js';
import type { LinkedWidgetConfig } from './widgets/linked-doc/index.js';

export interface RootBlockConfig {
  linkedWidget?: Partial<LinkedWidgetConfig>;
  docRemoteSelectionWidget?: Partial<DocRemoteSelectionConfig>;
}

declare global {
  namespace BlockSuite {
    interface BlockConfigs {
      'affine:page': RootBlockConfig;
    }
  }
}

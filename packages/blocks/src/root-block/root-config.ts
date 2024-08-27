import type { DocRemoteSelectionConfig } from './widgets/doc-remote-selection/config.js';
import type { EdgelessElementToolbarWidgetConfig } from './widgets/element-toolbar/config.js';
import type { LinkedWidgetConfig } from './widgets/linked-doc/index.js';

export interface RootBlockConfig {
  linkedWidget?: Partial<LinkedWidgetConfig>;
  docRemoteSelectionWidget?: Partial<DocRemoteSelectionConfig>;
  edgelessElementToolbarWidget?: Partial<EdgelessElementToolbarWidgetConfig>;
}

declare global {
  namespace BlockSuite {
    interface BlockConfigs {
      'affine:page': RootBlockConfig;
    }
  }
}

import type { DeepPartial } from '@blocksuite/global/utils';
import type { Signal } from '@lit-labs/preact-signals';

import type { EditorSetting } from './config/index.js';
import type { ToolbarMoreMenuConfig } from './configs/toolbar.js';
import type { DocRemoteSelectionConfig } from './widgets/doc-remote-selection/config.js';
import type { LinkedWidgetConfig } from './widgets/linked-doc/index.js';

export interface RootBlockConfig {
  editorSetting?: Signal<DeepPartial<EditorSetting>>;
  linkedWidget?: Partial<LinkedWidgetConfig>;
  docRemoteSelectionWidget?: Partial<DocRemoteSelectionConfig>;
  toolbarMoreMenu: Partial<ToolbarMoreMenuConfig>;
}

declare global {
  namespace BlockSuite {
    interface BlockConfigs {
      'affine:page': RootBlockConfig;
    }
  }
}

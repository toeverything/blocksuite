import type { DeepPartial } from '@blocksuite/global/utils';
import type { Signal } from '@lit-labs/preact-signals';

import type { DatabaseOptionsConfig } from '../database-block/config.js';
import type { EditorSetting, ToolbarMoreMenuConfig } from './configs/index.js';
import type { DocRemoteSelectionConfig } from './widgets/doc-remote-selection/config.js';
import type { LinkedWidgetConfig } from './widgets/linked-doc/index.js';

export interface RootBlockConfig {
  editorSetting?: Signal<DeepPartial<EditorSetting>>;
  linkedWidget?: Partial<LinkedWidgetConfig>;
  docRemoteSelectionWidget?: Partial<DocRemoteSelectionConfig>;
  toolbarMoreMenu: Partial<ToolbarMoreMenuConfig>;
  databaseOptions: Partial<DatabaseOptionsConfig>;
}

declare global {
  namespace BlockSuite {
    interface BlockConfigs {
      'affine:page': RootBlockConfig;
    }
  }
}

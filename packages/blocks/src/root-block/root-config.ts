import type { DatabaseOptionsConfig } from '../database-block/config.js';
import type { ToolbarMoreMenuConfig } from './configs/index.js';
import type { DocRemoteSelectionConfig } from './widgets/doc-remote-selection/config.js';
import type { LinkedWidgetConfig } from './widgets/linked-doc/index.js';

export interface RootBlockConfig {
  linkedWidget?: Partial<LinkedWidgetConfig>;
  docRemoteSelectionWidget?: Partial<DocRemoteSelectionConfig>;
  toolbarMoreMenu?: Partial<ToolbarMoreMenuConfig>;
  databaseOptions?: Partial<DatabaseOptionsConfig>;
  /**
   * The device pixel ratio for rendering, defaults is `window.devicePixelRatio`.
   */
  renderDpr?: number;
}

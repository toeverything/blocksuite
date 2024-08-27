import type { MoreMenuItemGroup } from './more-menu/config.js';

export interface EdgelessElementToolbarWidgetConfig {
  configureMoreMenu: (groups: MoreMenuItemGroup[]) => MoreMenuItemGroup[];
}

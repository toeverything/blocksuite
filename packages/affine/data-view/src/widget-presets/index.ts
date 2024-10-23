import { widgetQuickSettingBar } from './quick-setting-bar/index.js';
import { createWidgetTools, toolsWidgetPresets } from './tools/index.js';
import { widgetViewsBar } from './views-bar/index.js';

export const widgetPresets = {
  viewBar: widgetViewsBar,
  quickSettingBar: widgetQuickSettingBar,
  createTools: createWidgetTools,
  tools: toolsWidgetPresets,
};

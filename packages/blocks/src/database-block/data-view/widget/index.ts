import { widgetFilterBar } from './filter/index.js';
import { createWidgetTools, toolsWidgetPresets } from './tools/index.js';
import { widgetViewsBar } from './views-bar/index.js';

export const widgetPresets = {
  createTools: createWidgetTools,
  filterBar: widgetFilterBar,
  tools: toolsWidgetPresets,
  viewBar: widgetViewsBar,
};

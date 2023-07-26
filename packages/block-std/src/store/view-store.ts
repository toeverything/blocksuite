import { PathMap } from './path-map.js';

export class ViewStore<BlockView = unknown, WidgetView = unknown> {
  readonly blockViewMap = new PathMap<BlockView>();
  readonly widgetViewMap = new PathMap<WidgetView>();

  clear() {
    this.blockViewMap.clear();
    this.widgetViewMap.clear();
  }
}

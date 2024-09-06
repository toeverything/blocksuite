import type { BlockComponent, WidgetComponent } from './element/index.js';

import { LifeCycleWatcher } from '../extension/index.js';

export class ViewStore extends LifeCycleWatcher {
  static override readonly key = 'viewStore';

  private readonly _blockMap = new Map<string, BlockComponent>();

  private _fromId = (
    blockId: string | undefined | null
  ): BlockComponent | null => {
    const id = blockId ?? this.std.doc.root?.id;
    if (!id) {
      return null;
    }
    return this._blockMap.get(id) ?? null;
  };

  private readonly _widgetMap = new Map<string, WidgetComponent>();

  deleteBlock = (node: BlockComponent) => {
    this._blockMap.delete(node.id);
  };

  deleteWidget = (node: WidgetComponent) => {
    const id = node.dataset.widgetId as string;
    const widgetIndex = `${node.model.id}|${id}`;
    this._widgetMap.delete(widgetIndex);
  };

  getBlock = (id: string): BlockComponent | null => {
    return this._blockMap.get(id) ?? null;
  };

  getWidget = (
    widgetName: string,
    hostBlockId: string
  ): WidgetComponent | null => {
    const widgetIndex = `${hostBlockId}|${widgetName}`;
    return this._widgetMap.get(widgetIndex) ?? null;
  };

  setBlock = (node: BlockComponent) => {
    this._blockMap.set(node.model.id, node);
  };

  setWidget = (node: WidgetComponent) => {
    const id = node.dataset.widgetId as string;
    const widgetIndex = `${node.model.id}|${id}`;
    this._widgetMap.set(widgetIndex, node);
  };

  walkThrough = (
    fn: (
      nodeView: BlockComponent,
      index: number,
      parent: BlockComponent
    ) => undefined | null | true,
    blockId?: string | undefined | null
  ) => {
    const top = this._fromId(blockId);
    if (!top) {
      return;
    }

    const iterate =
      (parent: BlockComponent) => (node: BlockComponent, index: number) => {
        const result = fn(node, index, parent);
        if (result === true) {
          return;
        }
        const children = node.model.children;
        children.forEach(child => {
          const childNode = this._blockMap.get(child.id);
          if (childNode) {
            iterate(node)(childNode, children.indexOf(child));
          }
        });
      };

    top.model.children.forEach(child => {
      const childNode = this._blockMap.get(child.id);
      if (childNode) {
        iterate(childNode)(childNode, top.model.children.indexOf(child));
      }
    });
  };

  override unmounted() {
    this._blockMap.clear();
    this._widgetMap.clear();
  }
}

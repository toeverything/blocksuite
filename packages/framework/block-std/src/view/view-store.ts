import type { BlockModel } from '@blocksuite/store';

import type { BlockComponent, WidgetComponent } from './element/index.js';

export class ViewStore {
  private readonly _blockMap = new Map<string, BlockComponent>();

  private readonly _widgetMap = new Map<string, WidgetComponent>();

  calculatePath = (model: BlockModel): string[] => {
    const path: string[] = [];
    let current: BlockModel | null = model;
    while (current) {
      path.push(current.id);
      current = this.std.doc.getParent(current);
    }
    return path.reverse();
  };

  deleteBlock = (node: BlockComponent) => {
    this._blockMap.delete(node.id);
  };

  deleteWidget = (node: WidgetComponent) => {
    const id = node.dataset.widgetId as string;
    const widgetIndex = `${node.model.id}|${id}`;
    this._widgetMap.delete(widgetIndex);
  };

  fromPath = (path: string | undefined | null): BlockComponent | null => {
    const id = path ?? this.std.doc.root?.id;
    if (!id) {
      return null;
    }
    return this._blockMap.get(id) ?? null;
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
    path?: string | undefined | null
  ) => {
    const tree = this.fromPath(path);
    if (!tree) {
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

    tree.model.children.forEach(child => {
      const childNode = this._blockMap.get(child.id);
      if (childNode) {
        iterate(childNode)(childNode, tree.model.children.indexOf(child));
      }
    });
  };

  constructor(public std: BlockSuite.Std) {}

  mount() {}

  unmount() {
    this._blockMap.clear();
    this._widgetMap.clear();
  }

  /**
   * @deprecated
   * Use `getBlock` or `getWidget` instead
   */
  viewFromPath(type: 'block', path: string[]): null | BlockComponent;
  viewFromPath(type: 'widget', path: string[]): null | WidgetComponent;
  viewFromPath(
    type: 'block' | 'widget',
    path: string[]
  ): null | BlockComponent | WidgetComponent {
    if (type === 'block') {
      return this.fromPath(path[path.length - 1]);
    }
    const temp = path.slice(-2) as [string, string];
    const widgetId = temp.join('|');
    return this._widgetMap.get(widgetId) ?? null;
  }
}

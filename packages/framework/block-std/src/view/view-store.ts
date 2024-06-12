import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import type { BlockElement, WidgetElement } from './element/index.js';

export class ViewStore {
  private readonly _blockMap = new Map<string, BlockElement>();

  private readonly _widgetMap = new Map<string, WidgetElement>();

  constructor(public std: BlockSuite.Std) {}

  setBlock = (node: BlockElement) => {
    this._blockMap.set(node.model.id, node);
  };

  setWidget = (node: WidgetElement) => {
    const id = node.dataset.widgetId as string;
    const widgetIndex = `${node.model.id}|${id}`;
    this._widgetMap.set(widgetIndex, node);
  };

  getBlock = (id: string): BlockElement | null => {
    return this._blockMap.get(id) ?? null;
  };

  getWidget = (
    widgetName: string,
    hostBlockId: string
  ): WidgetElement | null => {
    const widgetIndex = `${hostBlockId}|${widgetName}`;
    return this._widgetMap.get(widgetIndex) ?? null;
  };

  deleteBlock = (node: BlockElement) => {
    this._blockMap.delete(node.id);
  };

  deleteWidget = (node: WidgetElement) => {
    const id = node.dataset.widgetId as string;
    const widgetIndex = `${node.model.id}|${id}`;
    this._widgetMap.delete(widgetIndex);
  };

  calculatePath = (model: BlockModel): string[] => {
    const path: string[] = [];
    let current: BlockModel | null = model;
    while (current) {
      path.push(current.id);
      current = this.std.doc.getParent(current);
    }
    return path.reverse();
  };

  fromPath = (path: string | undefined | null): BlockElement | null => {
    const id = path ?? this.std.doc.root?.id;
    if (!id) {
      return null;
    }
    return this._blockMap.get(id) ?? null;
  };

  viewFromPath(type: 'block', path: string[]): null | BlockElement;
  viewFromPath(type: 'widget', path: string[]): null | WidgetElement;
  viewFromPath(
    type: 'block' | 'widget',
    path: string[]
  ): null | BlockElement | WidgetElement {
    if (type === 'block') {
      return this.fromPath(path[path.length - 1]);
    }
    const temp = path.slice(-2) as [string, string];
    const widgetId = temp.join('|');
    return this._widgetMap.get(widgetId) ?? null;
  }

  walkThrough = (
    fn: (
      nodeView: BlockElement,
      index: number,
      parent: BlockElement
    ) => undefined | null | true,
    path?: string | undefined | null
  ) => {
    const tree = this.fromPath(path);
    assertExists(tree, `Invalid path to get node in view: ${path}`);

    const iterate =
      (parent: BlockElement) => (node: BlockElement, index: number) => {
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

  mount() {}

  unmount() {
    this._blockMap.clear();
    this._widgetMap.clear();
  }
}

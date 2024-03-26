import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import { PathFinder } from '../utils/index.js';
import type { BlockElement, WidgetElement } from './element/index.js';

export class ViewStore {
  readonly _blockMap = new Map<string, BlockElement>();
  readonly _widgetMap = new Map<string, WidgetElement>();

  constructor(public std: BlockSuite.Std) {}

  calculatePath = (node: BlockElement | WidgetElement): string[] => {
    const path: string[] = [];
    let current: BlockModel | null = node.model;
    while (current) {
      path.push(current.id);
      current = this.std.doc.getParent(current);
    }
    return path.reverse();
  };

  fromPath = (path: string[]): BlockElement | null => {
    const id = path[path.length - 1] ?? this.std.doc.root?.id;
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
      return this.fromPath(path);
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
    path: string[] = []
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

  getParent = (path: string[]) => {
    if (path.length === 0) {
      return null;
    }
    return this.fromPath(PathFinder.parent(path));
  };

  mount() {}

  unmount() {
    this._blockMap.clear();
    this._widgetMap.clear();
  }
}

import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import { PathFinder } from '../utils/index.js';
import type { BlockElement, WidgetElement } from './element/index.js';
import type { NodeView } from './type.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BlockSuiteViewSpec<T = any> {
  type: BlockSuite.ViewType;
  fromDOM: (node: Node) => null | NodeView<T>;
  toDOM: (nodeView: NodeView<T>) => Element;
  getChildren: (node: Element) => Element[];
}

type BlockIndex = string;
type WidgetIndex = [blockIndex: BlockIndex, widgetId: string];

export class ViewStore {
  readonly _blockMap = new Map<BlockIndex, BlockElement>();
  readonly _widgetMap = new Map<WidgetIndex, WidgetElement>();
  readonly viewSpec = new Set<BlockSuiteViewSpec>();

  constructor(public std: BlockSuite.Std) {}

  register<T extends BlockSuite.ViewType>(spec: BlockSuite.View[T]) {
    this.viewSpec.add(spec);
  }

  calculatePath = (node: BlockElement | WidgetElement): string[] => {
    const path: string[] = [];
    let current: BlockModel | null = node.model;
    while (current) {
      path.push(current.id);
      current = this.std.doc.getParent(current);
    }
    return path.reverse();
  };

  getNodeView = (node: Node): NodeView | null => {
    for (const [_, spec] of this.viewSpec.entries()) {
      const view = spec.fromDOM(node);
      if (view) {
        return {
          ...view,
        } as NodeView;
      }
    }
    return null;
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
    const widgetId = path.slice(-2) as WidgetIndex;
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
    this.viewSpec.clear();
    this._blockMap.clear();
    this._widgetMap.clear();
  }
}

declare global {
  namespace BlockSuite {
    type View = {
      [P in keyof NodeViewType]: BlockSuiteViewSpec<NodeViewType[P]>;
    };

    type ViewType = keyof View;
  }
}

import { assertExists } from '@blocksuite/global/utils';

import type { BlockStore } from './block-store.js';

export type NodeView<T = unknown> = {
  id: string;
  path: string[];
  view: T;
};
export type NodeViewLeaf<T> = NodeView<T> & {
  type: BlockSuiteViewType;
};
export type NodeViewTree<T> = NodeViewLeaf<T> & {
  children: NodeViewTree<T>[];
};

export interface BlockSuiteViewSpec<T = unknown> {
  fromDOM: (node: Node) => null | NodeView<T>;
  toDOM: (nodeView: NodeView<T>) => Element;
  getChildren: (node: Element) => Element[];
}

const observeOptions = {
  childList: true,
  subtree: true,
};

export class ViewStore<NodeViewType = unknown> {
  private _cachedTree: NodeViewTree<NodeViewType> | null = null;
  private _cachedPath: Map<Node, NodeViewLeaf<NodeViewType>[]> = new Map();
  private _observer: MutationObserver;
  readonly viewSpec = new Map<BlockSuiteViewType, BlockSuiteViewValue>();

  constructor(public blockStore: BlockStore) {
    this._observer = new MutationObserver(() => {
      this._cachedPath.clear();
      this._cachedTree = null;
    });
  }

  register<T extends BlockSuiteViewType>(type: T, spec: BlockSuiteView[T]) {
    this.viewSpec.set(type, spec);
  }

  getNodeView = (node: Node): NodeViewLeaf<NodeViewType> | null => {
    for (const [type, spec] of this.viewSpec.entries()) {
      const view = spec.fromDOM(node);
      if (view) {
        return {
          type,
          ...view,
        } as NodeViewLeaf<NodeViewType>;
      }
    }
    return null;
  };

  calculatePath = (node: Node) => {
    const path = this.calculateNodeViewPath(node);
    return path.map(x => x.id);
  };

  calculateNodeViewPath = (node: Node) => {
    if (this._cachedPath.has(node)) {
      return this._cachedPath.get(node) as NodeViewLeaf<NodeViewType>[];
    }
    const root = this.blockStore.root;

    const iterate = (
      node: Node | null,
      path: Array<NodeViewLeaf<NodeViewType>>
    ): Array<NodeViewLeaf<NodeViewType>> => {
      if (!node || node === root) return path;
      const nodeView = this.getNodeView(node);
      if (!nodeView) {
        return path;
      }
      const spec = this.viewSpec.get(nodeView.type);
      assertExists(spec);
      const next = spec.toDOM(nodeView as never).parentElement;
      if (!next) {
        return path;
      }
      return iterate(next, path.concat(nodeView));
    };

    const path = iterate(node, []).reverse();
    this._cachedPath.set(node, path);
    return path;
  };

  getNodeViewTree = (): NodeViewTree<NodeViewType> => {
    if (this._cachedTree) {
      return this._cachedTree;
    }

    const iterate = (node: Node): NodeViewTree<NodeViewType> => {
      const nodeView = this.getNodeView(node);
      if (!nodeView) {
        throw new Error('nodeView not found');
      }

      const spec = this.viewSpec.get(nodeView.type);
      assertExists(spec);

      const children = spec
        .getChildren(spec.toDOM(nodeView as never))
        .map(child => iterate(child));

      return {
        ...nodeView,
        children,
      };
    };
    const firstBlock = this.blockStore.root.firstElementChild;
    assertExists(firstBlock);

    const tree = {
      id: '__root__',
      path: [],
      children: [iterate(firstBlock)],
    } as Partial<NodeViewTree<NodeViewType>> as NodeViewTree<NodeViewType>;
    this._cachedTree = tree;
    return tree;
  };

  getViewByPath = (path: string[]) => {
    const tree = this.getNodeViewTree();
    return path.reduce((curr: NodeViewTree<NodeViewType> | null, id) => {
      if (!curr) {
        return null;
      }
      const child = curr.children.find(x => x.id === id);
      if (!child) {
        return null;
      }
      return child;
    }, tree) as NodeViewLeaf<NodeViewType> | null;
  };

  mount() {
    this._observer.observe(this.blockStore.root, observeOptions);
  }
  unmount() {
    this._cachedPath.clear();
    this._cachedTree = null;
    this._observer.disconnect();
    this.viewSpec.clear();
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface BlockSuiteView {}

  type BlockSuiteViewType = string & keyof BlockSuiteView;
  type BlockSuiteViewValue<T extends BlockSuiteViewType = BlockSuiteViewType> =
    BlockSuiteView[T];
}

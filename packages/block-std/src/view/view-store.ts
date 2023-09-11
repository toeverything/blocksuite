import { assertExists } from '@blocksuite/global/utils';

import type { BlockStdProvider } from '../provider/block-std-provider.js';
import { PathFinder } from '../utils/index.js';
import type { NodeView, NodeViewTree, SpecToNodeView } from './type.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BlockSuiteViewSpec<T = any> {
  type: BlockSuite.ViewType;
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
  private _cachedPath: Map<Node, NodeView<NodeViewType>[]> = new Map();
  private _observer: MutationObserver;
  readonly viewSpec = new Set<BlockSuiteViewSpec>();

  constructor(public blockStore: BlockStdProvider) {
    this._observer = new MutationObserver(() => {
      this._cachedPath.clear();
      this._cachedTree = null;
    });
  }

  getChildren = (path: string[]): NodeViewTree<NodeViewType>[] => {
    const node = this.fromPath(path);
    if (!node) {
      return [];
    }
    return node.children;
  };

  register<T extends BlockSuite.ViewType>(spec: BlockSuite.View[T]) {
    this.viewSpec.add(spec);
  }

  getNodeView = (node: Node): NodeView<NodeViewType> | null => {
    for (const [_, spec] of this.viewSpec.entries()) {
      const view = spec.fromDOM(node);
      if (view) {
        return {
          ...view,
        } as NodeView<NodeViewType>;
      }
    }
    return null;
  };

  calculatePath = (node: Node) => {
    const path = this._calculateNodeViewPath(node);
    return path.map(x => x.id);
  };

  private _getViewSpec = (type: string) => {
    return Array.from(this.viewSpec).find(spec => spec.type === type);
  };

  private _calculateNodeViewPath = (node: Node) => {
    if (this._cachedPath.has(node)) {
      return this._cachedPath.get(node) as NodeView<NodeViewType>[];
    }
    const root = this.blockStore.root;

    const iterate = (
      node: Node | null,
      path: Array<NodeView<NodeViewType>>
    ): Array<NodeView<NodeViewType>> => {
      if (!node || node === root) return path;
      const nodeView = this.getNodeView(node);
      if (!nodeView) {
        return path;
      }
      const spec = this._getViewSpec(nodeView.type);
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

      const spec = this._getViewSpec(nodeView.type);
      assertExists(spec);

      const children = spec
        .getChildren(spec.toDOM(nodeView as never))
        .map((child: Node) => iterate(child));

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

  fromPath = (path: string[]) => {
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
    }, tree);
  };

  viewFromPath<T extends BlockSuite.ViewType>(
    type: T,
    path: string[]
  ): null | SpecToNodeView<BlockSuite.View[T]>;
  viewFromPath<T extends BlockSuiteViewSpec>(
    type: string,
    path: string[]
  ): null | SpecToNodeView<T>;
  viewFromPath(
    type: string,
    path: string[]
  ): null | SpecToNodeView<BlockSuiteViewSpec> {
    const tree = this.fromPath(path);
    if (!tree || tree.type !== type) {
      return null;
    }
    return tree.view as SpecToNodeView<BlockSuiteViewSpec>;
  }

  walkThrough = (
    fn: (
      nodeView: NodeViewTree<NodeViewType>,
      index: number,
      parent: NodeViewTree<NodeViewType>
    ) => undefined | null | true,
    path: string[] = []
  ) => {
    const tree = this.fromPath(path);
    assertExists(tree, `Invalid path to get node in view: ${path}`);

    const iterate =
      (parent: NodeViewTree<NodeViewType>) =>
      (node: NodeViewTree<NodeViewType>, index: number) => {
        const result = fn(node, index, parent);
        if (result === true) {
          return;
        }
        node.children.forEach(iterate(node));
      };

    tree.children.forEach(iterate(tree));
  };

  getParent = (path: string[]) => {
    if (path.length === 0) {
      return null;
    }
    return this.fromPath(PathFinder.parent(path));
  };

  findPrev = (
    path: string[],
    fn: (
      nodeView: NodeViewTree<NodeViewType>,
      index: number,
      parent: NodeViewTree<NodeViewType>
    ) => undefined | null | true
  ): NodeViewTree<NodeViewType> | null => {
    const getPrev = (path: string[]) => {
      const parent = this.getParent(path);
      if (!parent) {
        return null;
      }
      const index = this._indexOf(path, parent);
      if (index === -1) {
        return null;
      }
      if (index === 0) {
        const grandParent = this.getParent(PathFinder.parent(path));
        if (!grandParent) return null;
        return {
          nodeView: parent,
          parent: grandParent,
          index: this._indexOf(PathFinder.parent(path), grandParent),
        };
      }
      return {
        nodeView: parent.children[index - 1],
        parent,
        index: index - 1,
      };
    };

    let output: null | NodeViewTree<NodeViewType> = null;
    const iterate = (path: string[]) => {
      const state = getPrev(path);
      if (!state) {
        return;
      }
      const { nodeView, parent, index } = state;
      const result = fn(nodeView, index, parent);
      if (result) {
        output = nodeView;

        return;
      }

      iterate(nodeView.path);
    };

    iterate(path);

    return output;
  };

  findNext = (
    path: string[],
    fn: (
      nodeView: NodeViewTree<NodeViewType>,
      index: number,
      parent: NodeViewTree<NodeViewType>
    ) => undefined | null | true
  ): NodeViewTree<NodeViewType> | null => {
    const getNext = (path: string[]) => {
      const parent = this.getParent(path);
      if (!parent) {
        return null;
      }
      const index = this._indexOf(path, parent);
      if (index === -1) {
        return null;
      }
      if (index === parent.children.length - 1) {
        const grandParent = this.getParent(PathFinder.parent(path));
        if (!grandParent) return null;
        return {
          nodeView: parent,
          parent: grandParent,
          index: this._indexOf(PathFinder.parent(path), grandParent),
        };
      }
      return {
        nodeView: parent.children[index + 1],
        parent,
        index: index + 1,
      };
    };

    let output: null | NodeViewTree<NodeViewType> = null;
    const iterate = (path: string[]) => {
      const state = getNext(path);
      if (!state) {
        return;
      }
      const { nodeView, parent, index } = state;
      const result = fn(nodeView, index, parent);
      if (result) {
        output = nodeView;

        return;
      }

      iterate(nodeView.path);
    };

    iterate(path);

    return output;
  };

  indexOf = (path: string[]) => {
    const parent = this.getParent(path);
    if (!parent) {
      return -1;
    }
    return this._indexOf(path, parent);
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

  private _indexOf = (path: string[], parent: NodeViewTree<unknown>) => {
    return parent.children.findIndex(x => x.id === path[path.length - 1]);
  };
}

declare global {
  namespace BlockSuite {
    interface View {}

    type ViewType = keyof View;
  }
}

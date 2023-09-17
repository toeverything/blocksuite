import type {
  BlockSnapshot,
  PageSnapshot,
  SliceSnapshot,
} from '../transformer/type.js';
import type { AdapterAssetsManager } from './assets.js';

export type FromPageSnapshotPayload = {
  snapshot: PageSnapshot;
  assets?: AdapterAssetsManager;
};
export type FromBlockSnapshotPayload = {
  snapshot: BlockSnapshot;
  assets?: AdapterAssetsManager;
};
export type FromSliceSnapshotPayload = {
  snapshot: SliceSnapshot;
  assets?: AdapterAssetsManager;
};
export type ToPageSnapshotPayload<Target> = {
  file: Target;
  assets?: AdapterAssetsManager;
};
export type ToBlockSnapshotPayload<Target> = {
  file: Target;
  assets?: AdapterAssetsManager;
};
export type ToSliceSnapshotPayload<Target> = {
  file: Target;
  assets?: AdapterAssetsManager;
};

export abstract class BaseAdapter<AdapterTarget = unknown> {
  abstract fromPageSnapshot(
    payload: FromPageSnapshotPayload
  ): Promise<AdapterTarget>;
  abstract fromBlockSnapshot(
    payload: FromBlockSnapshotPayload
  ): Promise<AdapterTarget>;
  abstract fromSliceSnapshot(
    payload: FromSliceSnapshotPayload
  ): Promise<AdapterTarget>;
  abstract toPageSnapshot(
    payload: ToPageSnapshotPayload<AdapterTarget>
  ): Promise<PageSnapshot>;
  abstract toBlockSnapshot(
    payload: ToBlockSnapshotPayload<AdapterTarget>
  ): Promise<BlockSnapshot>;
  abstract toSliceSnapshot(
    payload: ToSliceSnapshotPayload<AdapterTarget>
  ): Promise<SliceSnapshot>;
}

export type ASTWalkerContext<TNode> = {
  skip: () => void;
  addNode: (node: TNode, prop: keyof TNode, index?: number) => void;
};

type WalkerFn<ONode, TNode> = (
  node: ONode,
  parent: ONode | null,
  context: ASTWalkerContext<TNode>
) => void;

type NodeProps<Node> = {
  node: Node;
  parent: Node | null;
  prop: keyof Node | null;
  index: number | null;
};

// Ported from https://github.com/Rich-Harris/estree-walker MIT License
export class ASTWalker<ONode extends object, TNode extends object> {
  private _should_skip = false;

  private _addedTNode: {
    node: TNode;
    prop: keyof TNode;
    index?: number;
  } | null = null;

  private _enter: WalkerFn<ONode, TNode> | undefined;
  private _leave: WalkerFn<ONode, TNode> | undefined;

  private context: ASTWalkerContext<TNode>;

  constructor() {
    this.context = {
      skip: () => (this._should_skip = true),
      addNode: (node: TNode, prop: keyof TNode, index?: number) =>
        (this._addedTNode = { node: node, prop: prop, index: index }),
    };
  }

  private _resetContext = () => {
    this._should_skip = false;
    this._addedTNode = null;
  };

  setEnter = (
    fn: (
      node: ONode,
      parent: ONode | null,
      context: ASTWalkerContext<TNode>
    ) => void
  ) => {
    this._enter = fn;
  };

  setLeave = (
    fn: (
      node: ONode,
      parent: ONode | null,
      context: ASTWalkerContext<TNode>
    ) => void
  ) => {
    this._leave = fn;
  };

  walk = (_oNode: ONode, _tNode: TNode) => {
    /* empty */
  };

  private _visit = (o: NodeProps<ONode>, t: NodeProps<TNode>) => {
    if (!o.node) return;

    if (this._enter) {
      const should_skip = this._should_skip;
      const addedTNode = this._addedTNode;
      this._resetContext();
      this._enter(o.node as ONode, o.parent, this.context);

      if (addedTNode) {
        if (addedTNode.index !== undefined) {
          (t.node[addedTNode.prop] as Array<object>).splice(
            addedTNode.index,
            0,
            addedTNode.node
          );
        } else {
          (t.node[addedTNode.prop] as object) = addedTNode.node;
        }
      }

      if (should_skip) {
        return;
      }
    }

    for (const key in o.node) {
      const value = o.node[key];

      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          const nodes = value;
          for (let i = 0; i < nodes.length; i += 1) {
            const item = nodes[i];
            if (item !== null && typeof item === 'object') {
              this._visit(
                { node: item, parent: o.node, prop: key, index: i },
                // FIXME: t.node is not correct
                { node: t.node, parent: null, prop: null, index: null }
              );
            }
          }
        } else {
          this._visit(
            { node: value as ONode, parent: o.node, prop: key, index: null },
            // FIXME: t.node is not correct
            { node: t.node, parent: null, prop: null, index: null }
          );
        }
      }
    }

    if (this._leave) {
      const should_skip = this._should_skip;
      const addedTNode = this._addedTNode;
      this._resetContext();
      this._leave(o.node as ONode, o.parent, this.context);

      if (addedTNode) {
        if (addedTNode.index !== undefined) {
          (t.node[addedTNode.prop] as Array<object>).splice(
            addedTNode.index,
            0,
            addedTNode.node
          );
        } else {
          (t.node[addedTNode.prop] as object) = addedTNode.node;
        }
      }

      if (should_skip) {
        return;
      }
    }
  };
}

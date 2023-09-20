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

type Keyof<T> = T extends unknown ? keyof T : never;

export type ASTWalkerContext<TNode> = {
  skip: () => void;
  addNode: (
    mountPoint: TNode,
    node: TNode,
    prop: Keyof<TNode>,
    index?: number
  ) => void;
  set: (key: string, value: unknown) => void;
  get: (key: string) => unknown;
};

type WalkerFn<ONode extends object, TNode extends object> = (
  o: NodeProps<ONode>,
  t: NodeProps<TNode>,
  context: ASTWalkerContext<TNode>
) => void;

type NodeProps<Node extends object> = {
  node: Node;
  parent: Node | null;
  prop: Keyof<Node> | null;
  index: number | null;
};

type AddTNodeProps<TNode extends object> = {
  mountPoint: TNode;
  node: TNode;
  prop: Keyof<TNode>;
  index?: number;
} | null;

// Ported from https://github.com/Rich-Harris/estree-walker MIT License
export class ASTWalker<ONode extends object, TNode extends object> {
  private _should_skip = false;

  private _addedTNode: AddTNodeProps<TNode> = null;

  private _lastAddedTNode: AddTNodeProps<TNode> = null;

  private _enter: WalkerFn<ONode, TNode> | undefined;
  private _leave: WalkerFn<ONode, TNode> | undefined;
  private _isONode!: (node: unknown) => node is ONode;

  private context: ASTWalkerContext<TNode>;
  private contextMap: Map<string, unknown> = new Map();

  constructor() {
    this.context = {
      skip: () => (this._should_skip = true),
      addNode: (
        mountPoint: TNode,
        node: TNode,
        prop: Keyof<TNode>,
        index?: number
      ) =>
        (this._lastAddedTNode = this._addedTNode =
          { mountPoint, node, prop, index }),
      set: (key: string, value: unknown) => this.contextMap.set(key, value),
      get: (key: string) => this.contextMap.get(key),
    };
  }

  private _resetContext = () => {
    this._should_skip = false;
    this._addedTNode = null;
  };

  setEnter = (fn: WalkerFn<ONode, TNode>) => {
    this._enter = fn;
  };

  setLeave = (fn: WalkerFn<ONode, TNode>) => {
    this._leave = fn;
  };

  setONodeTypeGuard = (fn: (node: unknown) => node is ONode) => {
    this._isONode = fn;
  };

  walk = (oNode: ONode, tNode: TNode) => {
    this._visit(
      { node: oNode, parent: null, prop: null, index: null },
      { node: tNode, parent: null, prop: null, index: null }
    );
  };

  private _visit = (o: NodeProps<ONode>, t: NodeProps<TNode>) => {
    if (!o.node) return;

    if (this._enter) {
      const should_skip = this._should_skip;
      const addedTNode = this._addedTNode;
      this._resetContext();
      this._enter(o, t, this.context);

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
          for (let i = 0; i < value.length; i += 1) {
            const item = value[i];
            if (item !== null && this._isONode(item)) {
              this._visit(
                {
                  node: item,
                  parent: o.node,
                  prop: key as unknown as Keyof<ONode>,
                  index: i,
                },
                {
                  node: this._lastAddedTNode?.node ?? t.node,
                  parent: this._lastAddedTNode?.node ? t.node : t.parent,
                  prop: this._lastAddedTNode?.prop ?? null,
                  index: this._lastAddedTNode?.index ?? null,
                }
              );
            }
          }
        } else if (this._isONode(value)) {
          this._visit(
            {
              node: value,
              parent: o.node,
              prop: key as unknown as Keyof<ONode>,
              index: null,
            },
            {
              node: this._lastAddedTNode?.node ?? t.node,
              parent: this._lastAddedTNode?.node ? t.node : t.parent,
              prop: this._lastAddedTNode?.prop ?? null,
              index: this._lastAddedTNode?.index ?? null,
            }
          );
        }
      }
    }

    if (this._leave) {
      const should_skip = this._should_skip;
      const addedTNode = this._addedTNode;
      this._resetContext();
      this._leave(o, t, this.context);

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

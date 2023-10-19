import type {
  BlockSnapshot,
  PageSnapshot,
  SliceSnapshot,
} from '../transformer/type.js';
import type { AdapterAssetsManager } from './assets.js';
import { ASTWalkerContext } from './context.js';

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

type WalkerFn<ONode extends object, TNode extends object> = (
  o: NodeProps<ONode>,
  context: ASTWalkerContext<TNode>
) => Promise<void>;

type NodeProps<Node extends object> = {
  node: Node;
  parent: Node | null;
  prop: Keyof<Node> | null;
  index: number | null;
};

// Ported from https://github.com/Rich-Harris/estree-walker MIT License
export class ASTWalker<ONode extends object, TNode extends object> {
  private _enter: WalkerFn<ONode, TNode> | undefined;
  private _leave: WalkerFn<ONode, TNode> | undefined;
  private _isONode!: (node: unknown) => node is ONode;

  private context: ASTWalkerContext<TNode>;

  constructor() {
    this.context = new ASTWalkerContext<TNode>();
  }

  setEnter = (fn: WalkerFn<ONode, TNode>) => {
    this._enter = fn;
  };

  setLeave = (fn: WalkerFn<ONode, TNode>) => {
    this._leave = fn;
  };

  setONodeTypeGuard = (fn: (node: unknown) => node is ONode) => {
    this._isONode = fn;
  };

  walk = async (oNode: ONode, tNode: TNode) => {
    this.context.openNode(tNode);
    await this._visit({ node: oNode, parent: null, prop: null, index: null });
    return this.context.currentNode();
  };

  private _visit = async (o: NodeProps<ONode>) => {
    if (!o.node) return;

    if (this._enter) {
      await this._enter(o, this.context);
    }

    if (this.context._skip) {
      this.context._skip = false;
      return;
    }

    for (const key in o.node) {
      const value = o.node[key];

      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i += 1) {
            const item = value[i];
            if (item !== null && this._isONode(item)) {
              await this._visit({
                node: item,
                parent: o.node,
                prop: key as unknown as Keyof<ONode>,
                index: i,
              });
            }
          }
        } else if (this._isONode(value)) {
          await this._visit({
            node: value,
            parent: o.node,
            prop: key as unknown as Keyof<ONode>,
            index: null,
          });
        }
      }
    }

    if (this._leave) {
      await this._leave(o, this.context);
    }
  };
}

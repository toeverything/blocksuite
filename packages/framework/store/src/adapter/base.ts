import { assertEquals } from '@blocksuite/global/utils';

import type { Doc } from '../store/index.js';
import type { AssetsManager } from '../transformer/assets.js';
import type { Slice } from '../transformer/index.js';
import type { DraftModel, Job } from '../transformer/index.js';
import type {
  BlockSnapshot,
  DocSnapshot,
  SliceSnapshot,
} from '../transformer/type.js';

import { ASTWalkerContext } from './context.js';

export type FromDocSnapshotPayload = {
  assets?: AssetsManager;
  snapshot: DocSnapshot;
};
export type FromBlockSnapshotPayload = {
  assets?: AssetsManager;
  snapshot: BlockSnapshot;
};
export type FromSliceSnapshotPayload = {
  assets?: AssetsManager;
  snapshot: SliceSnapshot;
};
export type FromDocSnapshotResult<Target> = {
  assetsIds: string[];
  file: Target;
};
export type FromBlockSnapshotResult<Target> = {
  assetsIds: string[];
  file: Target;
};
export type FromSliceSnapshotResult<Target> = {
  assetsIds: string[];
  file: Target;
};
export type ToDocSnapshotPayload<Target> = {
  assets?: AssetsManager;
  file: Target;
};
export type ToBlockSnapshotPayload<Target> = {
  assets?: AssetsManager;
  file: Target;
};
export type ToSliceSnapshotPayload<Target> = {
  assets?: AssetsManager;
  file: Target;
};

export abstract class BaseAdapter<AdapterTarget = unknown> {
  job: Job;

  constructor(job: Job) {
    this.job = job;
  }

  async fromBlock(mode: DraftModel) {
    const blockSnapshot = await this.job.blockToSnapshot(mode);
    return this.fromBlockSnapshot({
      assets: this.job.assetsManager,
      snapshot: blockSnapshot,
    });
  }

  async fromDoc(doc: Doc) {
    const docSnapshot = await this.job.docToSnapshot(doc);
    return this.fromDocSnapshot({
      assets: this.job.assetsManager,
      snapshot: docSnapshot,
    });
  }

  async fromSlice(slice: Slice) {
    const sliceSnapshot = await this.job.sliceToSnapshot(slice);
    return this.fromSliceSnapshot({
      assets: this.job.assetsManager,
      snapshot: sliceSnapshot,
    });
  }

  async toBlock(
    payload: ToBlockSnapshotPayload<AdapterTarget>,
    doc: Doc,
    parent?: string,
    index?: number
  ) {
    const snapshot = await this.toBlockSnapshot(payload);
    return this.job.snapshotToBlock(snapshot, doc, parent, index);
  }

  async toDoc(payload: ToDocSnapshotPayload<AdapterTarget>) {
    const snapshot = await this.toDocSnapshot(payload);
    return this.job.snapshotToDoc(snapshot);
  }

  async toSlice(
    payload: ToSliceSnapshotPayload<AdapterTarget>,
    doc: Doc,
    parent?: string,
    index?: number
  ) {
    const snapshot = await this.toSliceSnapshot(payload);
    if (!snapshot) return;
    return this.job.snapshotToSlice(snapshot, doc, parent, index);
  }

  get configs() {
    return this.job.adapterConfigs;
  }

  abstract fromBlockSnapshot(
    payload: FromBlockSnapshotPayload
  ):
    | FromBlockSnapshotResult<AdapterTarget>
    | Promise<FromBlockSnapshotResult<AdapterTarget>>;

  abstract fromDocSnapshot(
    payload: FromDocSnapshotPayload
  ):
    | FromDocSnapshotResult<AdapterTarget>
    | Promise<FromDocSnapshotResult<AdapterTarget>>;

  abstract fromSliceSnapshot(
    payload: FromSliceSnapshotPayload
  ):
    | FromSliceSnapshotResult<AdapterTarget>
    | Promise<FromSliceSnapshotResult<AdapterTarget>>;

  abstract toBlockSnapshot(
    payload: ToBlockSnapshotPayload<AdapterTarget>
  ): BlockSnapshot | Promise<BlockSnapshot>;

  abstract toDocSnapshot(
    payload: ToDocSnapshotPayload<AdapterTarget>
  ): DocSnapshot | Promise<DocSnapshot>;

  abstract toSliceSnapshot(
    payload: ToSliceSnapshotPayload<AdapterTarget>
  ): Promise<SliceSnapshot | null> | SliceSnapshot | null;
}

type Keyof<T> = T extends unknown ? keyof T : never;

type WalkerFn<ONode extends object, TNode extends object> = (
  o: NodeProps<ONode>,
  context: ASTWalkerContext<TNode>
) => Promise<void> | void;

type NodeProps<Node extends object> = {
  index: null | number;
  next?: Node | null;
  node: Node;
  parent: NodeProps<Node> | null;
  prop: Keyof<Node> | null;
};

// Ported from https://github.com/Rich-Harris/estree-walker MIT License
export class ASTWalker<ONode extends object, TNode extends never | object> {
  private _enter: WalkerFn<ONode, TNode> | undefined;

  private _isONode!: (node: unknown) => node is ONode;

  private _leave: WalkerFn<ONode, TNode> | undefined;

  private _visit = async (o: NodeProps<ONode>) => {
    if (!o.node) return;
    this.context._skipChildrenNum = 0;
    this.context._skip = false;

    if (this._enter) {
      await this._enter(o, this.context);
    }

    if (this.context._skip) {
      return;
    }

    for (const key in o.node) {
      const value = o.node[key];

      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          for (
            let i = this.context._skipChildrenNum;
            i < value.length;
            i += 1
          ) {
            const item = value[i];
            if (
              item !== null &&
              typeof item === 'object' &&
              this._isONode(item)
            ) {
              const nextItem = value[i + 1] ?? null;
              await this._visit({
                index: i,
                next: nextItem,
                node: item,
                parent: o,
                prop: key as unknown as Keyof<ONode>,
              });
            }
          }
        } else if (
          this.context._skipChildrenNum === 0 &&
          this._isONode(value)
        ) {
          await this._visit({
            index: null,
            next: null,
            node: value,
            parent: o,
            prop: key as unknown as Keyof<ONode>,
          });
        }
      }
    }

    if (this._leave) {
      await this._leave(o, this.context);
    }
  };

  private context: ASTWalkerContext<TNode>;

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
    await this._visit({ index: null, node: oNode, parent: null, prop: null });
    assertEquals(this.context.stack.length, 1, 'There are unclosed nodes');
    return this.context.currentNode();
  };

  walkONode = async (oNode: ONode) => {
    await this._visit({ index: null, node: oNode, parent: null, prop: null });
  };

  constructor() {
    this.context = new ASTWalkerContext<TNode>();
  }
}

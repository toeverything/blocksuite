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
  snapshot: DocSnapshot;
  assets?: AssetsManager;
};
export type FromBlockSnapshotPayload = {
  snapshot: BlockSnapshot;
  assets?: AssetsManager;
};
export type FromSliceSnapshotPayload = {
  snapshot: SliceSnapshot;
  assets?: AssetsManager;
};
export type FromDocSnapshotResult<Target> = {
  file: Target;
  assetsIds: string[];
};
export type FromBlockSnapshotResult<Target> = {
  file: Target;
  assetsIds: string[];
};
export type FromSliceSnapshotResult<Target> = {
  file: Target;
  assetsIds: string[];
};
export type ToDocSnapshotPayload<Target> = {
  file: Target;
  assets?: AssetsManager;
};
export type ToBlockSnapshotPayload<Target> = {
  file: Target;
  assets?: AssetsManager;
};
export type ToSliceSnapshotPayload<Target> = {
  file: Target;
  assets?: AssetsManager;
};

export abstract class BaseAdapter<AdapterTarget = unknown> {
  job: Job;

  constructor(job: Job) {
    this.job = job;
  }

  async fromBlock(mode: DraftModel) {
    const blockSnapshot = await this.job.blockToSnapshot(mode);
    return this.fromBlockSnapshot({
      snapshot: blockSnapshot,
      assets: this.job.assetsManager,
    });
  }

  async fromDoc(doc: Doc) {
    const docSnapshot = await this.job.docToSnapshot(doc);
    return this.fromDocSnapshot({
      snapshot: docSnapshot,
      assets: this.job.assetsManager,
    });
  }

  async fromSlice(slice: Slice) {
    const sliceSnapshot = await this.job.sliceToSnapshot(slice);
    return this.fromSliceSnapshot({
      snapshot: sliceSnapshot,
      assets: this.job.assetsManager,
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
    | Promise<FromBlockSnapshotResult<AdapterTarget>>
    | FromBlockSnapshotResult<AdapterTarget>;

  abstract fromDocSnapshot(
    payload: FromDocSnapshotPayload
  ):
    | Promise<FromDocSnapshotResult<AdapterTarget>>
    | FromDocSnapshotResult<AdapterTarget>;

  abstract fromSliceSnapshot(
    payload: FromSliceSnapshotPayload
  ):
    | Promise<FromSliceSnapshotResult<AdapterTarget>>
    | FromSliceSnapshotResult<AdapterTarget>;

  abstract toBlockSnapshot(
    payload: ToBlockSnapshotPayload<AdapterTarget>
  ): Promise<BlockSnapshot> | BlockSnapshot;

  abstract toDocSnapshot(
    payload: ToDocSnapshotPayload<AdapterTarget>
  ): Promise<DocSnapshot> | DocSnapshot;

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
  node: Node;
  next?: Node | null;
  parent: NodeProps<Node> | null;
  prop: Keyof<Node> | null;
  index: number | null;
};

// Ported from https://github.com/Rich-Harris/estree-walker MIT License
export class ASTWalker<ONode extends object, TNode extends object | never> {
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
                node: item,
                next: nextItem,
                parent: o,
                prop: key as unknown as Keyof<ONode>,
                index: i,
              });
            }
          }
        } else if (
          this.context._skipChildrenNum === 0 &&
          this._isONode(value)
        ) {
          await this._visit({
            node: value,
            next: null,
            parent: o,
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
    await this._visit({ node: oNode, parent: null, prop: null, index: null });
    assertEquals(this.context.stack.length, 1, 'There are unclosed nodes');
    return this.context.currentNode();
  };

  walkONode = async (oNode: ONode) => {
    await this._visit({ node: oNode, parent: null, prop: null, index: null });
  };

  constructor() {
    this.context = new ASTWalkerContext<TNode>();
  }
}

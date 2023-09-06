import type { BlockSnapshot, PageSnapshot } from '../transformer/type.js';
import type { AdapterAssetsManager } from './assets.js';

export type PageSnapshotPayload = {
  snapshot: PageSnapshot;
  assets?: AdapterAssetsManager;
};
export type BlockSnapshotPayload = {
  snapshot: BlockSnapshot;
  assets?: AdapterAssetsManager;
};
export type PageSnapshotReturn = PageSnapshotPayload;
export type BlockSnapshotReturn = BlockSnapshotPayload;

export abstract class BaseAdapter<AdapterTarget> {
  abstract convertPageSnapshotToAdapterTarget({
    snapshot,
    assets,
  }: PageSnapshotPayload): Promise<AdapterTarget>;
  abstract convertBlockSnapshotToAdapterTarget({
    snapshot,
    assets,
  }: BlockSnapshotPayload): Promise<AdapterTarget>;
  abstract convertAdapterTargetToPageSnapshot(
    file: AdapterTarget
  ): Promise<PageSnapshotReturn>;
  abstract convertAdapterTargetToBlockSnapshot(
    file: AdapterTarget
  ): Promise<BlockSnapshotReturn>;
}

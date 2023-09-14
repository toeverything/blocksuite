import type {
  FromBlockSnapshotPayload,
  FromPageSnapshotPayload,
  FromSliceSnapshotPayload,
  ToBlockSnapshotPayload,
  ToPageSnapshotPayload,
  ToSliceSnapshotPayload,
} from '@blocksuite/store';
import type {
  BlockSnapshot,
  PageSnapshot,
  SliceSnapshot,
} from '@blocksuite/store';
import { BaseAdapter } from '@blocksuite/store';

export class ClipboardAdapter extends BaseAdapter<string> {
  static MIME = 'BLOCKSUITE/SNAPSHOT';
  override fromPageSnapshot(
    _payload: FromPageSnapshotPayload
  ): Promise<string> {
    throw new Error('not implemented');
  }

  override toPageSnapshot(
    _payload: ToPageSnapshotPayload<string>
  ): Promise<PageSnapshot> {
    throw new Error('not implemented');
  }

  override fromBlockSnapshot(
    _payload: FromBlockSnapshotPayload
  ): Promise<string> {
    throw new Error('not implemented');
  }

  override toBlockSnapshot(
    _payload: ToBlockSnapshotPayload<string>
  ): Promise<BlockSnapshot> {
    throw new Error('not implemented');
  }

  override fromSliceSnapshot(
    payload: FromSliceSnapshotPayload
  ): Promise<string> {
    return Promise.resolve(JSON.stringify(payload.snapshot));
  }

  override toSliceSnapshot(
    payload: ToSliceSnapshotPayload<string>
  ): Promise<SliceSnapshot> {
    const json = JSON.parse(payload.file);
    return Promise.resolve(json);
  }
}

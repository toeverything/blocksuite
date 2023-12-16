import { assertExists } from '@blocksuite/global/utils';
import type {
  FromBlockSnapshotPayload,
  FromBlockSnapshotResult,
  FromPageSnapshotPayload,
  FromPageSnapshotResult,
  FromSliceSnapshotPayload,
  FromSliceSnapshotResult,
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

import { decode, encode } from './utils.js';

type FileSnapshot = {
  name: string;
  type: string;
  content: string;
};

export class ClipboardAdapter extends BaseAdapter<string> {
  static MIME = 'BLOCKSUITE/SNAPSHOT';
  override fromPageSnapshot(
    _payload: FromPageSnapshotPayload
  ): Promise<FromPageSnapshotResult<string>> {
    throw new Error('not implemented');
  }

  override toPageSnapshot(
    _payload: ToPageSnapshotPayload<string>
  ): Promise<PageSnapshot> {
    throw new Error('not implemented');
  }

  override fromBlockSnapshot(
    _payload: FromBlockSnapshotPayload
  ): Promise<FromBlockSnapshotResult<string>> {
    throw new Error('not implemented');
  }

  override toBlockSnapshot(
    _payload: ToBlockSnapshotPayload<string>
  ): Promise<BlockSnapshot> {
    throw new Error('not implemented');
  }

  override async fromSliceSnapshot(
    payload: FromSliceSnapshotPayload
  ): Promise<FromSliceSnapshotResult<string>> {
    const snapshot = payload.snapshot;
    const assets = payload.assets;
    assertExists(assets);
    const map = assets.getAssets();
    const blobs: Record<string, FileSnapshot> = {};
    await Promise.all(
      Array.from(map.entries()).map(async ([id, blob]) => {
        const content = encode(await blob.arrayBuffer());
        const file: FileSnapshot = {
          name: (blob as File).name,
          type: blob.type,
          content,
        };
        blobs[id] = file;
      })
    );
    return {
      file: JSON.stringify({
        snapshot,
        blobs,
      }),
      assetsIds: [],
    };
  }

  override toSliceSnapshot(
    payload: ToSliceSnapshotPayload<string>
  ): Promise<SliceSnapshot> {
    const json = JSON.parse(payload.file);
    const { blobs, snapshot } = json;
    const map = payload.assets?.getAssets();
    Object.entries<FileSnapshot>(blobs).forEach(([sourceId, file]) => {
      const blob = new Blob([decode(file.content)]);
      const f = new File([blob], file.name, {
        type: file.type,
      });
      assertExists(map);
      map.set(sourceId, f);
    });
    return Promise.resolve(snapshot);
  }
}

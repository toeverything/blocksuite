import { assertExists } from '@blocksuite/global/utils';
import type {
  FromBlockSnapshotPayload,
  FromBlockSnapshotResult,
  FromDocSnapshotPayload,
  FromDocSnapshotResult,
  FromSliceSnapshotPayload,
  FromSliceSnapshotResult,
  ToBlockSnapshotPayload,
  ToDocSnapshotPayload,
  ToSliceSnapshotPayload,
} from '@blocksuite/store';
import type {
  BlockSnapshot,
  DocSnapshot,
  SliceSnapshot,
} from '@blocksuite/store';
import { BaseAdapter } from '@blocksuite/store';
import { EJSON } from 'bson';

type FileSnapshot = {
  name: string;
  type: string;
  content: ArrayBuffer;
};

export class ClipboardAdapter extends BaseAdapter<string> {
  static MIME = 'BLOCKSUITE/SNAPSHOT';
  override fromDocSnapshot(
    _payload: FromDocSnapshotPayload
  ): Promise<FromDocSnapshotResult<string>> {
    throw new Error('not implemented');
  }

  override toDocSnapshot(
    _payload: ToDocSnapshotPayload<string>
  ): Promise<DocSnapshot> {
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
        const file: FileSnapshot = {
          name: (blob as File).name,
          type: blob.type,
          content: await blob.arrayBuffer(),
        };
        blobs[id] = file;
      })
    );
    return {
      file: EJSON.stringify({
        snapshot,
        blobs,
      }),
      assetsIds: [],
    };
  }

  override toSliceSnapshot(
    payload: ToSliceSnapshotPayload<string>
  ): Promise<SliceSnapshot> {
    const { snapshot, blobs } = EJSON.parse(payload.file);
    const map = payload.assets?.getAssets();
    Object.entries<FileSnapshot>(blobs).forEach(([sourceId, file]) => {
      const f = new File([file.content], file.name, {
        type: file.type,
      });
      assertExists(map);
      map.set(sourceId, f);
    });
    return Promise.resolve(snapshot);
  }
}

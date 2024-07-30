import type {
  BlockSnapshot,
  DocSnapshot,
  FromBlockSnapshotPayload,
  FromBlockSnapshotResult,
  FromDocSnapshotPayload,
  FromDocSnapshotResult,
  FromSliceSnapshotPayload,
  FromSliceSnapshotResult,
  SliceSnapshot,
  ToBlockSnapshotPayload,
  ToDocSnapshotPayload,
  ToSliceSnapshotPayload,
} from '@blocksuite/store';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { assertExists } from '@blocksuite/global/utils';
import { BaseAdapter } from '@blocksuite/store';

import { decodeClipboardBlobs, encodeClipboardBlobs } from './utils.js';

export type FileSnapshot = {
  name: string;
  type: string;
  content: string;
};

export class ClipboardAdapter extends BaseAdapter<string> {
  static MIME = 'BLOCKSUITE/SNAPSHOT';

  override fromBlockSnapshot(
    _payload: FromBlockSnapshotPayload
  ): Promise<FromBlockSnapshotResult<string>> {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'ClipboardAdapter.fromBlockSnapshot is not implemented'
    );
  }

  override fromDocSnapshot(
    _payload: FromDocSnapshotPayload
  ): Promise<FromDocSnapshotResult<string>> {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'ClipboardAdapter.fromDocSnapshot is not implemented'
    );
  }

  override async fromSliceSnapshot(
    payload: FromSliceSnapshotPayload
  ): Promise<FromSliceSnapshotResult<string>> {
    const snapshot = payload.snapshot;
    const assets = payload.assets;
    assertExists(assets);
    const map = assets.getAssets();
    const blobs: Record<string, FileSnapshot> = await encodeClipboardBlobs(map);
    return {
      file: JSON.stringify({
        snapshot,
        blobs,
      }),
      assetsIds: [],
    };
  }

  override toBlockSnapshot(
    _payload: ToBlockSnapshotPayload<string>
  ): Promise<BlockSnapshot> {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'ClipboardAdapter.toBlockSnapshot is not implemented'
    );
  }

  override toDocSnapshot(
    _payload: ToDocSnapshotPayload<string>
  ): Promise<DocSnapshot> {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'ClipboardAdapter.toDocSnapshot is not implemented'
    );
  }

  override toSliceSnapshot(
    payload: ToSliceSnapshotPayload<string>
  ): Promise<SliceSnapshot> {
    const json = JSON.parse(payload.file);
    const { blobs, snapshot } = json;
    const map = payload.assets?.getAssets();
    decodeClipboardBlobs(blobs, map);
    return Promise.resolve(snapshot);
  }
}

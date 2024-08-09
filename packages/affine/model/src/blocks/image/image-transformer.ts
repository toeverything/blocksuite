import type {
  FromSnapshotPayload,
  SnapshotReturn,
  ToSnapshotPayload,
} from '@blocksuite/store';

import { BaseBlockTransformer } from '@blocksuite/store';

import type { ImageBlockProps } from './image-model.js';

export class ImageBlockTransformer extends BaseBlockTransformer<ImageBlockProps> {
  override async fromSnapshot(
    payload: FromSnapshotPayload
  ): Promise<SnapshotReturn<ImageBlockProps>> {
    const snapshotRet = await super.fromSnapshot(payload);
    const sourceId = snapshotRet.props.sourceId;
    if (!payload.assets.isEmpty() && sourceId && !sourceId.startsWith('/'))
      await payload.assets.writeToBlob(sourceId);

    return snapshotRet;
  }

  override async toSnapshot(payload: ToSnapshotPayload<ImageBlockProps>) {
    const snapshot = await super.toSnapshot(payload);
    const sourceId = payload.model.sourceId;
    if (sourceId) await payload.assets.readFromBlob(sourceId);

    return snapshot;
  }
}

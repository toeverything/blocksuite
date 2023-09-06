import type {
  FromSnapshotPayload,
  SnapshotReturn,
  ToSnapshotPayload,
} from '@blocksuite/store';
import { BaseBlockTransformer } from '@blocksuite/store';

import type { ImageBlockProps } from './image-model.js';

export class ImageBlockTransformer extends BaseBlockTransformer<ImageBlockProps> {
  override async toSnapshot(payload: ToSnapshotPayload<ImageBlockProps>) {
    const snapshot = await super.toSnapshot(payload);
    const sourceId = payload.model.sourceId;
    await payload.assets.readFromBlob(sourceId);

    return snapshot;
  }

  override async fromSnapshot(
    payload: FromSnapshotPayload
  ): Promise<SnapshotReturn<ImageBlockProps>> {
    const snapshotRet = await super.fromSnapshot(payload);
    const sourceId = snapshotRet.props.sourceId;
    await payload.assets.writeToBlob(sourceId);

    return snapshotRet;
  }
}

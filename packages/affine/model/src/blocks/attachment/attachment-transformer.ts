import type { FromSnapshotPayload, SnapshotNode } from '@blocksuite/store';

import { BaseBlockTransformer } from '@blocksuite/store';

import type { AttachmentBlockProps } from './attachment-model.js';

export class AttachmentBlockTransformer extends BaseBlockTransformer<AttachmentBlockProps> {
  override async fromSnapshot(
    payload: FromSnapshotPayload
  ): Promise<SnapshotNode<AttachmentBlockProps>> {
    const snapshotRet = await super.fromSnapshot(payload);
    const sourceId = snapshotRet.props.sourceId;
    if (!payload.assets.isEmpty() && sourceId)
      await payload.assets.writeToBlob(sourceId);

    return snapshotRet;
  }
}

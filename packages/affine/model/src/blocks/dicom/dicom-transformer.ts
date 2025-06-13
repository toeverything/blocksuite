import type {
  BlockSnapshotLeaf,
  FromSnapshotPayload,
  SnapshotNode,
  ToSnapshotPayload,
} from '@blocksuite/store';
import { BaseBlockTransformer } from '@blocksuite/store';

import type { DicomBlockProps } from './dicom-model.js';

export class DicomBlockTransformer extends BaseBlockTransformer<DicomBlockProps> {
  override async fromSnapshot(
    payload: FromSnapshotPayload
  ): Promise<SnapshotNode<DicomBlockProps>> {
    const snapshotRet = await super.fromSnapshot(payload);
    const sourceId = snapshotRet.props.sourceId;
    if (!payload.assets.isEmpty() && sourceId)
      await payload.assets.writeToBlob(sourceId);

    return snapshotRet;
  }

  override toSnapshot(
    snapshot: ToSnapshotPayload<DicomBlockProps>
  ): BlockSnapshotLeaf {
    const snapshotRet = super.toSnapshot(snapshot);
    //const sourceId = snapshot.model.sourceId;
    const sourceId = snapshot.model.props.sourceId;
    if (sourceId) {
      const pathBlobIdMap = snapshot.assets.getPathBlobIdMap();
      pathBlobIdMap.set(snapshot.model.id, sourceId);
    }
    return snapshotRet;
  }
}
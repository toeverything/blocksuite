import type { AssetsManager } from '@blocksuite/store';

import { sha } from '@blocksuite/global/utils';
import {
  BaseAdapter,
  type BlockSnapshot,
  type DocSnapshot,
  type FromBlockSnapshotPayload,
  type FromBlockSnapshotResult,
  type FromDocSnapshotPayload,
  type FromDocSnapshotResult,
  type FromSliceSnapshotPayload,
  type FromSliceSnapshotResult,
  type SliceSnapshot,
  type ToBlockSnapshotPayload,
  type ToDocSnapshotPayload,
  nanoid,
} from '@blocksuite/store';

export type Attachment = File[];

type AttachmentToSliceSnapshotPayload = {
  assets?: AssetsManager;
  blockVersions: Record<string, number>;
  file: Attachment;
  pageId: string;
  pageVersion: number;
  workspaceId: string;
  workspaceVersion: number;
};

export class AttachmentAdapter extends BaseAdapter<Attachment> {
  override fromBlockSnapshot(
    _payload: FromBlockSnapshotPayload
  ): Promise<FromBlockSnapshotResult<Attachment>> {
    throw new Error('Method not implemented.');
  }

  override fromDocSnapshot(
    _payload: FromDocSnapshotPayload
  ): Promise<FromDocSnapshotResult<Attachment>> {
    throw new Error('Method not implemented.');
  }

  override fromSliceSnapshot(
    payload: FromSliceSnapshotPayload
  ): Promise<FromSliceSnapshotResult<Attachment>> {
    const attachments: Attachment = [];
    for (const contentSlice of payload.snapshot.content) {
      if (contentSlice.type === 'block') {
        const { flavour, props } = contentSlice;
        if (flavour === 'affine:attachment') {
          const { sourceId } = props;
          const file = payload.assets?.getAssets().get(sourceId as string) as
            | File
            | undefined;
          if (file) {
            attachments.push(file);
          }
        }
      }
    }
    return Promise.resolve({ assetsIds: [], file: attachments });
  }

  override toBlockSnapshot(
    _payload: ToBlockSnapshotPayload<Attachment>
  ): Promise<BlockSnapshot> {
    throw new Error('Method not implemented.');
  }

  override toDocSnapshot(
    _payload: ToDocSnapshotPayload<Attachment>
  ): Promise<DocSnapshot> {
    throw new Error('Method not implemented.');
  }

  override async toSliceSnapshot(
    payload: AttachmentToSliceSnapshotPayload
  ): Promise<SliceSnapshot | null> {
    const content: SliceSnapshot['content'] = [];
    for (const item of payload.file) {
      const blobId = await sha(await item.arrayBuffer());
      payload.assets?.getAssets().set(blobId, item);
      await payload.assets?.writeToBlob(blobId);
      content.push({
        children: [],
        flavour: 'affine:attachment',
        id: nanoid(),
        props: {
          embed: false,
          index: 'a0',
          name: item.name,
          rotate: 0,
          size: item.size,
          sourceId: blobId,
          style: 'horizontalThin',
          type: item.type,
          xywh: '[0,0,0,0]',
        },
        type: 'block',
      });
    }
    if (content.length === 0) {
      return null;
    }
    return {
      content,
      pageId: payload.pageId,
      pageVersion: payload.pageVersion,
      type: 'slice',
      workspaceId: payload.workspaceId,
      workspaceVersion: payload.workspaceVersion,
    };
  }
}

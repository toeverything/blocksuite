import { sha } from '@blocksuite/global/utils';
import type { AssetsManager } from '@blocksuite/store';
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
  nanoid,
  type SliceSnapshot,
  type ToBlockSnapshotPayload,
  type ToDocSnapshotPayload,
} from '@blocksuite/store';

export type Image = File[];

type ImageToSliceSnapshotPayload = {
  file: Image;
  assets?: AssetsManager;
  blockVersions: Record<string, number>;
  pageVersion: number;
  workspaceVersion: number;
  workspaceId: string;
  pageId: string;
};

export class ImageAdapter extends BaseAdapter<Image> {
  override fromDocSnapshot(
    _payload: FromDocSnapshotPayload
  ): Promise<FromDocSnapshotResult<Image>> {
    throw new Error('Method not implemented.');
  }

  override fromBlockSnapshot(
    _payload: FromBlockSnapshotPayload
  ): Promise<FromBlockSnapshotResult<Image>> {
    throw new Error('Method not implemented.');
  }

  override fromSliceSnapshot(
    payload: FromSliceSnapshotPayload
  ): Promise<FromSliceSnapshotResult<Image>> {
    const images: Image = [];
    for (const contentSlice of payload.snapshot.content) {
      if (contentSlice.type === 'block') {
        const { flavour, props } = contentSlice;
        if (flavour === 'affine:image') {
          const { sourceId } = props;
          const file = payload.assets?.getAssets().get(sourceId as string) as
            | File
            | undefined;
          if (file) {
            images.push(file);
          }
        }
      }
    }
    return Promise.resolve({ file: images, assetsIds: [] });
  }

  override toDocSnapshot(
    _payload: ToDocSnapshotPayload<Image>
  ): Promise<DocSnapshot> {
    throw new Error('Method not implemented.');
  }

  override toBlockSnapshot(
    _payload: ToBlockSnapshotPayload<Image>
  ): Promise<BlockSnapshot> {
    throw new Error('Method not implemented.');
  }

  override async toSliceSnapshot(
    payload: ImageToSliceSnapshotPayload
  ): Promise<SliceSnapshot | null> {
    const content: SliceSnapshot['content'] = [];
    for (const item of payload.file) {
      const blobId = await sha(await item.arrayBuffer());
      payload.assets?.getAssets().set(blobId, item);
      await payload.assets?.writeToBlob(blobId);
      content.push({
        type: 'block',
        flavour: 'affine:image',
        id: nanoid(),
        props: {
          sourceId: blobId,
        },
        children: [],
      });
    }
    if (content.length === 0) {
      return null;
    }
    return {
      type: 'slice',
      content,
      pageVersion: payload.pageVersion,
      workspaceVersion: payload.workspaceVersion,
      workspaceId: payload.workspaceId,
      pageId: payload.pageId,
    };
  }
}

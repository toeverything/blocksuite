import type { AssetsManager } from '@blocksuite/store';
import {
  BaseAdapter,
  type BlockSnapshot,
  type FromBlockSnapshotPayload,
  type FromBlockSnapshotResult,
  type FromPageSnapshotPayload,
  type FromPageSnapshotResult,
  type FromSliceSnapshotPayload,
  type FromSliceSnapshotResult,
  nanoid,
  type PageSnapshot,
  sha,
  type SliceSnapshot,
  type ToBlockSnapshotPayload,
  type ToPageSnapshotPayload,
} from '@blocksuite/store';

export type Image = File[];

type PngToSliceSnapshotPayload = {
  file: Image;
  assets?: AssetsManager;
  blockVersions: Record<string, number>;
  pageVersion: number;
  workspaceVersion: number;
  workspaceId: string;
  pageId: string;
};

export class ImageAdapter extends BaseAdapter<Image> {
  override fromPageSnapshot(
    _payload: FromPageSnapshotPayload
  ): Promise<FromPageSnapshotResult<Image>> {
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
          const file = payload.assets?.getAssets().get(sourceId as string);
          images.push(file as File);
        }
      }
    }
    return Promise.resolve({ file: images, assetsIds: [] });
  }
  override toPageSnapshot(
    _payload: ToPageSnapshotPayload<Image>
  ): Promise<PageSnapshot> {
    throw new Error('Method not implemented.');
  }
  override toBlockSnapshot(
    _payload: ToBlockSnapshotPayload<Image>
  ): Promise<BlockSnapshot> {
    throw new Error('Method not implemented.');
  }
  override async toSliceSnapshot(
    payload: PngToSliceSnapshotPayload
  ): Promise<SliceSnapshot | null> {
    const content: SliceSnapshot['content'] = [];
    for (const item of payload.file) {
      const blobId = await sha(await item.arrayBuffer());
      payload.assets?.getAssets().set(blobId, item);
      await payload.assets?.writeToBlob(blobId);
      content.push({
        type: 'block',
        flavour: 'affine:image',
        id: nanoid('block'),
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
      blockVersions: payload.blockVersions,
      pageVersion: payload.pageVersion,
      workspaceVersion: payload.workspaceVersion,
      workspaceId: payload.workspaceId,
      pageId: payload.pageId,
    };
  }
}

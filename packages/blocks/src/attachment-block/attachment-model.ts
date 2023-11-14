import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

/**
 * When the attachment is uploading, the `sourceId` is `undefined`.
 * And we can query the upload status by the `isAttachmentLoading` function.
 *
 * Other collaborators will show a error attachment block when the blob is not uploaded.
 * We can sync the upload status by the awareness system in the future.
 *
 * When the attachment is uploaded, the `sourceId` is the id of the blob.
 *
 * If there are no `sourceId` and the `isAttachmentLoading` function returns `false`,
 * it means that the attachment is failed to upload.
 */

export type AttachmentBlockProps = {
  name: string;
  size: number;
  /**
   * MIME type
   */
  type: string;
  caption?: string;
  sourceId?: string;
};

export const defaultAttachmentProps: AttachmentBlockProps = {
  name: '',
  size: 0,
  type: 'application/octet-stream',
  sourceId: undefined,
  caption: undefined,
};

export const AttachmentBlockSchema = defineBlockSchema({
  flavour: 'affine:attachment',
  props: (): AttachmentBlockProps => defaultAttachmentProps,
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:note'],
  },
  toModel: () => new AttachmentBlockModel(),
});

export class AttachmentBlockModel extends BaseBlockModel<AttachmentBlockProps> {
  constructor() {
    super();

    this.created.on(() => {
      const blobId = this.sourceId;
      if (!blobId) return;
      const blob = this.page.blob.get(blobId);
      if (!blob) {
        console.error(`Blob ${blobId} not found in blob manager`);
        return;
      }
      this.page.blob.increaseRef(blobId);
    });
    this.propsUpdated.on(({ oldProps, newProps }) => {
      const oldBlobId = (oldProps as AttachmentBlockProps).sourceId;
      const newBlobId = (newProps as AttachmentBlockProps).sourceId;
      if (oldBlobId === newBlobId) return;

      if (oldBlobId) {
        const oldBlob = this.page.blob.get(oldBlobId);
        if (!oldBlob) {
          console.error(`Blob ${oldBlobId} not found in blob manager`);
          return;
        }
        this.page.blob.decreaseRef(oldBlobId);
      }

      if (newBlobId) {
        const newBlob = this.page.blob.get(newBlobId);
        if (!newBlob) {
          console.error(`Blob ${newBlobId} not found in blob manager`);
          return;
        }
        this.page.blob.increaseRef(newBlobId);
      }
    });
    this.deleted.on(() => {
      const blobId = this.sourceId;
      if (!blobId) return;
      const blob = this.page.blob.get(blobId);
      if (!blob) {
        console.error(`Blob ${blobId} not found in blob manager`);
        return;
      }

      this.page.blob.decreaseRef(blobId);
    });
  }
}

import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

export type AttachmentBlockProps = {
  name: string;
  size: number;
  /**
   * MIME type
   */
  type: string;
  caption?: string;

  /**
   * `loadingKey` is used to indicate whether the attachment is uploading.
   * You can query the loading state by calling `isAttachmentLoading(loadingKey)`
   *
   * We can not use `loading: true` directly because the state will be stored in the model,
   * which will cause infinite loading of the block after reloading the page.
   *
   * NOTE: The `loadingKey` and `sourceId` should not be existed at the same time
   */
  loadingKey?: string | null;
  sourceId?: string;
};

export const defaultAttachmentProps: AttachmentBlockProps = {
  name: '',
  size: 0,
  type: 'application/octet-stream',
  sourceId: undefined,
  loadingKey: undefined,
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

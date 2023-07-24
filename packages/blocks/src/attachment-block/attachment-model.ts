import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

export type AttachmentProps = {
  name: string;
  size: number;
  sourceId: string;
  caption?: string;
};

export const defaultAttachmentProps: AttachmentProps = {
  name: '',
  size: 0,
  sourceId: '',
  caption: undefined,
};

export const AttachmentBlockSchema = defineBlockSchema({
  flavour: 'affine:attachment',
  props: (internal): AttachmentProps => defaultAttachmentProps,
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:note'],
  },
});

export type AttachmentBlockModel = SchemaToModel<typeof AttachmentBlockSchema>;

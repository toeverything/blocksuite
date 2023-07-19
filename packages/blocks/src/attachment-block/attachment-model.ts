import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

export type AttachmentProps = {
  title: string;
  description: string;
  icon: string;
  url: string;
  image: string;
  caption?: string;
};

export const defaultAttachmentProps: AttachmentProps = {
  title: '',
  description: '',
  url: '',
  icon: '',
  image: '',
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

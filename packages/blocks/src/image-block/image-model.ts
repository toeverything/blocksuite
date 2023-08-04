import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

export type ImageProps = {
  caption?: string;
  sourceId: string;
  width?: number;
  height?: number;
};

const defaultImageProps: ImageProps = {
  caption: '',
  sourceId: '',
  width: 0,
  height: 0,
};

export const ImageBlockSchema = defineBlockSchema({
  flavour: 'affine:image',
  props: () => defaultImageProps,
  metadata: {
    version: 1,
    role: 'content',
  },
});

export type ImageBlockModel = SchemaToModel<typeof ImageBlockSchema>;

import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

import { ImageBlockTransformer } from './image-transformer.js';

export type ImageBlockProps = {
  name: string;
  caption?: string;
  sourceId: string;
  width?: number;
  height?: number;
};

const defaultImageProps: ImageBlockProps = {
  name: '',
  caption: '',
  sourceId: '',
  width: 0,
  height: 0,
};

export const ImageBlockSchema = defineBlockSchema({
  flavour: 'affine:image',
  props: (): ImageBlockProps => defaultImageProps,
  metadata: {
    version: 1,
    role: 'content',
  },
  transformer: () => new ImageBlockTransformer(),
});

export type ImageBlockModel = SchemaToModel<typeof ImageBlockSchema>;

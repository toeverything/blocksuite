import type { SerializedXYWH } from '@blocksuite/global/utils';

import {
  GfxCompatible,
  type GfxElementGeometry,
} from '@blocksuite/block-std/gfx';
import { BlockModel, defineBlockSchema } from '@blocksuite/store';

type PdfProps = {
  xywh: SerializedXYWH;
  index: string;
  scale: number;
  rotate: number;

  // Total pages
  pages: number;
  // Blob id
  thumbnail?: string;
  // Metadata
  metadata?: Record<string, string>;
  layout?: 'portrait' | 'landscape';
};

export const PdfBlockSchema = defineBlockSchema({
  flavour: 'affine:pdf',
  props: (): PdfProps => ({
    xywh: '[0,0,16,16]',
    index: 'a0',
    scale: 1,
    rotate: 0,
    pages: 0,
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: [
      'affine:note',
      'affine:edgeless-text',
      'affine:paragraph',
      'affine:list',
    ],
  },
  toModel: () => {
    return new PdfBlockModel();
  },
});

export class PdfBlockModel
  extends GfxCompatible<PdfProps>(BlockModel)
  implements GfxElementGeometry {}

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:pdf': PdfBlockModel;
    }

    interface EdgelessBlockModelMap {
      'affine:pdf': PdfBlockModel;
    }
  }
}

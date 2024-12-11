import {
  type GfxCommonBlockProps,
  GfxCompatible,
  type GfxElementGeometry,
} from '@blocksuite/block-std/gfx';
import { BlockModel, defineBlockSchema } from '@blocksuite/store';

export type LatexProps = {
  latex: string;
} & GfxCommonBlockProps;

export const LatexBlockSchema = defineBlockSchema({
  flavour: 'affine:latex',
  props: (): LatexProps => ({
    xywh: '[0,0,16,16]',
    index: 'a0',
    lockedBySelf: false,
    scale: 1,
    rotate: 0,
    latex: '',
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
    return new LatexBlockModel();
  },
});

export class LatexBlockModel
  extends GfxCompatible<LatexProps>(BlockModel)
  implements GfxElementGeometry {}

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:latex': LatexBlockModel;
    }

    interface EdgelessBlockModelMap {
      'affine:latex': LatexBlockModel;
    }
  }
}

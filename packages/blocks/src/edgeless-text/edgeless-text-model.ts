import type { Text } from '@blocksuite/store';
import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import {
  FontFamily,
  FontStyle,
  FontWeight,
  TextAlign,
  type TextStyleProps,
} from '../surface-block/consts.js';
import type { SerializedXYWH } from '../surface-block/utils/xywh.js';

type EdgelessTextProps = {
  xywh: SerializedXYWH;
  index: string;
  text: Text;
  scale: number;
  rotate: number;
  hasMaxWidth: boolean;
} & Omit<TextStyleProps, 'fontSize'>;

export const EdgelessTextBlockSchema = defineBlockSchema({
  flavour: 'affine:edgeless-text',
  props: (internal): EdgelessTextProps => ({
    xywh: '[0,0,16,16]',
    index: 'a0',
    text: internal.Text(),
    color: '#000000',
    fontFamily: FontFamily.Inter,
    fontStyle: FontStyle.Normal,
    fontWeight: FontWeight.Regular,
    textAlign: TextAlign.Left,
    scale: 1,
    rotate: 0,
    hasMaxWidth: false,
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:surface'],
    children: [
      'affine:paragraph',
      'affine:list',
      'affine:code',
      'affine:divider',
      'affine:image',
      'affine:bookmark',
      'affine:attachment',
      'affine:embed-*',
    ],
  },
  toModel: () => {
    return new EdgelessTextBlockModel();
  },
});

export class EdgelessTextBlockModel extends selectable<EdgelessTextProps>(
  BlockModel
) {}

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:edgeless-text': EdgelessTextBlockModel;
    }

    interface EdgelessBlockModelMap {
      'affine:edgeless-text': EdgelessTextBlockModel;
    }

    interface EdgelessTextModelMap {
      'edgeless-text': EdgelessTextBlockModel;
    }
  }
}

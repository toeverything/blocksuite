import type { Text } from '@blocksuite/store';
import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import { FontFamily, FontStyle, FontWeight } from '../surface-block/consts.js';
import type { SerializedXYWH } from '../surface-block/utils/xywh.js';

interface EdgelessTextProps {
  xywh: SerializedXYWH;
  index: string;
  text: Text;
  color: string;
  fontSize: number;
  fontFamily: FontFamily;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  textAlign: 'left' | 'center' | 'right';
  scale: number;
  rotate: number;
  hasMaxWidth: boolean;
}

export const EdgelessTextBlockSchema = defineBlockSchema({
  flavour: 'affine:edgeless-text',
  props: (internal): EdgelessTextProps => ({
    xywh: '[0,0,16,16]',
    index: 'a0',
    text: internal.Text(),
    color: '#000000',
    fontSize: 16,
    fontFamily: FontFamily.Inter,
    fontWeight: FontWeight.Regular,
    fontStyle: FontStyle.Normal,
    textAlign: 'left',
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
    interface EdgelessBlockModelMap {
      'affine:edgeless-text': EdgelessTextBlockModel;
    }
  }
}

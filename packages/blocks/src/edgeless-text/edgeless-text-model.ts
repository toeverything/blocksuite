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
  scale: number;
  rotate: number;
  hasMaxWidth: boolean;
} & Omit<TextStyleProps, 'fontSize'>;

export const EdgelessTextBlockSchema = defineBlockSchema({
  flavour: 'affine:edgeless-text',
  props: (): EdgelessTextProps => ({
    xywh: '[0,0,16,16]',
    index: 'a0',
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
    role: 'hub',
    parent: ['affine:surface'],
    children: [
      'affine:paragraph',
      'affine:list',
      'affine:code',
      'affine:image',
      'affine:bookmark',
      'affine:attachment',
      'affine:embed-!(synced-doc)',
    ],
  },
  toModel: () => {
    return new EdgelessTextBlockModel();
  },
});

export class EdgelessTextBlockModel extends selectable<EdgelessTextProps>(
  BlockModel
) {}

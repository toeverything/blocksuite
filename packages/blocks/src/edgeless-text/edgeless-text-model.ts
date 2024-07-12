import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import type { SerializedXYWH } from '../surface-block/utils/xywh.js';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import {
  FontFamily,
  FontStyle,
  FontWeight,
  TextAlign,
  type TextStyleProps,
} from '../surface-block/consts.js';

type EdgelessTextProps = {
  hasMaxWidth: boolean;
  index: string;
  rotate: number;
  scale: number;
  xywh: SerializedXYWH;
} & Omit<TextStyleProps, 'fontSize'>;

export const EdgelessTextBlockSchema = defineBlockSchema({
  flavour: 'affine:edgeless-text',
  metadata: {
    children: [
      'affine:paragraph',
      'affine:list',
      'affine:code',
      'affine:image',
      'affine:bookmark',
      'affine:attachment',
      'affine:embed-!(synced-doc)',
    ],
    parent: ['affine:surface'],
    role: 'hub',
    version: 1,
  },
  props: (): EdgelessTextProps => ({
    color: '#000000',
    fontFamily: FontFamily.Inter,
    fontStyle: FontStyle.Normal,
    fontWeight: FontWeight.Regular,
    hasMaxWidth: false,
    index: 'a0',
    rotate: 0,
    scale: 1,
    textAlign: TextAlign.Left,
    xywh: '[0,0,16,16]',
  }),
  toModel: () => {
    return new EdgelessTextBlockModel();
  },
});

export class EdgelessTextBlockModel extends selectable<EdgelessTextProps>(
  BlockModel
) {}

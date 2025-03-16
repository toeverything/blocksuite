import type {
  GfxCommonBlockProps,
  GfxElementGeometry,
} from '@blocksuite/block-std/gfx';
import { GfxCompatible } from '@blocksuite/block-std/gfx';
import {
  BlockModel,
  BlockSchemaExtension,
  defineBlockSchema,
} from '@blocksuite/store';
import { z } from 'zod';

import {
  FontFamily,
  FontFamilySchema,
  FontStyle,
  FontStyleSchema,
  FontWeight,
  FontWeightSchema,
  TextAlign,
  TextAlignSchema,
  type TextStyleProps,
} from '../../consts/index.js';
import { ColorSchema } from '../../themes/color.js';
import { DefaultTheme } from '../../themes/default.js';

type EdgelessTextProps = {
  hasMaxWidth: boolean;
} & Omit<TextStyleProps, 'fontSize'> &
  GfxCommonBlockProps;

export const EdgelessTextZodSchema = z
  .object({
    color: ColorSchema,
    fontFamily: FontFamilySchema,
    fontWeight: FontWeightSchema,
    fontStyle: FontStyleSchema,
    textAlign: TextAlignSchema,
  })
  .default({
    color: DefaultTheme.textColor,
    fontFamily: FontFamily.Inter,
    fontWeight: FontWeight.Regular,
    fontStyle: FontStyle.Normal,
    textAlign: TextAlign.Left,
  });

export const EdgelessTextBlockSchema = defineBlockSchema({
  flavour: 'affine:edgeless-text',
  props: (): EdgelessTextProps => ({
    xywh: '[0,0,16,16]',
    index: 'a0',
    lockedBySelf: false,
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
      'affine:latex',
    ],
  },
  toModel: () => {
    return new EdgelessTextBlockModel();
  },
});

export const EdgelessTextBlockSchemaExtension = BlockSchemaExtension(
  EdgelessTextBlockSchema
);

export class EdgelessTextBlockModel
  extends GfxCompatible<EdgelessTextProps>(BlockModel)
  implements GfxElementGeometry
{
  get color() {
    return this.props.color;
  }

  set color(color: EdgelessTextProps['color']) {
    this.props.color = color;
  }
}

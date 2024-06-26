import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import {
  EdgelessTransformController,
  Transformable,
  type TransformControllerContext,
} from '../_common/edgeless/transform-controller/index.js';
import { clamp } from '../_common/utils/math.js';
import { HandleDirection } from '../root-block/edgeless/components/resize/resize-handles.js';
import {
  FontFamily,
  FontStyle,
  FontWeight,
  TextAlign,
  type TextStyleProps,
} from '../surface-block/consts.js';
import { Bound } from '../surface-block/index.js';
import type { SerializedXYWH } from '../surface-block/utils/xywh.js';
import { EDGELESS_TEXT_BLOCK_MIN_WIDTH } from './edgeless-text-block.js';

type EdgelessTextProps = {
  xywh: SerializedXYWH;
  index: string;
  scale: number;
  rotate: number;
  hasMaxWidth: boolean;
} & Omit<TextStyleProps, 'fontSize'>;

class EdgelessTextTransformController extends EdgelessTransformController<EdgelessTextBlockModel> {
  override rotatable = true;

  override onTransformStart(): void {}

  override onTransformEnd(): void {}

  override adjust(
    element: EdgelessTextBlockModel,
    { rect, bound, direction }: TransformControllerContext
  ): void {
    const oldXYWH = Bound.deserialize(element.xywh);
    if (
      direction === HandleDirection.TopLeft ||
      direction === HandleDirection.TopRight ||
      direction === HandleDirection.BottomRight ||
      direction === HandleDirection.BottomLeft
    ) {
      const newScale = element.scale * (bound.w / oldXYWH.w);
      rect.updateScaleDisplay(newScale, direction);

      bound.h = bound.w * (oldXYWH.h / oldXYWH.w);
      rect.edgeless.service.updateElement(element.id, {
        scale: newScale,
        xywh: bound.serialize(),
      });
    } else if (
      direction === HandleDirection.Left ||
      direction === HandleDirection.Right
    ) {
      const newRealWidth = clamp(
        bound.w / element.scale,
        EDGELESS_TEXT_BLOCK_MIN_WIDTH,
        Infinity
      );
      bound.w = newRealWidth * element.scale;
      rect.edgeless.service.updateElement(element.id, {
        xywh: Bound.serialize({
          ...bound,
          h: oldXYWH.h,
        }),
        hasMaxWidth: true,
      });
    }
  }
}

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
      'affine:embed-*',
    ],
  },
  toModel: () => {
    return new EdgelessTextBlockModel();
  },
});

@Transformable(new EdgelessTextTransformController())
export class EdgelessTextBlockModel extends selectable<EdgelessTextProps>(
  BlockModel
) {}

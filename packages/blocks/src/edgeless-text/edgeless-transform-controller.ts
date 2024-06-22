import { clamp } from '../_common/utils/math.js';
import {
  EdgelessTransformableRegistry,
  EdgelessTransformController,
  type TransformControllerContext,
} from '../root-block/edgeless/components/rects/edgeless-selected-rect/controllers/index.js';
import { HandleDirection } from '../root-block/edgeless/components/resize/resize-handles.js';
import { Bound } from '../surface-block/index.js';
import { EDGELESS_TEXT_BLOCK_MIN_WIDTH } from './edgeless-text-block.js';
import { EdgelessTextBlockModel } from './edgeless-text-model.js';

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

EdgelessTransformableRegistry.register(
  EdgelessTextBlockModel,
  new EdgelessTextTransformController()
);

import { clamp } from '../_common/utils/math.js';
import {
  EdgelessTransformableRegistry,
  EdgelessTransformController,
  type TransformControllerContext,
} from '../root-block/edgeless/components/rects/edgeless-selected-rect/controllers/index.js';
import { Bound } from '../surface-block/index.js';
import { EmbedSyncedDocModel } from './embed-synced-doc-model.js';
import { SYNCED_MIN_HEIGHT, SYNCED_MIN_WIDTH } from './styles.js';

class EmbedSyncedDocTransformController extends EdgelessTransformController<EmbedSyncedDocModel> {
  override onTransformStart(): void {}

  override onTransformEnd(): void {}

  override adjust(
    element: EmbedSyncedDocModel,
    { shiftKey, bound, rect, direction }: TransformControllerContext
  ): void {
    const curBound = Bound.deserialize(element.xywh);

    let scale = element.scale ?? 1;
    let width = curBound.w / scale;
    let height = curBound.h / scale;
    if (shiftKey) {
      scale = bound.w / width;
      rect.updateScaleDisplay(scale, direction);
    }

    width = bound.w / scale;
    width = clamp(width, SYNCED_MIN_WIDTH, Infinity);
    bound.w = width * scale;

    height = bound.h / scale;
    height = clamp(height, SYNCED_MIN_HEIGHT, Infinity);
    bound.h = height * scale;

    rect.limit(width === SYNCED_MIN_HEIGHT, height === SYNCED_MIN_HEIGHT);

    rect.edgeless.service.updateElement(element.id, {
      scale,
      xywh: bound.serialize(),
    });
  }
}

EdgelessTransformableRegistry.register(
  EmbedSyncedDocModel,
  new EmbedSyncedDocTransformController()
);

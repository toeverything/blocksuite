import { clamp } from '../_common/utils/math.js';
import {
  EdgelessTransformableRegistry,
  EdgelessTransformController,
  type TransformControllerContext,
} from '../root-block/edgeless/components/rects/edgeless-selected-rect/controllers/index.js';
import { EmbedHtmlModel } from './embed-html-model.js';
import { EMBED_HTML_MIN_HEIGHT, EMBED_HTML_MIN_WIDTH } from './styles.js';

class EmbedHtmlTransformController extends EdgelessTransformController<EmbedHtmlModel> {
  override onTransformStart(): void {}

  override onTransformEnd(): void {}

  override adjust(
    element: EmbedHtmlModel,
    { bound, rect }: TransformControllerContext
  ): void {
    bound.w = clamp(bound.w, EMBED_HTML_MIN_WIDTH, Infinity);
    bound.h = clamp(bound.h, EMBED_HTML_MIN_HEIGHT, Infinity);

    rect.limit(
      bound.w === EMBED_HTML_MIN_WIDTH,
      bound.h === EMBED_HTML_MIN_HEIGHT
    );

    rect.edgeless.service.updateElement(element.id, {
      xywh: bound.serialize(),
    });
  }
}

EdgelessTransformableRegistry.register(
  EmbedHtmlModel,
  new EmbedHtmlTransformController()
);

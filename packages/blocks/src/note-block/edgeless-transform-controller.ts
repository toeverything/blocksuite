import { clamp } from '../_common/utils/math.js';
import {
  EdgelessTransformableRegistry,
  EdgelessTransformController,
  type TransformControllerContext,
} from '../root-block/edgeless/components/rects/edgeless-selected-rect/controllers/index.js';
import {
  NOTE_MIN_HEIGHT,
  NOTE_MIN_WIDTH,
} from '../root-block/edgeless/utils/consts.js';
import { Bound } from '../surface-block/index.js';
import { NoteBlockModel } from './note-model.js';

class NoteBlockTransformController extends EdgelessTransformController<NoteBlockModel> {
  override onTransformStart(element: NoteBlockModel): void {
    element.stash('edgeless');
  }

  override onTransformEnd(element: NoteBlockModel): void {
    element.pop('edgeless');
  }

  override adjust(
    element: NoteBlockModel,
    { rect, bound, direction, shiftKey }: TransformControllerContext
  ): void {
    const curBound = Bound.deserialize(element.xywh);

    let scale = element.edgeless.scale ?? 1;
    let width = curBound.w / scale;
    let height = curBound.h / scale;

    if (shiftKey) {
      scale = bound.w / width;
      rect.updateScaleDisplay(scale, direction);
    } else if (curBound.h !== bound.h) {
      rect.edgeless.doc.updateBlock(element, () => {
        element.edgeless.collapse = true;
        element.edgeless.collapsedHeight = bound.h / scale;
      });
    }

    width = bound.w / scale;
    width = clamp(width, NOTE_MIN_WIDTH, Infinity);
    bound.w = width * scale;

    height = bound.h / scale;
    height = clamp(height, NOTE_MIN_HEIGHT, Infinity);
    bound.h = height * scale;

    rect.limit(width === NOTE_MIN_WIDTH, height === NOTE_MIN_HEIGHT);

    rect.edgeless.service.updateElement(element.id, {
      edgeless: {
        ...element.edgeless,
        scale,
      },
      xywh: bound.serialize(),
    });
  }
}

EdgelessTransformableRegistry.register(
  NoteBlockModel,
  new NoteBlockTransformController()
);

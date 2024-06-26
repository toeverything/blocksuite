import { BlockModel } from '@blocksuite/store';

import { Transformable } from '../_common/edgeless/transform-controller/decorator.js';
import {
  EdgelessTransformController,
  type TransformControllerContext,
} from '../_common/edgeless/transform-controller/transform-controller.js';
import { defineEmbedModel } from '../_common/embed-block-helper/embed-block-model.js';
import type { EmbedCardStyle } from '../_common/types.js';
import { clamp } from '../_common/utils/math.js';
import { Bound } from '../surface-block/index.js';
import { SYNCED_MIN_HEIGHT, SYNCED_MIN_WIDTH } from './styles.js';

export const EmbedSyncedDocStyles: EmbedCardStyle[] = ['syncedDoc'];

export type EmbedSyncedDocBlockProps = {
  pageId: string;
  style: EmbedCardStyle;
  caption?: string | null;
  scale?: number;
};

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

@Transformable(new EmbedSyncedDocTransformController())
export class EmbedSyncedDocModel extends defineEmbedModel<EmbedSyncedDocBlockProps>(
  BlockModel
) {}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:embed-synced-doc': EmbedSyncedDocModel;
    }
  }
}

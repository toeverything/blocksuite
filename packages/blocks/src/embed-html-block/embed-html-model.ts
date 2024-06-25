import { BlockModel } from '@blocksuite/store';

import { defineEmbedModel } from '../_common/embed-block-helper/embed-block-model.js';
import type { EmbedCardStyle } from '../_common/types.js';
import { clamp } from '../_common/utils/math.js';
import {
  EdgelessTransformController,
  Transformable,
  type TransformControllerContext,
} from '../root-block/edgeless/components/rects/edgeless-selected-rect/controllers/index.js';
import { EMBED_HTML_MIN_HEIGHT, EMBED_HTML_MIN_WIDTH } from './styles.js';

export const EmbedHtmlStyles: EmbedCardStyle[] = ['html'] as const;

export type EmbedHtmlBlockProps = {
  style: (typeof EmbedHtmlStyles)[number];
  caption: string | null;
  html?: string;
  design?: string;
};

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

@Transformable(new EmbedHtmlTransformController())
export class EmbedHtmlModel extends defineEmbedModel<EmbedHtmlBlockProps>(
  BlockModel
) {}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:embed-html': EmbedHtmlModel;
    }
  }
}

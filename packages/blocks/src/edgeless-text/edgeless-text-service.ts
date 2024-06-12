import { BlockService } from '@blocksuite/block-std';

import { asyncFocusRichText } from '../_common/utils/selection.js';
import { GET_DEFAULT_TEXT_COLOR } from '../root-block/edgeless/components/panel/color-panel.js';
import type { EdgelessRootBlockComponent } from '../root-block/index.js';
import { FontFamily } from '../surface-block/consts.js';
import { Bound } from '../surface-block/utils/bound.js';
import {
  EDGELESS_TEXT_BLOCK_MIN_HEIGHT,
  EDGELESS_TEXT_BLOCK_MIN_WIDTH,
} from './edgeless-text-block.js';
import type { EdgelessTextBlockModel } from './edgeless-text-model.js';

export class EdgelessTextBlockService extends BlockService<EdgelessTextBlockModel> {
  initEdgelessTextBlock({
    edgeless,
    x,
    y,
  }: {
    edgeless: EdgelessRootBlockComponent;
    x: number;
    y: number;
  }) {
    const textId = edgeless.service.addBlock(
      'affine:edgeless-text',
      {
        xywh: new Bound(
          x - EDGELESS_TEXT_BLOCK_MIN_WIDTH / 2,
          y - EDGELESS_TEXT_BLOCK_MIN_HEIGHT / 2,
          EDGELESS_TEXT_BLOCK_MIN_WIDTH,
          EDGELESS_TEXT_BLOCK_MIN_HEIGHT
        ).serialize(),
        color: GET_DEFAULT_TEXT_COLOR(),
        fontFamily: FontFamily.Kalam,
      },
      edgeless.surface.blockId
    );

    const blockId = edgeless.doc.addBlock(
      'affine:paragraph',
      { type: 'text' },
      textId
    );
    edgeless.updateComplete
      .then(() => {
        edgeless.service.selection.set({
          elements: [textId],
          editing: true,
        });
        asyncFocusRichText(edgeless.host, blockId)
          ?.then(() => {
            const edgelessText = edgeless.host.view.getBlock(textId);
            const paragraph = edgeless.host.view.getBlock(blockId);
            if (!edgelessText || !paragraph) return;

            const abortController = new AbortController();
            paragraph.addEventListener(
              'focusout',
              () => {
                if (
                  !paragraph.model.text ||
                  paragraph.model.text.length === 0
                ) {
                  edgeless.doc.deleteBlock(edgelessText.model);
                }
              },
              {
                once: true,
                signal: abortController.signal,
              }
            );
            paragraph.model.deleted.once(() => {
              abortController.abort();
            });
          })
          .catch(console.error);
      })
      .catch(console.error);

    return textId;
  }
}

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:edgeless-text': EdgelessTextBlockService;
    }
  }
}

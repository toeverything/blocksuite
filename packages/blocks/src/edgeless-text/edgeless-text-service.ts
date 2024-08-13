import type { EdgelessTextBlockModel } from '@blocksuite/affine-model';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import { BlockService } from '@blocksuite/block-std';
import { Bound } from '@blocksuite/global/utils';

import type { EdgelessRootBlockComponent } from '../root-block/index.js';

import {
  EDGELESS_TEXT_BLOCK_MIN_HEIGHT,
  EDGELESS_TEXT_BLOCK_MIN_WIDTH,
} from './edgeless-text-block.js';

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
    const zoom = edgeless.service.zoom;
    const textId = edgeless.service.addBlock(
      'affine:edgeless-text',
      {
        xywh: new Bound(
          x - (EDGELESS_TEXT_BLOCK_MIN_WIDTH * zoom) / 2,
          y - (EDGELESS_TEXT_BLOCK_MIN_HEIGHT * zoom) / 2,
          EDGELESS_TEXT_BLOCK_MIN_WIDTH * zoom,
          EDGELESS_TEXT_BLOCK_MIN_HEIGHT * zoom
        ).serialize(),
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
        focusTextModel(edgeless.std, blockId);
        edgeless.host.updateComplete
          .then(() => {
            const edgelessText = edgeless.host.view.getBlock(textId);
            const paragraph = edgeless.host.view.getBlock(blockId);
            if (!edgelessText || !paragraph) return;

            const abortController = new AbortController();
            edgelessText.addEventListener(
              'focusout',
              e => {
                if (
                  !paragraph.model.text ||
                  (paragraph.model.text.length === 0 &&
                    e.relatedTarget !== null)
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

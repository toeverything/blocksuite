import type { DefaultPageBlockComponent } from '../default/default-page-block.js';
import type { EdgelessPageBlockComponent } from '../edgeless/edgeless-page-block.js';
import { assertExists, Signal } from '@blocksuite/global/utils';
import { BlockHub } from '../../components/index.js';
import { asyncFocusRichText } from '../../__internal__/index.js';
import { tryUpdateFrameSize } from './container-operations.js';

export function createBlockHub(
  pageBlock: DefaultPageBlockComponent | EdgelessPageBlockComponent,
  updateSelectedRectsSignal?: Signal<DOMRect[]>
) {
  const page = pageBlock.page;
  return new BlockHub(
    {
      onDropCallback: (e, end) => {
        const dataTransfer = e.dataTransfer;
        assertExists(dataTransfer);
        const data = dataTransfer.getData('affine/block-hub');
        const blockProps = JSON.parse(data);
        if (blockProps.flavour === 'affine:database') {
          if (!page.awarenessStore.getFlag('enable_database')) {
            console.warn('database block is not enabled');
            return;
          }
        }
        const targetModel = end.model;
        const rect = end.position;
        page.captureSync();
        const distanceToTop = Math.abs(rect.top - e.y);
        const distanceToBottom = Math.abs(rect.bottom - e.y);
        const id = page.addSiblingBlock(
          targetModel,
          blockProps,
          distanceToTop < distanceToBottom ? 'right' : 'left'
        );
        asyncFocusRichText(page, id);
        tryUpdateFrameSize(page, 1);
      },
    },
    updateSelectedRectsSignal
  );
}

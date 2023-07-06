import '../../__internal__/rich-text/link-node/affine-link.js';

import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import { LinkMockSelection } from '../../__internal__/rich-text/link-node/mock-selection.js';
import {
  blockRangeToNativeRange,
  getCurrentBlockRange,
} from '../../__internal__/utils/block-range.js';
import {
  getEditorContainer,
  getVirgoByModel,
} from '../../__internal__/utils/index.js';
import { showLinkPopover } from './index.js';

export function createLink(page: Page) {
  const blockRange = getCurrentBlockRange(page);
  if (!blockRange) return;
  if (blockRange.models.length > 1) {
    throw new Error("Can't create link with multiple blocks for now");
  }
  const startModel = blockRange.models[0];
  if (!startModel) return;
  const vEditor = getVirgoByModel(startModel);
  assertExists(vEditor);
  const vRange = {
    index: blockRange.startOffset,
    length: blockRange.endOffset - blockRange.startOffset,
  };
  if (vRange.length === 0) {
    return;
  }

  // User can cancel link by pressing shortcut again
  const format = vEditor.getFormat(vRange);
  if (format.link) {
    page.captureSync();
    vEditor.formatText(vRange, { link: null });
    vEditor.setVRange(vRange);
    // recreate link
    // setTimeout(() => {
    //   createLink(page);
    // });
    return;
  }

  // mock a selection style
  const range = blockRangeToNativeRange(blockRange);
  assertExists(range);
  const rects = Array.from(range.getClientRects());

  const container = getEditorContainer(page);
  assertExists(container);
  const containerRect = container.getBoundingClientRect();

  const mockSelection = new LinkMockSelection(
    rects.map(
      rect =>
        new DOMRect(
          rect.left - containerRect.left,
          rect.top - containerRect.top,
          rect.width,
          rect.height
        )
    )
  );
  const affineEditorContainer = getEditorContainer(page);
  assertExists(affineEditorContainer);
  affineEditorContainer.appendChild(mockSelection);

  setTimeout(async () => {
    const linkState = await showLinkPopover({
      anchorEl: mockSelection.shadowRoot?.querySelector('div') as HTMLElement,
      model: startModel,
    });

    mockSelection.remove();
    if (linkState.type !== 'confirm') return;

    const link = linkState.link;

    page.captureSync();
    vEditor.formatText(vRange, { link });
    vEditor.setVRange(vRange);
  });
}

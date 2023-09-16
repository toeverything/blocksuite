import type { TextSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';

import {
  getEditorContainer,
  getVirgoByModel,
} from '../../../../__internal__/utils/query.js';
import { getCurrentNativeRange } from '../../../../__internal__/utils/selection.js';
import { showLinkPopover } from '../../../../components/rich-text/virgo/nodes/link-node/link-popover/create-link-popover.js';
import { LinkMockSelection } from '../../../../components/rich-text/virgo/nodes/link-node/mock-selection.js';
import { getSelectedContentModels } from '../../selection.js';

export function toggleLink(root: BlockSuiteRoot, textSelection: TextSelection) {
  if (textSelection.isCollapsed()) {
    return;
  }

  if (!textSelection.isInSameBlock()) {
    return;
  }

  const selectedModel = getSelectedContentModels(root, ['text']);
  if (selectedModel.length === 0) {
    return;
  }

  const [model] = selectedModel;
  const page = root.page;
  const vEditor = getVirgoByModel(model);
  assertExists(vEditor);

  const vRange = textSelection.from;
  const format = vEditor.getFormat(vRange);

  if (format.link) {
    page.captureSync();
    vEditor.formatText(vRange, { link: null });
    vEditor.setVRange(vRange);
    return;
  }

  const createMockSelection = () => {
    const range = getCurrentNativeRange();
    const rects = Array.from(range.getClientRects());
    const container = getEditorContainer(page);
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
    container.appendChild(mockSelection);

    return () => {
      container.removeChild(mockSelection);
    };
  };

  const clear = createMockSelection();
  showLinkPopover({
    anchorEl: vEditor.rootElement,
    model,
  }).then(linkState => {
    if (linkState.type !== 'confirm') {
      clear();
      return;
    }

    const link = linkState.link;

    clear();
    page.captureSync();
    vEditor.formatText(vRange, { link });
    vEditor.setVRange(vRange);
  });
}

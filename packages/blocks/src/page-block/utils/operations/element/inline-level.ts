import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { VIRGO_ROOT_ATTR, type VirgoRootElement } from '@blocksuite/virgo';

import { getEditorContainer } from '../../../../__internal__/utils/query.js';
import { getCurrentNativeRange } from '../../../../__internal__/utils/selection.js';
import { showLinkPopover } from '../../../../components/rich-text/virgo/nodes/link-node/link-popover/show-link-popover.js';
import { LinkMockSelection } from '../../../../components/rich-text/virgo/nodes/link-node/mock-selection.js';

export function toggleLink(root: BlockSuiteRoot) {
  const selection = document.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);

  const { startContainer } = range;
  const vRoot = startContainer.parentElement?.closest<VirgoRootElement>(
    `[${VIRGO_ROOT_ATTR}]`
  );
  if (!vRoot) return;

  const vEditor = vRoot.virgoEditor;
  assertExists(vEditor);

  const vRange = vEditor.getVRange();
  if (!vRange) return;
  const format = vEditor.getFormat(vRange);
  const page = root.page;

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
    type: 'create',
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

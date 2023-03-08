import './affine-link.js';

import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import { showLinkPopover } from '../../../components/link-popover/index.js';
import {
  getCurrentNativeRange,
  getEditorContainer,
  getRichTextByModel,
  getStartModelBySelection,
  isRangeNativeSelection,
} from '../../utils/index.js';
import { LinkMockSelection } from './mock-selection.js';

export function createLink(page: Page) {
  // TODO may allow user creating a link with text
  if (!isRangeNativeSelection()) return;

  const startModel = getStartModelBySelection();
  if (!startModel) return;
  const richText = getRichTextByModel(startModel);
  if (!richText) return;

  const { vEditor } = richText;
  assertExists(vEditor);
  const vRange = vEditor.getVRange();
  assertExists(vRange);
  // TODO support selection with multiple blocks

  // User can cancel link by pressing shortcut again
  const format = vEditor.getFormat(vRange);
  if (format.link) {
    delete format.link;
    page.captureSync();
    vEditor.formatText(vRange, format, {
      mode: 'replace',
    });
    vEditor.setVRange(vRange);
    setTimeout(() => {
      createLink(page);
    });
    return;
  }

  // mock a selection style
  const range = getCurrentNativeRange();
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
  const affineEditorContainer = document.querySelector(
    '.affine-editor-container'
  );
  assertExists(affineEditorContainer);
  affineEditorContainer.appendChild(mockSelection);

  setTimeout(async () => {
    const linkState = await showLinkPopover({
      anchorEl: mockSelection.shadowRoot?.querySelector('div') as HTMLElement,
    });

    mockSelection.remove();
    if (linkState.type !== 'confirm') return;

    const link = linkState.link;

    page.captureSync();
    vEditor.formatText(vRange, { link });
  });
}

import './affine-link.js';

import { getVEditorFormat } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import { showLinkPopover } from '../../../components/link-popover/index.js';
import {
  getCurrentNativeRange,
  getRichTextByModel,
  getStartModelBySelection,
  isRangeNativeSelection,
} from '../../utils/index.js';
import { LinkMockSelection } from './mock-selection.js';

export function createLink(page: Page) {
  // TODO may allow user creating a link with text
  if (!isRangeNativeSelection()) return;

  const startModel = getStartModelBySelection();
  const richText = getRichTextByModel(startModel);
  if (!richText) return;

  const { vEditor } = richText;
  assertExists(vEditor);
  const vRange = vEditor.getVRange();
  assertExists(vRange);
  // TODO support selection with multiple blocks

  // User can cancel link by pressing shortcut again
  const format = getVEditorFormat(vEditor, vRange);
  delete format.link;
  if (format.link) {
    page.captureSync();
    vEditor.formatText(vRange, format, {
      mode: 'replace',
    });
    return;
  }

  // mock a selection style
  const range = getCurrentNativeRange();
  const rects = Array.from(range.getClientRects());
  const mockSelection = new LinkMockSelection(rects);
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

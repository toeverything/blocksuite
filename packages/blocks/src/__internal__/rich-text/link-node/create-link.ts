import type { Page } from '@blocksuite/store';
import type { ParentBlot } from 'parchment';
import { showLinkPopover } from '../../../components/link-popover/index.js';
import {
  assertExists,
  getRichTextByModel,
  getStartModelBySelection,
  hotkey,
  isRangeSelection,
} from '../../utils/index.js';
import './link-node';
import { MockSelectNode } from './mock-select-node.js';

// Disable hotkey to fix common hotkey(ctrl+c, ctrl+v, etc) not working at edit link popover
export const createLink = hotkey.withDisabledHotkeyFn(async (page: Page) => {
  if (!isRangeSelection()) {
    // TODO maybe allow user creating a link with text
    return;
  }
  const startModel = getStartModelBySelection();
  const richText = getRichTextByModel(startModel);
  if (!richText) {
    return;
  }
  const { quill } = richText;
  const range = quill.getSelection();
  // TODO fix selection with multiple lines
  assertExists(range);

  // User can cancel link by pressing shortcut again
  const format = quill.getFormat(range);
  if (format?.link) {
    page.captureSync();
    const { index, length } = range;
    startModel.text?.format(index, length, { link: false });
    return;
  }

  // Note: Just mock a selection style, this operation should not be recorded to store
  quill.format('mock-select', true);

  // See https://github.com/quilljs/parchment/blob/main/src/blot/scroll.ts
  const [node, offset] = (quill.scroll as unknown as ParentBlot).descendant(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- https://github.com/quilljs/parchment/issues/121
    MockSelectNode as any,
    range.index
  );
  if (!node) {
    console.error('Error on getBlotNode', MockSelectNode, quill, range);
    throw new Error('Failed to getBlotNode, node not found!');
  }

  const mockSelectBlot = node as MockSelectNode;
  const mockSelectDom = mockSelectBlot?.domNode as HTMLElement | undefined;
  if (!mockSelectDom) {
    console.error('Error on createLink', mockSelectBlot, quill, range);
    throw new Error('Failed to create link, mockSelectDom not found!');
  }

  const linkState = await showLinkPopover({ anchorEl: mockSelectDom });

  quill.formatText(range, { 'mock-select': false });
  if (linkState.type !== 'confirm') {
    return;
  }
  const link = linkState.link;

  page.captureSync();
  startModel.text?.format(range.index, range.length, { link });
});

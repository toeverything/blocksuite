import './link-node.js';

import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';
import type { ParentBlot } from 'parchment';

import { showLinkPopover } from '../../../components/link-popover/index.js';
import {
  getRichTextByModel,
  getStartModelBySelection,
  isRangeNativeSelection,
} from '../../utils/index.js';
import { MockSelectNode } from './mock-select-node.js';

export async function createLink(page: Page) {
  // TODO may allow user creating a link with text
  if (!isRangeNativeSelection()) return;

  const startModel = getStartModelBySelection();
  const richText = getRichTextByModel(startModel);
  if (!richText) return;

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
  const [node] = (quill.scroll as unknown as ParentBlot).descendant(
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
  if (linkState.type !== 'confirm') return;

  const link = linkState.link;

  page.captureSync();
  startModel.text?.format(range.index, range.length, { link });
}

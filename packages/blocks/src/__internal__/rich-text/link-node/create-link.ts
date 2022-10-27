import { Store } from '@blocksuite/store';
import {
  assertExists,
  getRichTextByModel,
  getStartModelBySelection,
  isRangeSelection,
} from '../../utils';
import './link-node';
import { showLinkPopover } from './link-popover/create-link-popover';
import { MockSelectNode } from './mock-select-node';

export const createLink = async (store: Store, e: KeyboardEvent) => {
  if (!isRangeSelection()) {
    // TODO maybe allow user creating a link with text
    e.preventDefault();
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
    store.captureSync();
    const { index, length } = range;
    startModel.text?.format(index, length, { link: false });
    return;
  }

  // Note: Just mock a selection style, this operation should not be recorded to store
  quill.format('mock-select', true);

  // TODO fix Blot types
  // See https://github.com/quilljs/parchment/blob/main/src/blot/scroll.ts
  // @ts-expect-error
  const [node, offset] = quill.scroll.descendant(MockSelectNode, range.index);
  if (!node) {
    console.error('Error on getBlotNode', MockSelectNode, quill, range);
    throw new Error('Failed to getBlotNode, node not found!');
  }

  const mockSelectBlot: MockSelectNode = node;
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

  store.captureSync();
  startModel.text?.format(range.index, range.length, { link });
};

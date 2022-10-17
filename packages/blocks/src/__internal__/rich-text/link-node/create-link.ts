import { Store } from '@blocksuite/store';
import Quill, { RangeStatic } from 'quill';
import {
  assertExists,
  getRichTextByModel,
  getStartModelBySelection,
  isRangeSelection,
} from '../../utils';
import './link-node';
import { MockSelectNode } from './mock-select-node';

const getBlotNode = <T>(
  type: T,
  quill: Quill,
  range: RangeStatic
): [T, number] => {
  // See https://github.com/quilljs/parchment/blob/main/src/blot/scroll.ts
  // @ts-expect-error
  const [node, offset] = quill.scroll.descendant(type, range.index);
  if (!node) {
    console.error('Error on getBlotNode', type, quill, range);
    throw new Error('Failed to getBlotNode, node not found!');
  }
  //   if (offset !== 0) {
  //     console.warn(
  //       'Unexpected getBlotNode state, offset is not 0, offset:',
  //       offset
  //     );
  //   }
  return [node, offset];
};

export const createLink = async (store: Store, e: KeyboardEvent) => {
  if (!isRangeSelection()) {
    // TODO maybe allow user creating a link with text
    return;
  }

  // TODO maybe user can cancel link by pressing shortcut again
  // const format = quill.getFormat(range);
  // if (format?.link) {
  //   quill.format('link', false);
  //   return;
  // }

  const startModel = getStartModelBySelection();
  const richText = getRichTextByModel(startModel);
  if (!richText) {
    return;
  }
  const { quill } = richText;
  const range = quill.getSelection();
  // TODO fix selection with multiple lines
  assertExists(range);

  // Note: Just mock a selection style, this operation should not be recorded to store
  quill.format('mock-select', true);

  const [mockSelectNode] = getBlotNode(MockSelectNode, quill, range);
  const mockSelectDom = mockSelectNode?.domNode as HTMLElement | undefined;
  if (!mockSelectDom) {
    console.error('Error on createLink', mockSelectNode, quill, range);
    throw new Error('Failed to create link, mockSelectDom not found!');
  }

  // XXX Prevent autofocus error
  // Autofocus processing was blocked because a document already has a focused element.
  quill.blur();

  const link = await showCreateLinkTooltip({ anchorEl: mockSelectDom });

  quill.formatText(range, { 'mock-select': false });
  if (!link) {
    return;
  }

  store.captureSync();
  store.transact(() => {
    startModel.text?.format(range.index, range.length, { link });
  });

  const LinkBlot = Quill.import('formats/link');
  const [linkNode] = getBlotNode(LinkBlot, quill, range);
  const linkDom = linkNode?.domNode as HTMLElement | undefined;
  if (!linkDom) {
    throw new Error('Failed to create link, mockSelectDom not found!');
  }
};

const showCreateLinkTooltip = async ({
  anchorEl,
  container = document.body,
}: {
  anchorEl: HTMLElement;
  container?: HTMLElement;
}) => {
  const ele = document.createElement('edit-link-panel');
  const rect = anchorEl.getBoundingClientRect();
  const bodyRect = document.body.getBoundingClientRect();
  const offset = rect.top - bodyRect.top + rect.height;

  ele.setAttribute('left', `${(rect.left + rect.right) / 2}px`);
  ele.setAttribute('top', `${offset}px`);
  container.appendChild(ele);

  return new Promise(res => {
    ele.addEventListener('confirm', e => {
      ele.remove();
      res(e.detail.link);
    });
  });
};

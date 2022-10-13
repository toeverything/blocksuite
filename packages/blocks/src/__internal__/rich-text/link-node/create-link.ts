import Quill, { RangeStatic } from 'quill';
import { MockSelectNode } from './mock-select-node';

import './link-node';
import { BaseBlockModel, Store } from '@blocksuite/store';

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

export const createLink = async ({
  quill,
  store,
  model,
}: {
  quill: Quill;
  store: Store;
  model: BaseBlockModel;
}) => {
  const range = quill.getSelection();
  if (!range || range.length === 0) {
    // TODO maybe allow user creating a link with text
    return;
  }

  // const format = quill.getFormat(range);
  // if (format?.link) {
  //   quill.format('link', false);
  //   return;
  // }

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
    model.text?.format(range.index, range.length, { link });
  });

  const LinkBlot = Quill.import('formats/link');
  const [linkNode] = getBlotNode(LinkBlot, quill, range);
  const linkDom = linkNode?.domNode as HTMLElement | undefined;
  if (!linkDom) {
    throw new Error('Failed to create link, mockSelectDom not found!');
  }
};

// See https://github.com/mui/material-ui/blob/v5.10.9/packages/mui-material/src/Popover/Popover.js
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
      console.log('confirm', e);
      ele.remove();
      res(e.detail.link);
    });
  });
};

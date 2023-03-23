import './slash-menu-node.js';

import type { BaseBlockModel } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';

import { getVirgoByModel, throttle } from '../../__internal__/utils/index.js';
import { getPopperPosition } from '../../page-block/utils/position.js';
import { SlashMenu } from './slash-menu-node.js';

let globalAbortController = new AbortController();

function onAbort(
  e: Event,
  slashMenu: SlashMenu,
  positionCallback: () => void,
  model: BaseBlockModel
) {
  slashMenu.remove();
  window.removeEventListener('resize', positionCallback);

  // Clean slash text

  if (!e.target || !(e.target instanceof AbortSignal)) {
    throw new Error('Failed to clean slash search text! Unknown abort event');
  }
  // If not explicitly set in those methods, it defaults to "AbortError" DOMException.
  if (e.target.reason instanceof DOMException) {
    // Should not clean slash text when click away or abort
    return;
  }

  if (typeof e.target.reason !== 'string') {
    throw new Error('Failed to clean slash search text! Unknown abort reason');
  }
  const searchStr = '/' + e.target.reason;
  const text = model.text;
  if (!text) {
    console.warn(
      'Failed to clean slash search text! No text found for model',
      model
    );
    return;
  }
  const vEditor = getVirgoByModel(model);
  if (!vEditor) {
    console.warn(
      'Failed to clean slash search text! No vEditor found for model, model:',
      model
    );
    return;
  }
  const vRange = vEditor.getVRange();
  assertExists(vRange);
  const idx = vRange.index - searchStr.length;

  const textStr = text.toString().slice(idx, idx + searchStr.length);
  if (textStr !== searchStr) {
    console.warn(
      `Failed to clean slash search text! Text mismatch expected: ${searchStr} but actual: ${textStr}`
    );
    return;
  }
  text.delete(idx, searchStr.length);
  vEditor.setVRange({
    index: idx,
    length: 0,
  });
}

export function showSlashMenu({
  model,
  range,
  container = document.body,
  abortController = new AbortController(),
}: {
  model: BaseBlockModel;
  range: Range;
  container?: HTMLElement;
  abortController?: AbortController;
}) {
  // Abort previous format quick bar
  globalAbortController.abort();
  globalAbortController = abortController;

  const slashMenu = new SlashMenu();
  slashMenu.model = model;
  slashMenu.abortController = abortController;

  // Handle position
  const updatePosition = throttle(() => {
    const position = getPopperPosition(slashMenu.slashMenuElement, range);
    slashMenu.transform = `translate(${position.x}, ${position.y})`;
    slashMenu.maxHeight = position.height;
  }, 10);

  window.addEventListener('resize', updatePosition);

  // Mount
  container.appendChild(slashMenu);
  // Wait for the Node to be mounted
  setTimeout(updatePosition);

  // Handle dispose
  abortController.signal.addEventListener('abort', e => {
    onAbort(e, slashMenu, updatePosition, model);
  });

  return slashMenu;
}

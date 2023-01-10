import type { BaseBlockModel, Page } from '@blocksuite/store';
import {
  calcSafeCoordinate,
  DragDirection,
} from '../../page-block/utils/cursor.js';
import {
  assertExists,
  getContainerByModel,
  getCurrentRange,
  getModelsByRange,
  getRichTextByModel,
  getStartModelBySelection,
  sleep,
  throttle,
} from '../../__internal__/utils/index.js';
import './slash-menu-node.js';
import { SlashTextNode } from './slash-text-node.js';

const ABORT_REASON = 'ABORT';

let globalAbortController = new AbortController();

export const showSlashMenu = async ({
  page,
  model,
  container = document.body,
  abortController = new AbortController(),
}: {
  page: Page;
  model: BaseBlockModel;
  direction?: DragDirection;
  container?: HTMLElement;
  abortController?: AbortController;
}) => {
  // Abort previous format quick bar
  globalAbortController.abort(ABORT_REASON);
  globalAbortController = abortController;

  const slashMenu = document.createElement('slash-menu');
  slashMenu.abortController = abortController;

  // Handle slash text
  const startModel = getStartModelBySelection();
  const richText = getRichTextByModel(startModel);
  if (!richText) {
    return;
  }
  const { quill } = richText;
  const range = quill.getSelection();
  assertExists(range);
  // Format the slash char
  range.index--;
  range.length = 1;
  quill.formatText(range, { 'slash-text': true });

  // TODO fix Blot types
  // @ts-expect-error see https://github.com/quilljs/parchment/blob/main/src/blot/scroll.ts
  const [node, offset] = quill.scroll.descendant(SlashTextNode, range.index);
  if (!node) {
    throw new Error('Failed to create slash menu! slash text node not found');
  }
  console.log('node', node, offset);

  // Handle position

  const updatePos = throttle(() => {
    const positioningEl = node.domNode as Element;
    const positioningElRect = positioningEl.getBoundingClientRect();

    // TODO update direction and position
    const direction = 'right-bottom';
    const positioningPoint = {
      x: positioningElRect.x + positioningElRect.width,
      y: positioningElRect.y + positioningElRect.height,
    };

    // TODO maybe use the editor container as the boundary rect to avoid the format bar being covered by other elements
    const boundaryRect = document.body.getBoundingClientRect();
    const slashMenuRect = slashMenu.slashMenuElement.getBoundingClientRect();

    // Add offset to avoid the quick bar being covered by the window border
    const gapY = 5;
    const isBottom = direction.includes('bottom');
    const safeCoordinate = calcSafeCoordinate({
      positioningPoint,
      objRect: slashMenuRect,
      boundaryRect,
      offsetY: isBottom ? gapY : -slashMenuRect.height - gapY,
    });

    slashMenu.left = `${safeCoordinate.x}px`;
    slashMenu.top = `${safeCoordinate.y}px`;
    slashMenu.page = page;
  }, 10);

  const models = getModelsByRange(getCurrentRange());
  if (!models.length) {
    return;
  }
  const editorContainer = getContainerByModel(models[0]);
  // TODO need a better way to get the editor scroll container
  const scrollContainer = editorContainer.querySelector(
    '.affine-default-viewport'
  );
  if (scrollContainer) {
    // Note: in edgeless mode, the scroll container is not exist!
    scrollContainer.addEventListener('scroll', updatePos, { passive: true });
  }
  window.addEventListener('resize', updatePos, { passive: true });

  // Mount
  container.appendChild(slashMenu);
  // Wait for the format quick bar to be mounted
  await sleep();
  updatePos();

  // Handle click outside

  const clickAwayListener = (e: MouseEvent) => {
    if (e.target === slashMenu) {
      return;
    }
    abortController.abort(ABORT_REASON);
    window.removeEventListener('mousedown', clickAwayListener);
  };
  window.addEventListener('mousedown', clickAwayListener);

  return new Promise<void>(res => {
    abortController.signal.addEventListener('abort', e => {
      slashMenu.remove();
      scrollContainer?.removeEventListener('scroll', updatePos);
      window.removeEventListener('resize', updatePos);

      // Clean slash text

      // @ts-expect-error see https://github.com/quilljs/parchment/blob/main/src/blot/scroll.ts
      const [node, offset] = quill.scroll.descendant(
        SlashTextNode,
        range.index
      );
      if (!node) {
        console.warn('Failed to clean slash text! slash text node not found');
        return;
      }

      if ((e.target as AbortSignal).reason === ABORT_REASON) {
        // Should not clean slash text when click away or abort
        quill.formatText(node.offset(), node.length(), { 'slash-text': false });
        return;
      }
      quill.deleteText(node.offset(), node.length());
      res();
    });
  });
};

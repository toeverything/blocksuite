import { BaseBlockModel, PrelimText } from '@blocksuite/store';
import {
  calcSafeCoordinate,
  DragDirection,
} from '../../page-block/utils/cursor.js';
import {
  getQuillIndexByNativeSelection,
  getRichTextByModel,
  getStartModelBySelection,
  throttle,
} from '../../__internal__/utils/index.js';
import './slash-menu-node.js';

let globalAbortController = new AbortController();

export const showSlashMenu = ({
  model,
  range,
  container = document.body,
  abortController = new AbortController(),
}: {
  model: BaseBlockModel;
  range: Range;
  direction?: DragDirection;
  container?: HTMLElement;
  abortController?: AbortController;
}) => {
  // Abort previous format quick bar
  globalAbortController.abort();
  globalAbortController = abortController;

  const slashMenu = document.createElement('slash-menu');
  slashMenu.model = model;
  slashMenu.abortController = abortController;

  // Handle slash text
  const startModel = getStartModelBySelection();
  const richText = getRichTextByModel(startModel);
  if (!richText) {
    return;
  }

  // Handle position

  const updatePos = throttle(() => {
    const positioningElRect = range.getBoundingClientRect();
    // TODO update direction and position
    const direction = 'right-bottom';
    const positioningPoint = {
      x: positioningElRect.x,
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
  }, 10);

  window.addEventListener('resize', updatePos, { passive: true });

  // Mount
  container.appendChild(slashMenu);
  // Wait for the format quick bar to be mounted
  requestAnimationFrame(() => {
    updatePos();
  });

  // Handle dispose
  abortController.signal.addEventListener('abort', e => {
    slashMenu.remove();
    window.removeEventListener('resize', updatePos);

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
      throw new Error(
        'Failed to clean slash search text! Unknown abort reason'
      );
    }
    const searchStr: string = '/' + e.target.reason;
    const text = model.text;
    if (!text || text instanceof PrelimText) {
      console.warn(
        'Failed to clean slash search text! No text found for model',
        model
      );
      return;
    }
    const idx = getQuillIndexByNativeSelection(
      range.startContainer,
      range.startOffset
    );

    const textStr = text.toString().slice(idx, idx + searchStr.length);
    if (textStr !== searchStr) {
      console.warn(
        `Failed to clean slash search text! Text mismatch expected: ${searchStr} but actual: ${textStr}`
      );
      return;
    }
    text.delete(idx, searchStr.length);
  });

  return slashMenu;
};

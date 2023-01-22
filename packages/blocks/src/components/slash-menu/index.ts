import { BaseBlockModel, PrelimText } from '@blocksuite/store';
import {
  calcSafeCoordinate,
  compareTopAndBottomSpace,
  DragDirection,
} from '../../page-block/utils/position.js';
import {
  getQuillIndexByNativeSelection,
  throttle,
} from '../../__internal__/utils/index.js';
import type { SlashMenu } from './slash-menu-node.js';
import './slash-menu-node.js';

let globalAbortController = new AbortController();

function updateSlashMenuPosition(slashMenu: SlashMenu, range: Range) {
  const { placement, height } = compareTopAndBottomSpace(
    range,
    document.body,
    30
  );

  const positioningElRect = range.getBoundingClientRect();
  const positioningPoint = {
    x: positioningElRect.x,
    y:
      positioningElRect.y +
      (placement === 'bottom' ? positioningElRect.height : 0),
  };

  // TODO maybe use the editor container as the boundary rect to avoid the format bar being covered by other elements
  const boundaryRect = document.body.getBoundingClientRect();
  const slashMenuRect = slashMenu.slashMenuElement.getBoundingClientRect();

  // Add offset to avoid the quick bar being covered by the window border
  const gapY = 5;
  const safeCoordinate = calcSafeCoordinate({
    positioningPoint,
    objRect: slashMenuRect,
    boundaryRect,
    offsetY: placement === 'bottom' ? gapY : -gapY,
  });

  slashMenu.left = `${safeCoordinate.x}px`;
  slashMenu.top = `${safeCoordinate.y}px`;
  slashMenu.maxHeight = `${height}px`;
  slashMenu.position = placement;
}

function onAbort(
  e: Event,
  slashMenu: SlashMenu,
  positionCallback: () => void,
  model: BaseBlockModel,
  range: Range
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
  if (!text || text instanceof PrelimText) {
    console.warn(
      'Failed to clean slash search text! No text found for model',
      model
    );
    return;
  }
  const idx = getQuillIndexByNativeSelection(
    range.startContainer,
    // minus 1 to remove the slash
    range.startOffset - 1
  );

  const textStr = text.toString().slice(idx, idx + searchStr.length);
  if (textStr !== searchStr) {
    console.warn(
      `Failed to clean slash search text! Text mismatch expected: ${searchStr} but actual: ${textStr}`
    );
    return;
  }
  text.delete(idx, searchStr.length);
}

export function showSlashMenu({
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
}) {
  // Abort previous format quick bar
  globalAbortController.abort();
  globalAbortController = abortController;

  const slashMenu = document.createElement('slash-menu');
  slashMenu.model = model;
  slashMenu.abortController = abortController;

  // Handle position
  const updatePosition = throttle(
    () => updateSlashMenuPosition(slashMenu, range),
    10
  );

  window.addEventListener('resize', updatePosition);

  // Mount
  container.appendChild(slashMenu);
  // Wait for the format quick bar to be mounted
  requestAnimationFrame(() => updatePosition());

  // Handle dispose
  abortController.signal.addEventListener('abort', e => {
    onAbort(e, slashMenu, updatePosition, model, range);
  });

  return slashMenu;
}

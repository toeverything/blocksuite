import './button.js';
import './format-bar-node.js';

import { Signal } from '@blocksuite/store';

import {
  getCurrentRange,
  getDefaultPageBlock,
  getModelsByRange,
  throttle,
} from '../../__internal__/utils/index.js';
import {
  calcPositionPointByRange,
  calcSafeCoordinate,
  DragDirection,
} from '../../page-block/utils/position.js';
import type { FormatQuickBar } from './format-bar-node.js';

let formatQuickBarInstance: FormatQuickBar | null = null;

export const showFormatQuickBar = async ({
  anchorEl,
  direction = 'right-bottom',
  container = document.body,
  abortController = new AbortController(),
}: {
  anchorEl?:
    | {
        getBoundingClientRect: () => DOMRect;
        // contextElement?: Element;
      }
    | Range;
  direction?: DragDirection;
  container?: HTMLElement;
  abortController?: AbortController;
}) => {
  // Reuse previous format quick bar
  if (formatQuickBarInstance) {
    return;
  }

  // Init format quick bar

  const formatQuickBar = document.createElement('format-quick-bar');
  formatQuickBar.abortController = abortController;
  const positionUpdatedSignal = new Signal();
  formatQuickBar.positionUpdated = positionUpdatedSignal;
  formatQuickBar.direction = direction;

  formatQuickBarInstance = formatQuickBar;
  abortController.signal.addEventListener('abort', () => {
    formatQuickBarInstance = null;
  });

  // Handle Scroll

  // Once performance problems occur, it can be mitigated increasing throttle limit
  const updatePos = throttle(() => {
    const positioningEl = anchorEl ?? getCurrentRange();
    const dir = formatQuickBar.direction;

    const positioningPoint =
      positioningEl instanceof Range
        ? calcPositionPointByRange(positioningEl, dir)
        : positioningEl.getBoundingClientRect();

    // TODO maybe use the editor container as the boundary rect to avoid the format bar being covered by other elements
    const boundaryRect = document.body.getBoundingClientRect();
    const formatBarRect =
      formatQuickBar.formatQuickBarElement.getBoundingClientRect();
    // Add offset to avoid the quick bar being covered by the window border
    const gapY = 5;
    const isBottom = dir.includes('bottom');
    const safeCoordinate = calcSafeCoordinate({
      positioningPoint,
      objRect: formatBarRect,
      boundaryRect,
      // place the format bar in the center of the position point
      offsetX: -formatBarRect.width / 2,
      offsetY: isBottom ? gapY : -formatBarRect.height - gapY,
    });

    formatQuickBar.left = `${safeCoordinate.x}px`;
    formatQuickBar.top = `${safeCoordinate.y}px`;
  }, 10);

  const models = getModelsByRange(getCurrentRange());
  if (!models.length) {
    return;
  }
  const pageBlock = getDefaultPageBlock(models[0]);
  const scrollContainer = pageBlock.defaultViewportElement;

  if (scrollContainer) {
    // Note: in edgeless mode, the scroll container is not exist!
    scrollContainer.addEventListener('scroll', updatePos, { passive: true });
  }
  positionUpdatedSignal.on(updatePos);
  window.addEventListener('resize', updatePos, { passive: true });

  // Handle selection change

  let isMouseDown = false;
  const mouseDownHandler = () => {
    isMouseDown = true;
  };
  const mouseUpHandler = () => {
    isMouseDown = false;
  };

  const selectionChangeHandler = () => {
    const selection = document.getSelection();
    const selectNothing =
      !selection || selection.type === 'Caret' || selection.type === 'None';
    if (selectNothing || isMouseDown) {
      abortController.abort();
      return;
    }
    updatePos();
  };

  const popstateHandler = () => {
    abortController.abort();
  };
  document.addEventListener('mousedown', mouseDownHandler);
  document.addEventListener('mouseup', mouseUpHandler);
  document.addEventListener('selectionchange', selectionChangeHandler);
  // Fix https://github.com/toeverything/AFFiNE/issues/855
  window.addEventListener('popstate', popstateHandler);

  // Mount
  container.appendChild(formatQuickBar);
  requestAnimationFrame(() => {
    updatePos();
  });

  abortController.signal.addEventListener('abort', () => {
    scrollContainer?.removeEventListener('scroll', updatePos);
    window.removeEventListener('resize', updatePos);
    document.removeEventListener('mousedown', mouseDownHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    document.removeEventListener('selectionchange', selectionChangeHandler);
    window.removeEventListener('popstate', popstateHandler);
    positionUpdatedSignal.dispose();
  });
  return formatQuickBar;
};

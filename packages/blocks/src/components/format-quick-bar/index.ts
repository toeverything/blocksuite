import './button.js';
import './format-bar-node.js';

import { matchFlavours, Page, Slot } from '@blocksuite/store';

import { getCurrentBlockRange } from '../../__internal__/utils/block-range.js';
import { getDefaultPageBlock } from '../../__internal__/utils/query.js';
import { throttle } from '../../__internal__/utils/std.js';
import {
  calcPositionPointByRange,
  calcSafeCoordinate,
  DragDirection,
} from '../../page-block/utils/position.js';
import type { FormatQuickBar } from './format-bar-node.js';

let formatQuickBarInstance: FormatQuickBar | null = null;

export const showFormatQuickBar = async ({
  page,
  anchorEl,
  direction = 'right-bottom',
  container = document.body,
  abortController = new AbortController(),
}: {
  page: Page;
  anchorEl: {
    getBoundingClientRect: () => {
      x: number;
      y: number;
    };
    // contextElement?: Element;
  };
  direction?: DragDirection;
  container?: HTMLElement;
  abortController?: AbortController;
}) => {
  // Reuse previous format quick bar
  if (formatQuickBarInstance) {
    return;
  }

  // Init format quick bar

  const blockRange = getCurrentBlockRange(page);
  if (!blockRange) {
    return;
  }
  blockRange.models = blockRange.models.filter(model =>
    matchFlavours(model, [
      'affine:paragraph',
      'affine:list',
      'affine:code',
    ] as const)
  );
  if (blockRange.models.length === 0) {
    return;
  }

  const formatQuickBar = document.createElement('format-quick-bar');
  formatQuickBar.page = page;
  formatQuickBar.models = blockRange.models;
  formatQuickBar.abortController = abortController;
  const positionUpdatedSlot = new Slot();
  formatQuickBar.positionUpdated = positionUpdatedSlot;

  formatQuickBarInstance = formatQuickBar;
  abortController.signal.addEventListener('abort', () => {
    formatQuickBarInstance = null;
  });

  // Handle Scroll

  // Once performance problems occur, it can be mitigated increasing throttle limit
  const updatePos = throttle(() => {
    const positioningPoint =
      anchorEl instanceof Range
        ? calcPositionPointByRange(anchorEl, direction)
        : anchorEl.getBoundingClientRect();

    // TODO maybe use the editor container as the boundary rect to avoid the format bar being covered by other elements
    const boundaryRect = document.body.getBoundingClientRect();
    const formatBarRect =
      formatQuickBar.formatQuickBarElement.getBoundingClientRect();
    // Add offset to avoid the quick bar being covered by the window border
    const gapY = 5;
    const isBottom = direction.includes('bottom');
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

  if (!page.root) {
    throw new Error("Failed to get page's root element");
  }
  const pageBlock = getDefaultPageBlock(page.root);
  const scrollContainer = pageBlock.viewportElement;

  if (scrollContainer) {
    // Note: in edgeless mode, the scroll container is not exist!
    scrollContainer.addEventListener('scroll', updatePos, { passive: true });
  }
  positionUpdatedSlot.on(updatePos);
  window.addEventListener('resize', updatePos, { passive: true });

  // Mount
  container.appendChild(formatQuickBar);

  // Handle selection change

  const mouseDownHandler = (e: MouseEvent) => {
    if (e.target === formatQuickBar) {
      return;
    }
    abortController.abort();
  };

  const selectionChangeHandler = () => {
    const blockRange = getCurrentBlockRange(page);
    if (!blockRange) {
      abortController.abort();
      return;
    }
    // If the selection is collapsed, abort the format quick bar
    if (
      blockRange.type === 'Native' &&
      blockRange.models.length === 1 &&
      blockRange.startOffset === blockRange.endOffset
    ) {
      abortController.abort();
      return;
    }
    updatePos();
  };

  const popstateHandler = () => {
    abortController.abort();
  };
  document.addEventListener('mousedown', mouseDownHandler);
  document.addEventListener('selectionchange', selectionChangeHandler);
  // Fix https://github.com/toeverything/AFFiNE/issues/855
  window.addEventListener('popstate', popstateHandler);

  requestAnimationFrame(() => {
    updatePos();
  });

  abortController.signal.addEventListener('abort', () => {
    scrollContainer?.removeEventListener('scroll', updatePos);
    window.removeEventListener('resize', updatePos);
    document.removeEventListener('mouseup', mouseDownHandler);
    document.removeEventListener('selectionchange', selectionChangeHandler);
    window.removeEventListener('popstate', popstateHandler);
    positionUpdatedSlot.dispose();
  });
  return formatQuickBar;
};

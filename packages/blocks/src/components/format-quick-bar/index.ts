import './button.js';

import type { Page } from '@blocksuite/store';
import { matchFlavours, Slot } from '@blocksuite/store';

import { getCurrentBlockRange } from '../../__internal__/utils/block-range.js';
import { getViewportElement } from '../../__internal__/utils/query.js';
import { throttle } from '../../__internal__/utils/std.js';
import { onModelElementUpdated } from '../../page-block/index.js';
import {
  calcPositionPointByRange,
  calcSafeCoordinate,
  type DragDirection,
} from '../../page-block/utils/position.js';
import { FormatQuickBar } from './format-bar-node.js';

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
    matchFlavours(model, ['affine:paragraph', 'affine:list', 'affine:code'])
  );
  if (blockRange.models.length === 0) {
    return;
  }

  const formatQuickBar = new FormatQuickBar();
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
    if (abortController.signal.aborted) {
      return;
    }
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
  const scrollContainer = getViewportElement(page);
  if (scrollContainer) {
    // Note: in edgeless mode, the scroll container is not exist!
    scrollContainer.addEventListener('scroll', updatePos, { passive: true });
  }
  positionUpdatedSlot.on(updatePos);
  window.addEventListener('resize', updatePos, { passive: true });

  // Mount
  container.appendChild(formatQuickBar);

  // Handle selection change

  const pointerDownHandler = (e: MouseEvent) => {
    if (e.target === formatQuickBar) {
      return;
    }
    abortController.abort();
  };

  const popstateHandler = () => {
    abortController.abort();
  };
  document.addEventListener('pointerdown', pointerDownHandler);
  // Fix https://github.com/toeverything/AFFiNE/issues/855
  window.addEventListener('popstate', popstateHandler);

  onModelElementUpdated(blockRange.models[0], updatePos);

  abortController.signal.addEventListener('abort', () => {
    scrollContainer?.removeEventListener('scroll', updatePos);
    window.removeEventListener('resize', updatePos);
    document.removeEventListener('pointerdown', pointerDownHandler);
    window.removeEventListener('popstate', popstateHandler);
    positionUpdatedSlot.dispose();
  });
  return formatQuickBar;
};

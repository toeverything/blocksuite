import './button.js';
import './format-bar-node.js';

import { Page, Signal } from '@blocksuite/store';

import { getCurrentBlockRange } from '../../__internal__/utils/block-range.js';
import { getDefaultPageBlock } from '../../__internal__/utils/query.js';
import { getCurrentNativeRange } from '../../__internal__/utils/selection.js';
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
  formatQuickBar.page = page;
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
    const positioningEl = anchorEl ?? getCurrentNativeRange();
    const dir = formatQuickBar.direction;

    const positioningPoint =
      positioningEl instanceof Range
        ? calcPositionPointByRange(positioningEl, dir)
        : (() => {
            const rect = positioningEl.getBoundingClientRect();
            const x = dir.includes('center')
              ? rect.left + rect.width / 2
              : dir.includes('left')
              ? rect.left
              : rect.right;
            const y = dir.includes('bottom') ? rect.bottom : rect.top;
            return { x, y };
          })();

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

  if (!page.root) {
    throw new Error("Failed to get page's root element");
  }
  const pageBlock = getDefaultPageBlock(page.root);
  const scrollContainer = pageBlock.defaultViewportElement;

  if (scrollContainer) {
    // Note: in edgeless mode, the scroll container is not exist!
    scrollContainer.addEventListener('scroll', updatePos, { passive: true });
  }
  positionUpdatedSignal.on(updatePos);
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
    positionUpdatedSignal.dispose();
  });
  return formatQuickBar;
};

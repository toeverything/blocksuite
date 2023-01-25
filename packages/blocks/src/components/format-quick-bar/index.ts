import { Signal } from '@blocksuite/store';
import {
  calcPositionPointByRange,
  calcSafeCoordinate,
  type DragDirection,
} from '../../page-block/utils/position.js';
import {
  getContainerByModel,
  getCurrentRange,
  getModelsByRange,
  throttle,
} from '../../__internal__/utils/index.js';
import './button.js';
import './format-bar-node.js';
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
    formatQuickBarInstance.direction = direction;
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
  const editorContainer = getContainerByModel(models[0]);
  // TODO need a better way to get the editor scroll container
  const scrollContainer = editorContainer.querySelector(
    '.affine-default-viewport'
  );

  if (scrollContainer) {
    // Note: in edgeless mode, the scroll container is not exist!
    scrollContainer.addEventListener('scroll', updatePos, { passive: true });
  }
  positionUpdatedSignal.on(updatePos);
  window.addEventListener('resize', updatePos, { passive: true });

  // Handle selection change

  const selectionChangeHandler = () => {
    const selection = document.getSelection();
    if (!selection || selection.type === 'Caret' || selection.type === 'None') {
      abortController.abort();
      return;
    }
    updatePos();
  };
  document.addEventListener('selectionchange', selectionChangeHandler);

  // Mount
  container.appendChild(formatQuickBar);
  requestAnimationFrame(() => {
    updatePos();
  });

  abortController.signal.addEventListener('abort', () => {
    scrollContainer?.removeEventListener('scroll', updatePos);
    window.removeEventListener('resize', updatePos);
    document.removeEventListener('selectionchange', selectionChangeHandler);
    positionUpdatedSignal.dispose();
  });
  return formatQuickBar;
};

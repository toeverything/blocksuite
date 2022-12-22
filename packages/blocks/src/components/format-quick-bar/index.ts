import { Signal } from '@blocksuite/store';
import {
  calcPositionPointByRange,
  calcSafeCoordinate,
  DragDirection,
} from '../../page-block/utils/cursor.js';
import {
  getContainerByModel,
  getCurrentRange,
  getModelsByRange,
  sleep,
  throttle,
} from '../../__internal__/utils/index.js';
import './button';
import './format-bar-node';
import type { FormatQuickBar } from './format-bar-node.js';

export const showFormatQuickBar = async ({
  anchorEl,
  direction = 'right-bottom',
  container = document.body,
  abortController = new AbortController(),
}: {
  anchorEl:
    | {
        getBoundingClientRect: () => DOMRect;
        // contextElement?: Element;
      }
    | Range;
  direction?: DragDirection;
  container?: HTMLElement;
  abortController?: AbortController;
}) => {
  // Init format quick bar

  const formatQuickBar = document.createElement(
    'format-quick-bar'
  ) as FormatQuickBar;
  formatQuickBar.abortController = abortController;
  const positionUpdatedSignal = new Signal();
  formatQuickBar.positionUpdated = positionUpdatedSignal;

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
    if (!selection || selection.type === 'Caret') {
      abortController.abort();
    }
  };
  document.addEventListener('selectionchange', selectionChangeHandler);

  // Mount
  container.appendChild(formatQuickBar);
  // Wait for the format quick bar to be mounted
  await sleep();
  updatePos();

  return new Promise<void>(res => {
    abortController.signal.addEventListener('abort', () => {
      // TODO add transition
      formatQuickBar.remove();
      scrollContainer?.removeEventListener('scroll', updatePos);
      window.removeEventListener('resize', updatePos);
      document.removeEventListener('selectionchange', selectionChangeHandler);
      positionUpdatedSignal.dispose();
      res();
    });
  });
};

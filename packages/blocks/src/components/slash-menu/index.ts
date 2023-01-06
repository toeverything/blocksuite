import type { BaseBlockModel, Page } from '@blocksuite/store/index.js';
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
import './slash-menu-node.js';

let globalAbortController = new AbortController();

export const showSlashMenu = async ({
  page,
  model,
  anchorEl,
  direction = 'right-bottom',
  container = document.body,
  abortController = new AbortController(),
}: {
  page: Page;
  model: BaseBlockModel;
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
  // Abort previous format quick bar
  globalAbortController.abort();
  globalAbortController = abortController;

  // Init format quick bar

  const slashMenu = document.createElement('slash-menu');
  slashMenu.abortController = abortController;
  const positionUpdatedSignal = new Signal();
  slashMenu.positionUpdated = positionUpdatedSignal;

  // Handle Scroll

  // Once performance problems occur, it can be mitigated increasing throttle limit
  const updatePos = throttle(() => {
    const positioningEl = anchorEl ?? getCurrentRange();

    const positioningPoint =
      positioningEl instanceof Range
        ? calcPositionPointByRange(positioningEl, direction)
        : positioningEl.getBoundingClientRect();

    // TODO maybe use the editor container as the boundary rect to avoid the format bar being covered by other elements
    const boundaryRect = document.body.getBoundingClientRect();
    const formatBarRect = slashMenu.slashMenuElement.getBoundingClientRect();
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
  positionUpdatedSignal.on(updatePos);
  window.addEventListener('resize', updatePos, { passive: true });

  // Mount
  container.appendChild(slashMenu);
  // Wait for the format quick bar to be mounted
  await sleep();
  updatePos();

  return new Promise<void>(res => {
    abortController.signal.addEventListener('abort', () => {
      // TODO add transition
      slashMenu.remove();
      scrollContainer?.removeEventListener('scroll', updatePos);
      window.removeEventListener('resize', updatePos);
      positionUpdatedSignal.dispose();
      res();
    });
  });
};

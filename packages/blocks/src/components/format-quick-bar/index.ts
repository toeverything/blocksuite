import { Signal } from '@blocksuite/store';
import {
  clamp,
  getContainerByModel,
  getCurrentRange,
  getModelsByRange,
  Direction,
  sleep,
  throttle,
} from '../../__internal__/utils';
import './button';
import './format-bar-node';

export const showFormatQuickBar = async ({
  anchorEl,
  direction = Direction.RightBottom,
  container = document.body,
  abortController = new AbortController(),
}: {
  anchorEl: {
    getBoundingClientRect: () => DOMRect;
    // contextElement?: Element;
  };
  direction?: Direction;
  container?: HTMLElement;
  abortController?: AbortController;
}) => {
  // Init format quick bar

  const formatQuickBar = document.createElement('format-quick-bar');
  formatQuickBar.abortController = abortController;
  const positionUpdatedSignal = new Signal();
  formatQuickBar.positionUpdated = positionUpdatedSignal;

  // Handle Scroll

  // Once performance problems occur, it can be mitigated increasing throttle limit
  const updatePos = throttle(() => {
    const rect = anchorEl.getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();
    const formatBarRect =
      formatQuickBar.formatQuickBarElement.getBoundingClientRect();
    // Add offset to avoid the quick bar being covered by the window border
    const edgeGap = 20;
    const offsetX = clamp(
      rect.left - formatBarRect.width / 2,
      edgeGap,
      bodyRect.width - formatBarRect.width - edgeGap
    );
    const offsetY = 5;
    formatQuickBar.left = `${offsetX}px`;
    switch (direction) {
      case Direction.LeftTop:
      case Direction.RightTop: {
        const baseTop = bodyRect.bottom - rect.bottom + rect.height;
        formatQuickBar.bottom = `${baseTop + offsetY}px`;
        break;
      }
      case Direction.LeftBottom:
      case Direction.RightBottom: {
        const baseTop = rect.top - bodyRect.top + rect.height;
        formatQuickBar.top = `${baseTop + offsetY}px`;
        break;
      }
      default: {
        throw new Error(
          `Failed to update position! Invalid direction: ${direction}!`
        );
      }
    }
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

  // Handle click outside

  const clickAwayListener = (e: MouseEvent) => {
    if (e.target === formatQuickBar) {
      return;
    }
    abortController.abort();
    window.removeEventListener('mousedown', clickAwayListener);
  };
  window.addEventListener('mousedown', clickAwayListener);

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

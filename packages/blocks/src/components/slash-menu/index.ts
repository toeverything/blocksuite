import type { BaseBlockModel } from '@blocksuite/store';
import type { InlineBlot } from 'parchment';
import {
  calcSafeCoordinate,
  DragDirection,
} from '../../page-block/utils/cursor.js';
import {
  getContainerByModel,
  getCurrentRange,
  getModelsByRange,
  getRichTextByModel,
  getStartModelBySelection,
  throttle,
} from '../../__internal__/utils/index.js';
import './slash-menu-node.js';
import './slash-text-node.js';

let globalAbortController = new AbortController();

export const showSlashMenu = ({
  blot,
  model,
  anchorEl,
  container = document.body,
  abortController = new AbortController(),
}: {
  blot: InlineBlot;
  model: BaseBlockModel;
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
  // Abort previous format quick bar
  globalAbortController.abort('ABORT');
  globalAbortController = abortController;

  const slashMenu = document.createElement('slash-menu');
  slashMenu.abortController = abortController;

  // Handle slash text
  const startModel = getStartModelBySelection();
  const richText = getRichTextByModel(startModel);
  if (!richText) {
    return;
  }
  const { quill } = richText;

  // Handle position

  const updatePos = throttle(() => {
    const positioningElRect = anchorEl.getBoundingClientRect();
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
    slashMenu.page = model.page;
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
    scrollContainer?.removeEventListener('scroll', updatePos);
    window.removeEventListener('resize', updatePos);

    // Clean slash text

    if (e.target instanceof AbortSignal && e.target.reason === 'ABORT') {
      // TODO Fix slash should not be synced to other clients
      // Should not clean slash text when click away or abort
      quill.formatText(blot.offset(), blot.length(), {
        'slash-text': false,
      });
      return;
    }
    model.text?.delete(blot.offset(), blot.length());
  });

  return slashMenu;
};

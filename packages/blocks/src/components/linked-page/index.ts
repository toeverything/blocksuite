import { type BaseBlockModel, DisposableGroup } from '@blocksuite/store';

import { getViewportElement } from '../../__internal__/utils/query.js';
import { throttle } from '../../__internal__/utils/std.js';
import { getPopperPosition } from '../../page-block/utils/position.js';
import { LinkedPagePopover } from './linked-page-popover.js';

export function showLinkedPagePopover({
  model,
  range,
  container = document.body,
  abortController = new AbortController(),
}: {
  model: BaseBlockModel;
  range: Range;
  container?: HTMLElement;
  abortController?: AbortController;
}) {
  const disposableGroup = new DisposableGroup();
  abortController.signal.addEventListener('abort', e => {
    disposableGroup.dispose();
  });

  const linkedPage = new LinkedPagePopover(model, abortController);
  // Mount
  container.appendChild(linkedPage);
  disposableGroup.add(() => {
    linkedPage.remove();
  });

  // Handle position
  const updatePosition = throttle(() => {
    const position = getPopperPosition(linkedPage, range);
    linkedPage.updatePosition(position);
  }, 10);
  disposableGroup.addFromEvent(window, 'resize', updatePosition);
  const scrollContainer = getViewportElement(model.page);
  if (scrollContainer) {
    // Note: in edgeless mode, the scroll container is not exist!
    disposableGroup.addFromEvent(scrollContainer, 'scroll', updatePosition, {
      passive: true,
    });
  }

  // Wait for node to be mounted
  setTimeout(updatePosition);

  disposableGroup.addFromEvent(window, 'mousedown', (e: Event) => {
    if (e.target === linkedPage) return;
    abortController.abort();
  });

  return linkedPage;
}

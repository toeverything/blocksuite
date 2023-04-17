import {
  assertExists,
  type BaseBlockModel,
  DisposableGroup,
} from '@blocksuite/store';

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
  const disposables = new DisposableGroup();
  abortController.signal.addEventListener('abort', () => disposables.dispose());

  const linkedPage = new LinkedPagePopover(model, abortController);
  // Mount
  container.appendChild(linkedPage);
  disposables.add(() => linkedPage.remove());

  // Handle position
  const updatePosition = throttle(() => {
    const linkedPageElement = linkedPage.linkedPageElement;
    assertExists(
      linkedPageElement,
      'You should render the linked page node even if no position'
    );
    const position = getPopperPosition(linkedPageElement, range);
    linkedPage.updatePosition(position);
  }, 10);
  disposables.addFromEvent(window, 'resize', updatePosition);
  const scrollContainer = getViewportElement(model.page);
  if (scrollContainer) {
    // Note: in edgeless mode, the scroll container is not exist!
    disposables.addFromEvent(scrollContainer, 'scroll', updatePosition, {
      passive: true,
    });
  }

  // Wait for node to be mounted
  setTimeout(updatePosition);

  // Should not use mouse event for better mobile compatible
  disposables.addFromEvent(window, 'pointerdown', (e: Event) => {
    if (e.target === linkedPage) return;
    abortController.abort();
  });

  return linkedPage;
}

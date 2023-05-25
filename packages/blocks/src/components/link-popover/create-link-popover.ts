import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import {
  getDefaultPage,
  getModelByElement,
  noop,
} from '../../__internal__/utils/index.js';
import { calcSafeCoordinate } from '../../page-block/utils/position.js';
import type { LinkDetail, LinkPopover } from './link-popover.js';

function updatePosition(element: LinkPopover, anchorEl: HTMLElement) {
  const rect = anchorEl.getBoundingClientRect();
  const offsetY = 5;
  const safeCoordinate = calcSafeCoordinate({
    positioningPoint: { x: rect.x, y: rect.top + rect.height + offsetY },
    objRect: element.popoverContainer?.getBoundingClientRect(),
    offsetY,
  });
  element.left = `${safeCoordinate.x}px`;
  element.top = `${safeCoordinate.y}px`;
}

function createEditLinkElement(
  anchorEl: HTMLElement,
  container: HTMLElement,
  {
    showMask,
    previewLink,
    page,
  }: { showMask: boolean; previewLink: string; page: Page }
) {
  const linkPanel = document.createElement('edit-link-panel');
  linkPanel.showMask = showMask;
  linkPanel.previewLink = previewLink;
  linkPanel.showBookmarkOperation = !!page.awarenessStore.getFlag(
    'enable_bookmark_operation'
  );
  container.appendChild(linkPanel);

  requestAnimationFrame(() => {
    updatePosition(linkPanel, anchorEl);
  });
  return linkPanel;
}

function bindHoverState(
  target: HTMLElement,
  popover: HTMLElement,
  controller: AbortController
) {
  // TODO export as options
  const hoverCloseDelay = 300;
  let timer: number | undefined;

  const handleMouseEnter = (e: MouseEvent) => {
    clearTimeout(timer);
  };

  const handleMouseLeave = (e: MouseEvent) => {
    // we want to leave the popover open
    // if the mouse entered the popover immediately
    // after leaving the target (or vice versa).
    timer = window.setTimeout(() => {
      controller.abort();
    }, hoverCloseDelay);
  };

  const abortHandler = () => {
    controller.abort();
  };

  target.addEventListener('mouseover', handleMouseEnter);
  target.addEventListener('mouseout', handleMouseLeave);

  popover.addEventListener('mouseover', handleMouseEnter);
  popover.addEventListener('mouseout', handleMouseLeave);

  const model = getModelByElement(target);
  const pageBlock = getDefaultPage(model.page);
  const viewport = pageBlock?.viewportElement;
  viewport?.addEventListener('scroll', abortHandler);
  return () => {
    target.removeEventListener('mouseover', handleMouseEnter);
    target.removeEventListener('mouseout', handleMouseLeave);

    popover.removeEventListener('mouseover', handleMouseEnter);
    popover.removeEventListener('mouseout', handleMouseLeave);
    viewport?.removeEventListener('scroll', abortHandler);
  };
}

interface LinkPopoverOptions {
  anchorEl: HTMLElement;
  page: Page;
  container?: HTMLElement;
  text?: string;
  link?: string;
  showMask?: boolean;
  interactionKind?: 'always' | 'hover';
  abortController?: AbortController;
}

export async function showLinkPopover({
  anchorEl,
  page,
  container = document.body,
  text = '',
  link = '',
  showMask = true,
  interactionKind = 'always',
  abortController = new AbortController(),
}: LinkPopoverOptions): Promise<LinkDetail> {
  assertExists(anchorEl, "Can't show tooltip without anchor element!");

  if (abortController.signal.aborted) {
    return Promise.resolve({ type: 'cancel' });
  }

  const editLinkEle = createEditLinkElement(anchorEl, container, {
    showMask,
    previewLink: link,
    page,
  });

  const unsubscribeHoverAbort =
    interactionKind === 'hover'
      ? bindHoverState(anchorEl, editLinkEle, abortController)
      : noop;

  return new Promise(res => {
    abortController.signal.addEventListener('abort', () => {
      editLinkEle.remove();
      res({ type: 'cancel' });
    });

    editLinkEle.addEventListener('editLink', e => {
      if (abortController.signal.aborted) {
        return;
      }

      editLinkEle.type = 'edit';
      editLinkEle.showMask = true;
      editLinkEle.text = text;
      unsubscribeHoverAbort();
      requestAnimationFrame(() => {
        updatePosition(editLinkEle, anchorEl);
      });
    });

    editLinkEle.addEventListener('updateLink', e => {
      if (abortController.signal.aborted) {
        return;
      }
      editLinkEle.remove();
      res(e.detail);
    });
  });
}

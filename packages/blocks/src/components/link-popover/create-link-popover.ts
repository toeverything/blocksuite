import {
  getDefaultPageBlock,
  getModelByElement,
  noop,
} from '../../__internal__/utils/index.js';
import { calcSafeCoordinate } from '../../page-block/utils/position.js';
import type { LinkDetail, LinkPopover } from './link-popover.js';

const updatePosition = (ele: LinkPopover, anchorEl: HTMLElement) => {
  const rect = anchorEl.getBoundingClientRect();
  const offsetY = 5;
  const safeCoordinate = calcSafeCoordinate({
    positioningPoint: { x: rect.x, y: rect.top + rect.height + offsetY },
    objRect: ele.popoverContainer?.getBoundingClientRect(),
    offsetY,
  });
  ele.left = `${safeCoordinate.x}px`;
  ele.top = `${safeCoordinate.y}px`;
};

const createEditLinkElement = (
  anchorEl: HTMLElement,
  container: HTMLElement,
  { showMask, previewLink }: { showMask: boolean; previewLink: string }
) => {
  const ele = document.createElement('edit-link-panel');
  ele.showMask = showMask;
  ele.previewLink = previewLink;
  container.appendChild(ele);

  requestAnimationFrame(() => {
    updatePosition(ele, anchorEl);
  });
  return ele;
};

const bindHoverState = (
  target: HTMLElement,
  popover: HTMLElement,
  controller: AbortController
) => {
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
  const pageBlock = getDefaultPageBlock(model);
  const viewPort = pageBlock.defaultViewportElement;
  viewPort?.addEventListener('scroll', abortHandler);
  return () => {
    target.removeEventListener('mouseover', handleMouseEnter);
    target.removeEventListener('mouseout', handleMouseLeave);

    popover.removeEventListener('mouseover', handleMouseEnter);
    popover.removeEventListener('mouseout', handleMouseLeave);
    viewPort?.removeEventListener('scroll', abortHandler);
  };
};

export const showLinkPopover = async ({
  anchorEl,
  container = document.body,
  text = '',
  link = '',
  showMask = true,
  interactionKind = 'always',
  abortController = new AbortController(),
}: {
  anchorEl: HTMLElement;
  container?: HTMLElement;
  text?: string;
  link?: string;
  /**
   * Whether to show a mask behind the popover.
   */
  showMask?: boolean;
  /**
   * Whether to show the popover on hover or always.
   */
  interactionKind?: 'always' | 'hover';
  abortController?: AbortController;
}): Promise<LinkDetail> => {
  if (!anchorEl) {
    throw new Error("Can't show tooltip without anchor element!");
  }
  if (abortController.signal.aborted) {
    return Promise.resolve({ type: 'cancel' });
  }

  const editLinkEle = createEditLinkElement(anchorEl, container, {
    showMask,
    previewLink: link,
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
};

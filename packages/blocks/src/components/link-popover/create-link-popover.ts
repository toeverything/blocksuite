import { noop } from '../../__internal__/utils';
import type { LinkDetail } from './link-popover';

const createEditLinkElement = (
  anchorEl: HTMLElement,
  container: HTMLElement,
  { showMask, previewLink }: { showMask: boolean; previewLink: string }
) => {
  const rect = anchorEl.getBoundingClientRect();
  const bodyRect = document.body.getBoundingClientRect();
  const offset = rect.top - bodyRect.top + rect.height;
  const offsetY = 5;

  const ele = document.createElement('edit-link-panel');
  ele.left = `${rect.left}px`;
  ele.top = `${offset + offsetY}px`;
  ele.showMask = showMask;
  ele.previewLink = previewLink;
  container.appendChild(ele);
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

  target.addEventListener('mouseover', handleMouseEnter);
  target.addEventListener('mouseout', handleMouseLeave);

  popover.addEventListener('mouseover', handleMouseEnter);
  popover.addEventListener('mouseout', handleMouseLeave);

  return () => {
    target.removeEventListener('mouseover', handleMouseEnter);
    target.removeEventListener('mouseout', handleMouseLeave);

    popover.removeEventListener('mouseover', handleMouseEnter);
    popover.removeEventListener('mouseout', handleMouseLeave);
  };
};

export const showLinkPopover = async ({
  anchorEl,
  container = document.body,
  text = '',
  link = '',
  showMask = true,
  interactionKind = 'always',
  signal = new AbortController(),
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
  signal?: AbortController;
}): Promise<LinkDetail> => {
  if (!anchorEl) {
    throw new Error("Can't show tooltip without anchor element!");
  }
  if (signal.signal.aborted) {
    return Promise.resolve({ type: 'cancel' });
  }

  const editLinkEle = createEditLinkElement(anchorEl, container, {
    showMask,
    previewLink: link,
  });

  const unsubscribeHoverAbort =
    interactionKind === 'hover'
      ? bindHoverState(anchorEl, editLinkEle, signal)
      : noop;

  return new Promise(res => {
    signal.signal.addEventListener('abort', () => {
      editLinkEle.remove();
      res({ type: 'cancel' });
    });

    editLinkEle.addEventListener('editLink', e => {
      if (signal.signal.aborted) {
        return;
      }

      editLinkEle.type = 'edit';
      editLinkEle.showMask = true;
      editLinkEle.text = text;
      unsubscribeHoverAbort();
    });

    editLinkEle.addEventListener('updateLink', e => {
      if (signal.signal.aborted) {
        return;
      }
      editLinkEle.remove();
      res(e.detail);
    });
  });
};

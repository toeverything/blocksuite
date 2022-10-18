const createEditLinkElement = (
  anchorEl: HTMLElement,
  container: HTMLElement,
  { showMask, preview }: { showMask: boolean; preview: string }
) => {
  const rect = anchorEl.getBoundingClientRect();
  const bodyRect = document.body.getBoundingClientRect();
  const offset = rect.top - bodyRect.top + rect.height;

  const ele = document.createElement('edit-link-panel');
  ele.left = `${(rect.left + rect.right) / 2}px`;
  ele.top = `${offset}px`;
  ele.showMask = showMask;
  ele.preview = preview;
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
    // wait until the event queue is flushed, because we want to leave the
    // popover open if the mouse entered the popover immediately after
    // leaving the target (or vice versa).
    timer = window.setTimeout(() => {
      controller.abort();
    }, hoverCloseDelay);
  };

  target.addEventListener('mouseover', handleMouseEnter);
  target.addEventListener('mouseout', handleMouseLeave);

  popover.addEventListener('mouseover', handleMouseEnter);
  popover.addEventListener('mouseout', handleMouseLeave);
};

export const showLinkPopover = async ({
  anchorEl,
  container = document.body,
  preview = '',
  showMask = true,
  interactionKind = 'always',
  signal = new AbortController(),
}: {
  anchorEl: HTMLElement;
  container?: HTMLElement;
  preview?: string;
  /**
   * Whether to show a mask behind the popover.
   */
  showMask?: boolean;
  /**
   * Whether to show the popover on hover or always.
   */
  interactionKind?: 'always' | 'hover';
  signal?: AbortController;
}) => {
  if (!anchorEl) {
    throw new Error("Can't show tooltip without anchor element!");
  }
  if (signal.signal.aborted) {
    return;
  }

  const editLinkEle = createEditLinkElement(anchorEl, container, {
    showMask,
    preview,
  });

  if (interactionKind === 'hover') {
    bindHoverState(anchorEl, editLinkEle, signal);
  }

  return new Promise(res => {
    signal.signal.addEventListener('abort', () => {
      editLinkEle.remove();
      res(null);
    });

    editLinkEle.addEventListener('confirm', e => {
      if (signal.signal.aborted) {
        return;
      }

      editLinkEle.remove();
      res(e.detail.link);
    });
  });
};

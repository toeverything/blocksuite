import { on, once } from '../../../../../_common/utils/index.js';
import { lastN } from '../../../../../_common/utils/iterable.js';
import type { FrameBlockModel } from '../../../../../models.js';
import type { FramesSidebarBody } from '../body/frames-sidebar-body.js';
import { FrameCard } from '../card/frame-card.js';

/**
 * start drag frame cards
 * @param frames frames to drag
 */
export function startDragging(
  frames: {
    frame: FrameBlockModel;
    element: FrameCard;
    cardIndex: number;
    frameIndex: string;
  }[],
  options: {
    width: number;
    onDragEnd?: (insertIndex?: number) => void;
    onDragMove?: (insertIdx?: number) => void;
    frameListContainer: HTMLElement;
    doc: Document;
    host: Document | HTMLElement;
    container: FramesSidebarBody;
    start: {
      x: number;
      y: number;
    };
  }
) {
  const {
    doc,
    host,
    container,
    onDragMove,
    onDragEnd,
    frameListContainer,
    start,
  } = options;
  const cardElements = lastN(frames, 2).map((frame, idx, arr) => {
    const el = new FrameCard();

    el.frame = frame.frame;
    el.cardIndex = frame.cardIndex;
    el.frameIndex = frame.frameIndex;
    el.status = 'dragging';
    el.stackOrder = arr.length - 1 - idx;
    el.pos = start;
    el.width = options.width;
    if (frames.length > 1 && el.stackOrder === 0)
      el.draggingCardNumber = frames.length;

    return el;
  });
  const maskElement = createMaskElement(doc);
  const listContainerRect = frameListContainer.getBoundingClientRect();
  const children = Array.from(frameListContainer.children) as FrameCard[];
  let idx: undefined | number;

  container.renderRoot.appendChild(maskElement);
  container.renderRoot.append(...cardElements);

  const insideListContainer = (e: MouseEvent) => {
    return (
      e.clientX >= listContainerRect.left &&
      e.clientX <= listContainerRect.right &&
      e.clientY >= listContainerRect.top &&
      e.clientY <= listContainerRect.bottom
    );
  };

  const disposeMove = on(container, 'mousemove', e => {
    cardElements.forEach(el => {
      el.pos = {
        x: e.clientX,
        y: e.clientY,
      };
    });

    if (!insideListContainer(e)) {
      idx = undefined;
      onDragMove?.(idx);
      return;
    }

    idx = 0;
    for (const card of children) {
      if (!card.frame) break;

      const topBoundary =
        listContainerRect.top + card.offsetTop - frameListContainer.scrollTop;
      const midBoundary = topBoundary + card.offsetHeight / 2;
      const bottomBoundary = topBoundary + card.offsetHeight;

      if (e.clientY >= topBoundary && e.clientY <= bottomBoundary) {
        idx = e.clientY > midBoundary ? idx + 1 : idx;
        onDragMove?.(idx);
        return;
      }

      ++idx;
    }

    onDragMove?.(idx);
  });

  let ended = false;
  const dragEnd = () => {
    if (ended) return;

    ended = true;
    cardElements.forEach(child => container.renderRoot.removeChild(child));
    container.renderRoot.removeChild(maskElement);

    disposeMove();
    onDragEnd?.(idx);
  };

  once(host as Document, 'mouseup', dragEnd);
}

function createMaskElement(doc: Document) {
  const mask = doc.createElement('div');

  mask.style.height = '100vh';
  mask.style.width = '100vw';
  mask.style.position = 'fixed';
  mask.style.left = '0';
  mask.style.top = '0';
  mask.style.zIndex = 'calc(var(--affine-z-index-popover, 0) + 3)';
  mask.style.cursor = 'grabbing';

  return mask;
}

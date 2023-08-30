import { lastN } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import { on, once } from '../../../../../__internal__/utils/index.js';
import type { NoteBlockModel } from '../../../../../models.js';
import { TOCNoteCard } from '../toc-card.js';
import type { TOCNotesPanel } from '../toc-panel.js';

/**
 * start drag notes
 * @param notes notes to drag
 */
export function startDragging(
  notes: {
    note: NoteBlockModel;
    element: TOCNoteCard;
    index: number;
    number: number;
  }[],
  options: {
    width: number;
    onDragEnd?: (insertIndex?: number) => void;
    onDragMove?: (insertIdx?: number) => void;
    tocListContainer: HTMLElement;
    doc: Document;
    host: Document | HTMLElement;
    container: TOCNotesPanel;
    page: Page;
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
    page,
    onDragMove,
    onDragEnd,
    tocListContainer,
    start,
  } = options;
  const cardElements = lastN(notes, 2).map((note, idx, arr) => {
    const el = new TOCNoteCard();

    el.page = page;
    el.note = note.note;
    el.index = note.index;
    el.number = note.number;
    el.status = 'dragging';
    el.stackOrder = arr.length - 1 - idx;
    el.pos = start;
    el.width = options.width;

    return el;
  });
  const maskElement = createMaskElement(doc);
  const listContainerRect = tocListContainer.getBoundingClientRect();
  const children = Array.from(tocListContainer.children) as TOCNoteCard[];
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
    for (const note of children) {
      if (note.invisible || !note.note) break;

      const topBoundary =
        listContainerRect.top + note.offsetTop - tocListContainer.scrollTop;
      const midBoundary = topBoundary + note.offsetHeight / 2;
      const bottomBoundary = topBoundary + note.offsetHeight;

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

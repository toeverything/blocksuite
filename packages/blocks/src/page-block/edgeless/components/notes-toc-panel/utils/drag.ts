import type { Page } from '@blocksuite/store/index.js';

import { lastN, on, once } from '../../../../../__internal__/utils/index.js';
import type { NoteBlockModel } from '../../../../../models.js';
import type { TOCNoteCard } from '../toc-card.js';

/**
 * start drag notes
 * @param notes notes to drag
 */
export function createDrag(
  notes: {
    note: NoteBlockModel;
    element: TOCNoteCard;
    index: number;
    number: number;
  }[],
  options: {
    onDragEnd?: (insertIndex?: number) => void;
    onDragMove?: (insertIdx?: number) => void;
    tocListContainer: HTMLElement;
    doc: Document;
    page: Page;
    start: {
      x: number;
      y: number;
    };
  }
) {
  const { doc, page, onDragMove, onDragEnd, tocListContainer, start } = options;
  const cardElements = lastN(notes, 2).map((note, idx, arr) => {
    const el = document.createElement('edgeless-note-toc-card');

    el.page = page;
    el.note = note.note;
    el.index = note.index;
    el.number = note.number;
    el.status = 'dragging';
    el.stackOrder = arr.length - 1 - idx;
    el.pos = start;

    return el;
  });
  const maskElement = createMaskElement();
  const listContainerRect = tocListContainer.getBoundingClientRect();
  const children = Array.from(tocListContainer.children) as TOCNoteCard[];
  let idx: undefined | number;

  document.body.appendChild(maskElement);
  document.body.append(...cardElements);

  const insideListContainer = (e: MouseEvent) => {
    return (
      e.clientX >= listContainerRect.left &&
      e.clientX <= listContainerRect.right &&
      e.clientY >= listContainerRect.top &&
      e.clientY <= listContainerRect.bottom
    );
  };

  const disposeMove = on(doc, 'mousemove', e => {
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
      if (note.invisible) break;

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

  once(doc, 'mouseup', () => {
    cardElements.forEach(child => document.body.removeChild(child));
    document.body.removeChild(maskElement);

    disposeMove();
    onDragEnd?.(idx);
  });
}

function createMaskElement() {
  const mask = document.createElement('div');

  mask.style.height = '100vh';
  mask.style.width = '100vw';
  mask.style.position = 'fixed';
  mask.style.left = '0';
  mask.style.top = '0';
  mask.style.zIndex = 'calc(var(--affine-z-index-popover, 0) + 3)';
  mask.style.cursor = 'grabbing';

  return mask;
}

import { on, once } from '@blocksuite/blocks';
import type { Page } from '@blocksuite/store';

import type { OutlinePanelBody } from '../body/outline-panel-body.js';
import { type OutlineNoteCard } from '../card/outline-card.js';

/**
 * start drag notes
 * @param notes notes to drag
 */
export function startDragging(options: {
  onDragEnd?: (insertIndex?: number) => void;
  onDragMove?: (insertIdx?: number, indicatorTranslateY?: number) => void;
  outlineListContainer: HTMLElement;
  doc: Document;
  host: Document | HTMLElement;
  container: OutlinePanelBody;
  page: Page;
}) {
  const { doc, host, container, onDragMove, onDragEnd, outlineListContainer } =
    options;
  const maskElement = createMaskElement(doc);
  const listContainerRect = outlineListContainer.getBoundingClientRect();
  const children = Array.from(
    outlineListContainer.children
  ) as OutlineNoteCard[];
  let idx: undefined | number;
  let indicatorTranslateY: undefined | number;

  container.renderRoot.appendChild(maskElement);

  const insideListContainer = (e: MouseEvent) => {
    return (
      e.clientX >= listContainerRect.left &&
      e.clientX <= listContainerRect.right &&
      e.clientY >= listContainerRect.top &&
      e.clientY <= listContainerRect.bottom
    );
  };

  const disposeMove = on(container, 'mousemove', e => {
    if (!insideListContainer(e)) {
      idx = undefined;
      onDragMove?.(idx, 0);
      return;
    }

    idx = 0;
    for (const note of children) {
      if (note.invisible || !note.note) break;

      const topBoundary =
        listContainerRect.top + note.offsetTop - outlineListContainer.scrollTop;
      const midBoundary = topBoundary + note.offsetHeight / 2;
      const bottomBoundary = topBoundary + note.offsetHeight;

      if (e.clientY >= topBoundary && e.clientY <= bottomBoundary) {
        idx = e.clientY > midBoundary ? idx + 1 : idx;

        indicatorTranslateY =
          e.clientY > midBoundary ? bottomBoundary : topBoundary;
        indicatorTranslateY -= listContainerRect.top;

        onDragMove?.(idx, indicatorTranslateY);
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

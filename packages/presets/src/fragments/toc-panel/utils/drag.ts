import { on, once } from '@blocksuite/blocks';
import type { Page } from '@blocksuite/store';

import { type TOCNoteCard } from '../toc-card.js';
import type { TOCPanelBody } from '../toc-panel-body.js';

/**
 * start drag notes
 * @param notes notes to drag
 */
export function startDragging(options: {
  onDragEnd?: (insertIndex?: number) => void;
  onDragMove?: (insertIdx?: number, indicatorTranslateY?: number) => void;
  tocListContainer: HTMLElement;
  doc: Document;
  host: Document | HTMLElement;
  container: TOCPanelBody;
  page: Page;
}) {
  const { doc, host, container, onDragMove, onDragEnd, tocListContainer } =
    options;
  const maskElement = createMaskElement(doc);
  const listContainerRect = tocListContainer.getBoundingClientRect();
  const children = Array.from(tocListContainer.children) as TOCNoteCard[];
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
        listContainerRect.top + note.offsetTop - tocListContainer.scrollTop;
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

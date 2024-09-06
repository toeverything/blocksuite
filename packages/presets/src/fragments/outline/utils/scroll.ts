import type { EditorHost } from '@blocksuite/block-std';

import { NoteDisplayMode } from '@blocksuite/blocks';
import { clamp, DisposableGroup } from '@blocksuite/global/utils';

import type { AffineEditorContainer } from '../../../editors/editor-container.js';

import { getDocTitleByEditorHost } from '../../doc-title/doc-title.js';
import { getHeadingBlocksFromDoc } from './query.js';

export function scrollToBlock(editor: AffineEditorContainer, blockId: string) {
  const { host, mode } = editor;
  if (mode === 'edgeless' || !host) return;

  if (editor.doc.root?.id === blockId) {
    const docTitle = getDocTitleByEditorHost(host);
    if (!docTitle) return;

    docTitle.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  } else {
    const block = host.view.getBlock(blockId);
    if (!block) return;
    block.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
}

export function isBlockBeforeViewportCenter(
  blockId: string,
  editorHost: EditorHost
) {
  const block = editorHost.view.getBlock(blockId);
  if (!block) return false;

  const editorRect = (
    editorHost.parentElement ?? editorHost
  ).getBoundingClientRect();
  const blockRect = block.getBoundingClientRect();

  const editorCenter =
    clamp(editorRect.top, 0, document.documentElement.clientHeight) +
    Math.min(editorRect.height, document.documentElement.clientHeight) / 2;

  const blockCenter = blockRect.top + blockRect.height / 2;

  return blockCenter < editorCenter + blockRect.height;
}

export const observeActiveHeadingDuringScroll = (
  getEditor: () => AffineEditorContainer, // workaround for editor changed
  update: (activeHeading: string | null) => void
) => {
  const editor = getEditor();
  update(editor.doc.root?.id ?? null);

  const disposables = new DisposableGroup();
  disposables.addFromEvent(
    window,
    'scroll',
    () => {
      const { host } = getEditor();
      if (!host) return;

      const headings = getHeadingBlocksFromDoc(
        host.doc,
        [NoteDisplayMode.DocAndEdgeless, NoteDisplayMode.DocOnly],
        true
      );

      let activeHeadingId = host.doc.root?.id ?? null;
      headings.forEach(heading => {
        if (isBlockBeforeViewportCenter(heading.id, host)) {
          activeHeadingId = heading.id;
        }
      });
      update(activeHeadingId);
    },
    true
  );

  return disposables;
};

let highlightMask: HTMLDivElement | null = null;
let highlightTimeoutId: ReturnType<typeof setTimeout> | null = null;

function highlightBlock(editor: AffineEditorContainer, blockId: string) {
  const emptyClear = () => {};

  const { host } = editor;
  if (!host) return emptyClear;

  if (editor.doc.root?.id === blockId) return emptyClear;

  const rootComponent = host.querySelector('affine-page-root');
  if (!rootComponent) return emptyClear;

  if (!rootComponent.viewport) {
    console.error('viewport should exist');
    return emptyClear;
  }

  const {
    top: offsetY,
    left: offsetX,
    scrollTop,
    scrollLeft,
  } = rootComponent.viewport;

  const block = host.view.getBlock(blockId);
  if (!block) return emptyClear;

  const blockRect = block.getBoundingClientRect();
  const { top, left, width, height } = blockRect;

  if (!highlightMask) {
    highlightMask = document.createElement('div');
    rootComponent.append(highlightMask);
  }

  Object.assign(highlightMask.style, {
    position: 'absolute',
    top: `${top - offsetY + scrollTop}px`,
    left: `${left - offsetX + scrollLeft}px`,
    width: `${width}px`,
    height: `${height}px`,
    background: 'var(--affine-hover-color)',
    borderRadius: '4px',
    display: 'block',
  });

  // Clear the previous timeout if it exists
  if (highlightTimeoutId !== null) {
    clearTimeout(highlightTimeoutId);
  }

  highlightTimeoutId = setTimeout(() => {
    if (highlightMask) {
      highlightMask.style.display = 'none';
    }
  }, 1000);

  return () => {
    if (highlightMask !== null) {
      highlightMask.remove();
      highlightMask = null;
    }
    if (highlightTimeoutId !== null) {
      clearTimeout(highlightTimeoutId);
      highlightTimeoutId = null;
    }
  };
}

// this function is useful when the scroll need smooth animation
let highlightIntervalId: ReturnType<typeof setInterval> | null = null;
export async function scrollToBlockWithHighlight(
  editor: AffineEditorContainer,
  blockId: string,
  timeout = 3000
) {
  scrollToBlock(editor, blockId);

  let timeCount = 0;

  return new Promise<ReturnType<typeof highlightBlock>>(resolve => {
    if (highlightIntervalId !== null) {
      clearInterval(highlightIntervalId);
    }

    // wait block be scrolled into view
    let lastTop = -1;
    highlightIntervalId = setInterval(() => {
      if (highlightIntervalId === null) {
        console.error('unreachable code');
        return;
      }

      const { host } = editor;
      const block = host?.view.getBlock(blockId);

      if (!host || !block || timeCount > timeout) {
        clearInterval(highlightIntervalId);
        resolve(() => {});
        return;
      }

      const blockRect = block.getBoundingClientRect();
      const { top } = blockRect;

      if (top !== lastTop) {
        timeCount += 100;
        lastTop = top;
        return;
      }

      clearInterval(highlightIntervalId);

      // highlight block
      resolve(highlightBlock(editor, blockId));
    }, 100);
  });
}

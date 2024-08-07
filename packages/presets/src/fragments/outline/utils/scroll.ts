import type { Signal } from '@lit-labs/preact-signals';

import { NoteDisplayMode } from '@blocksuite/blocks';
import { DisposableGroup } from '@blocksuite/global/utils';

import type { AffineEditorContainer } from '../../../editors/editor-container.js';

import { getDocTitleByEditorHost } from '../../doc-title/doc-title.js';
import {
  getHeadingBlocksFromDoc,
  isHeadingBeforeViewportCenter,
} from './query.js';

export function scrollToBlock(editor: AffineEditorContainer, blockId: string) {
  const { host, mode } = editor;
  if (mode === 'edgeless' || !host) return;

  if (editor.doc.root?.id === blockId) {
    const docTitle = getDocTitleByEditorHost(host);
    if (!docTitle) return;

    docTitle.scrollIntoView({
      behavior: 'instant',
      block: 'start',
    });
  } else {
    const block = host.view.getBlock(blockId);
    if (!block) return;

    block.scrollIntoView({
      behavior: 'instant',
      block: 'center',
      inline: 'center',
    });
  }
}

export const observeActiveHeading = (
  getEditor: () => AffineEditorContainer, // workaround for editor changed
  activeHeadingId$: Signal<string | null>
) => {
  const editor = getEditor();
  activeHeadingId$.value = editor.doc.root?.id ?? null;

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

      let activeHeadingId = null;
      headings.forEach(heading => {
        if (isHeadingBeforeViewportCenter(heading, host)) {
          activeHeadingId = heading.id;
        }
      });
      activeHeadingId$.value = activeHeadingId;
    },
    true
  );

  return disposables;
};

let highlightMask: HTMLDivElement | null = null;
let highlightTimeoutId: ReturnType<typeof setTimeout> | null = null;

export function highlightBlock(editor: AffineEditorContainer, blockId: string) {
  const emptyClear = () => {};

  const { host } = editor;
  if (!host) return emptyClear;

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

import type { EditorHost } from '@blocksuite/block-std';
import type { Signal } from '@lit-labs/preact-signals';

import { NoteDisplayMode } from '@blocksuite/blocks';
import { DisposableGroup } from '@blocksuite/global/utils';

import {
  getHeadingBlocksFromDoc,
  isHeadingBeforeViewportCenter,
} from './query.js';

export const observeActiveHeading = (
  getEditorHost: () => EditorHost | null | undefined, // workaround for editor changed
  activeHeadingId$: Signal<string | null>
) => {
  const host = getEditorHost();
  if (host) {
    const headings = getHeadingBlocksFromDoc(
      host.doc,
      [NoteDisplayMode.DocAndEdgeless, NoteDisplayMode.DocOnly],
      true
    );
    // TODO(@L-Sun) use doc title
    activeHeadingId$.value = headings[0]?.id ?? null;
  }

  const disposables = new DisposableGroup();

  disposables.addFromEvent(
    window,
    'scroll',
    () => {
      const host = getEditorHost();
      if (!host) return;

      const headings = getHeadingBlocksFromDoc(
        host.doc,
        [NoteDisplayMode.DocAndEdgeless, NoteDisplayMode.DocOnly],
        true
      );
      // get the last heading before the editor viewport center
      let activeHeadingId = headings[0]?.id ?? null;
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

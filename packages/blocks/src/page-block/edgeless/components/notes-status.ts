import { HiddenIcon } from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/store';
import { computePosition, flip, offset } from '@floating-ui/dom';
import { html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import { getBlockElementById } from '../../../__internal__/utils/query.js';
import type { NoteBlockModel } from '../../../note-block/note-model.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { isTopLevelBlock } from '../utils/query.js';

export function EdgelessNotesStatus(
  edgeless: EdgelessPageBlockComponent,
  notes: NoteBlockModel[]
) {
  if (!edgeless.page.awarenessStore.getFlag('enable_note_index'))
    return nothing;

  const state = edgeless.selection.state;
  const isSelectOne = state.selected.length === 1;
  const singleSelected = state.selected[0];

  if (
    !isSelectOne ||
    !(
      isTopLevelBlock(singleSelected) &&
      matchFlavours(singleSelected, ['affine:note'])
    )
  )
    return nothing;

  const notesWithoutSelected = notes.filter(
    note => note.id !== singleSelected.id
  );
  const visibleNotes = notes.filter(note => !note.hidden);

  requestAnimationFrame(() => {
    for (const note of notesWithoutSelected) {
      const noteStatusElement = edgeless.querySelector(
        `[data-note-id="${note.id}"]`
      );
      if (noteStatusElement instanceof HTMLElement) {
        const noteElement = getBlockElementById(note.id);
        assertExists(noteElement);
        computePosition(noteElement, noteStatusElement, {
          placement: 'top-start',
          middleware: [
            flip(),
            offset({
              // 24 is `EDGELESS_BLOCK_CHILD_PADDING`
              mainAxis: (8 + 24) * edgeless.surface.viewport.zoom,
              crossAxis: (4 - 24) * edgeless.surface.viewport.zoom,
            }),
          ],
        }).then(({ x, y }) => {
          noteStatusElement.style.top = y + 'px';
          noteStatusElement.style.left = x + 'px';
        });
      }
    }
  });

  return html`<div class="affine-edgeless-notes-status">
    ${notesWithoutSelected.map(note => {
      const index = visibleNotes.indexOf(note);

      return html`<div
        data-note-id=${note.id}
        style=${styleMap({
          position: 'absolute',
          top: '-32px',
          left: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '10px',
          width: '24px',
          height: '24px',
          background: 'var(--affine-blue-600)',
          color: 'var(--affine-white)',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600',
          lineHeight: '16px',
        })}
      >
        ${!note.hidden
          ? html`<span
              style=${styleMap({
                display: 'flex',
                padding: '4px 6px',
                flexDirection: 'column',
              })}
              >${index + 1}</span
            >`
          : html`<span
              style=${styleMap({
                display: 'flex',
                padding: '4px',
              })}
              >${HiddenIcon}</span
            >`}
      </div>`;
    })}
  </div>`;
}

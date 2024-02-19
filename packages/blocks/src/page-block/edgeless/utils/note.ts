import { type Page } from '@blocksuite/store';

import {
  asyncFocusRichText,
  handleNativeRangeAtPoint,
  type NoteChildrenFlavour,
  type Point,
  type TopLevelBlockModel,
} from '../../../_common/utils/index.js';
import type { NoteBlockModel } from '../../../note-block/note-model.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  NOTE_MIN_HEIGHT,
} from './consts.js';

export type NoteOptions = {
  childFlavour: NoteChildrenFlavour;
  childType: string | null;
  collapse: boolean;
};

export function addNote(
  edgeless: EdgelessPageBlockComponent,
  page: Page,
  point: Point,
  options: NoteOptions,
  width = DEFAULT_NOTE_WIDTH,
  height = DEFAULT_NOTE_HEIGHT
) {
  const noteId = edgeless.addNoteWithPoint(point, {
    width,
    height,
  });

  const blockId = page.addBlock(
    options.childFlavour,
    { type: options.childType },
    noteId
  );
  if (options.collapse && height > NOTE_MIN_HEIGHT) {
    const note = page.getBlockById(noteId) as NoteBlockModel;
    page.updateBlock(note, () => {
      note.edgeless.collapse = true;
      note.edgeless.collapsedHeight = height;
    });
  }
  edgeless.tools.setEdgelessTool({ type: 'default' });

  // Wait for edgelessTool updated
  requestAnimationFrame(() => {
    const blocks =
      (page.root?.children.filter(
        child => child.flavour === 'affine:note'
      ) as TopLevelBlockModel[]) ?? [];
    const element = blocks.find(b => b.id === noteId);
    if (element) {
      edgeless.service.selection.set({
        elements: [element.id],
        editing: true,
      });

      // Waiting dom updated, `note mask` is removed
      edgeless.updateComplete
        .then(() => {
          if (blockId) {
            asyncFocusRichText(edgeless.host, page, blockId)?.catch(
              console.error
            );
          } else {
            // Cannot reuse `handleNativeRangeClick` directly here,
            // since `retargetClick` will re-target to pervious editor
            handleNativeRangeAtPoint(point.x, point.y);
          }
        })
        .catch(console.error);
    }
  });
}

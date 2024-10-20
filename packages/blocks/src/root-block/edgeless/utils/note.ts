import type { Point } from '@blocksuite/global/utils';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  NOTE_MIN_HEIGHT,
  type NoteBlockModel,
} from '@blocksuite/affine-model';
import { handleNativeRangeAtPoint } from '@blocksuite/affine-shared/utils';

import type { NoteChildrenFlavour } from '../../../_common/utils/index.js';
import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';

export type NoteOptions = {
  childFlavour: NoteChildrenFlavour;
  childType: string | null;
  collapse: boolean;
};

export function addNote(
  edgeless: EdgelessRootBlockComponent,
  point: Point,
  options: NoteOptions,
  width = DEFAULT_NOTE_WIDTH,
  height = DEFAULT_NOTE_HEIGHT
) {
  const noteId = edgeless.addNoteWithPoint(point, {
    width,
    height,
  });

  const doc = edgeless.doc;

  const blockId = doc.addBlock(
    options.childFlavour,
    { type: options.childType },
    noteId
  );
  if (options.collapse && height > NOTE_MIN_HEIGHT) {
    const note = doc.getBlockById(noteId) as NoteBlockModel;
    doc.updateBlock(note, () => {
      note.edgeless.collapse = true;
      note.edgeless.collapsedHeight = height;
    });
  }
  edgeless.tools.setEdgelessTool({ type: 'default' });

  // Wait for edgelessTool updated
  requestAnimationFrame(() => {
    const blocks =
      (doc.root?.children.filter(
        child => child.flavour === 'affine:note'
      ) as BlockSuite.EdgelessBlockModelType[]) ?? [];
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
            focusTextModel(edgeless.std, blockId);
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

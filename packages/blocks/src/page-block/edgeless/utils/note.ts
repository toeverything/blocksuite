import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { type Page } from '@blocksuite/store';

import {
  handleNativeRangeAtPoint,
  isEmpty,
  type NoteChildrenFlavour,
  Point,
  type TopLevelBlockModel,
} from '../../../_legacy/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { DEFAULT_NOTE_WIDTH } from './consts.js';

export type NoteOptions = {
  childFlavour: NoteChildrenFlavour;
  childType: string | null;
};

export function addNote(
  edgeless: EdgelessPageBlockComponent,
  page: Page,
  event: PointerEventState,
  width = DEFAULT_NOTE_WIDTH,
  options: NoteOptions
) {
  const noteId = edgeless.addNoteWithPoint(
    new Point(event.point.x, event.point.y),
    {
      width,
    }
  );

  page.addBlock(options.childFlavour, { type: options.childType }, noteId);
  edgeless.slots.edgelessToolUpdated.emit({ type: 'default' });

  // Wait for edgelessTool updated
  requestAnimationFrame(() => {
    const blocks =
      (page.root?.children.filter(
        child => child.flavour === 'affine:note'
      ) as TopLevelBlockModel[]) ?? [];
    const element = blocks.find(b => b.id === noteId);
    if (element) {
      edgeless.selectionManager.setSelection({
        elements: [element.id],
        editing: true,
      });

      // Waiting dom updated, `note mask` is removed
      edgeless.updateComplete.then(() => {
        // Cannot reuse `handleNativeRangeClick` directly here,
        // since `retargetClick` will re-target to pervious editor
        handleNativeRangeAtPoint(event.raw.clientX, event.raw.clientY);

        // Waiting dom updated, remove note if it is empty
        requestAnimationFrame(() => {
          edgeless.selectionManager.slots.updated.once(({ editing }) => {
            const block = page.getBlockById(noteId);
            assertExists(block);
            if (!editing && isEmpty(block)) {
              page.deleteBlock(element);
            }
          });
        });
      });
    }
  });
}

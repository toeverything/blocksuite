import { type Page } from '@blocksuite/store';

import {
  handleNativeRangeAtPoint,
  type NoteChildrenFlavour,
  type Point,
  type TopLevelBlockModel,
} from '../../../_common/utils/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { DEFAULT_NOTE_HEIGHT, DEFAULT_NOTE_WIDTH } from './consts.js';

export type NoteOptions = {
  childFlavour: NoteChildrenFlavour;
  childType: string | null;
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
      edgeless.selectionManager.set({
        elements: [element.id],
        editing: true,
      });

      // Waiting dom updated, `note mask` is removed
      edgeless.updateComplete
        .then(() => {
          // Cannot reuse `handleNativeRangeClick` directly here,
          // since `retargetClick` will re-target to pervious editor
          handleNativeRangeAtPoint(point.x, point.y);
        })
        .catch(console.error);
    }
  });
}

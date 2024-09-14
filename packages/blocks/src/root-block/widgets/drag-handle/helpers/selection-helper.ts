import type { BlockComponent } from '@blocksuite/block-std';

import { findNoteBlockModel } from '@blocksuite/affine-shared/utils';

import type { AffineDragHandleWidget } from '../drag-handle.js';

export class SelectionHelper {
  /** Check if given block component is selected */
  isBlockSelected = (block?: BlockComponent) => {
    if (!block) return false;
    return this.selectedBlocks.some(
      selection => selection.blockId === block.model.id
    );
  };

  setSelectedBlocks = (blocks: BlockComponent[], noteId?: string) => {
    const { selection } = this;
    const selections = blocks.map(block =>
      selection.create('block', {
        blockId: block.blockId,
      })
    );

    // When current page is edgeless page
    // We need to remain surface selection and set editing as true
    if (this.widget.mode === 'edgeless') {
      const surfaceElementId = noteId
        ? noteId
        : findNoteBlockModel(blocks[0].model)?.id;
      if (!surfaceElementId) return;
      const surfaceSelection = selection.create(
        'surface',
        blocks[0]!.blockId,
        [surfaceElementId],
        true
      );

      selections.push(surfaceSelection);
    }

    selection.set(selections);
  };

  get selectedBlockComponents() {
    return this.selectedBlocks
      .map(block => this.widget.std.view.getBlock(block.blockId))
      .filter((block): block is BlockComponent => !!block);
  }

  get selectedBlockIds() {
    return this.selectedBlocks.map(block => block.blockId);
  }

  get selectedBlocks() {
    const selection = this.selection;
    // eslint-disable-next-line unicorn/prefer-array-some
    return selection.find('text')
      ? selection.filter('text')
      : selection.filter('block');
  }

  get selection() {
    return this.widget.std.selection;
  }

  constructor(readonly widget: AffineDragHandleWidget) {}
}

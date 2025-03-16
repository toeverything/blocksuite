import { RootBlockSchema } from '@blocksuite/affine-model';
import {
  getBlockSelectionsCommand,
  getImageSelectionsCommand,
  getSelectedBlocksCommand,
  getTextSelectionCommand,
} from '@blocksuite/affine-shared/commands';
import type { BlockComponent } from '@blocksuite/block-std';
import { BlockService } from '@blocksuite/block-std';

import type { RootBlockComponent } from './types.js';

export abstract class RootService extends BlockService {
  static override readonly flavour = RootBlockSchema.model.flavour;

  get selectedBlocks() {
    let result: BlockComponent[] = [];
    this.std.command
      .chain()
      .tryAll(chain => [
        chain.pipe(getTextSelectionCommand),
        chain.pipe(getImageSelectionsCommand),
        chain.pipe(getBlockSelectionsCommand),
      ])
      .pipe(getSelectedBlocksCommand)
      .pipe(({ selectedBlocks }) => {
        if (!selectedBlocks) return;
        result = selectedBlocks;
      })
      .run();
    return result;
  }

  get selectedModels() {
    return this.selectedBlocks.map(block => block.model);
  }

  get viewportElement() {
    const rootId = this.std.store.root?.id;
    if (!rootId) return null;
    const rootComponent = this.std.view.getBlock(
      rootId
    ) as RootBlockComponent | null;
    if (!rootComponent) return null;
    const viewportElement = rootComponent.viewportElement;
    return viewportElement;
  }
}

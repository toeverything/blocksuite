import { BlockService } from '@blocksuite/block-std';

import type { PageBlockModel } from '../page-model.js';
import type {
  DefaultPageBlockComponent,
  DefaultSelectionSlots,
} from './default-page-block.js';
import { DefaultSelectionManager } from './selection-manager/index.js';

export class DefaultPageService extends BlockService<PageBlockModel> {
  selection: DefaultSelectionManager | null = null;

  mountSelectionManager(
    container: DefaultPageBlockComponent,
    slots: DefaultSelectionSlots
  ) {
    if (this.selection) {
      console.error('selection manager already exists');
      return;
    }
    this.selection = new DefaultSelectionManager({
      slots,
      container,
      dispatcher: this.uiEventDispatcher,
    });
  }

  unmountSelectionManager() {
    if (!this.selection) {
      console.error('selection manager does not exist');
      return;
    }

    this.selection.clear();
    this.selection.dispose();
    this.selection = null;
  }

  override unmounted() {
    super.unmounted();
    this.unmountSelectionManager();
  }
}

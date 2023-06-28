import { BlockService } from '@blocksuite/block-std';

import type { PageBlockModel } from '../page-model.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';
import { EdgelessSelectionManager } from './utils/selection-manager.js';

export class EdgelessPageService extends BlockService<PageBlockModel> {
  selection: EdgelessSelectionManager | null = null;

  mountSelectionManager(container: EdgelessPageBlockComponent) {
    if (this.selection) {
      this.unmountSelectionManager();
      return;
    }
    this.selection = new EdgelessSelectionManager(
      container,
      this.uiEventDispatcher
    );
  }

  unmountSelectionManager() {
    if (!this.selection) {
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

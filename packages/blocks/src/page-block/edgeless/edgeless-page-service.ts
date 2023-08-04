import { BlockService } from '@blocksuite/block-std';

import type { PageBlockModel } from '../page-model.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';
import { EdgelessSelectionManager } from './services/selection-manager.js';
import { EdgelessToolsManager } from './services/tools-manager.js';

export class EdgelessPageService extends BlockService<PageBlockModel> {
  selection: EdgelessSelectionManager | null = null;
  tools: EdgelessToolsManager | null = null;

  mountSelectionManager(container: EdgelessPageBlockComponent) {
    if (this.tools) {
      return;
    }

    this.selection = new EdgelessSelectionManager(container);
    this.tools = new EdgelessToolsManager(container, this.uiEventDispatcher);
  }

  unmountSelectionManager() {
    if (this.tools) {
      this.tools.clear();
      this.tools.dispose();
      this.tools = null;
    }

    if (this.selection) {
      this.selectionManager.set([]);
      this.selection.dispose();
      this.selection = null;
    }
  }

  override unmounted() {
    super.unmounted();
    this.unmountSelectionManager();
  }
}

import type { BaseBlockModel } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';

import type { UIEventDispatcher } from '../event/index.js';
import type { EventName, UIEventHandler } from '../event/index.js';
import type { SelectionManager } from '../selection/index.js';

export interface BlockServiceOptions {
  // TODO: add these
  // transformer;

  uiEventDispatcher: UIEventDispatcher;
  selectionManager: SelectionManager;
}

export class BlockService<Model extends BaseBlockModel = BaseBlockModel> {
  readonly disposables = new DisposableGroup();
  readonly uiEventDispatcher: UIEventDispatcher;
  readonly selectionManager: SelectionManager;

  constructor(options: BlockServiceOptions) {
    this.uiEventDispatcher = options.uiEventDispatcher;
    this.selectionManager = options.selectionManager;
  }

  // life cycle start
  dispose() {
    this.disposables.dispose();
  }

  mounted() {
    // do nothing
  }

  unmounted() {
    // do nothing
  }
  // life cycle end

  // event handlers start
  handleEvent(name: EventName, fn: UIEventHandler) {
    this.disposables.add(this.uiEventDispatcher.add(name, fn));
  }
  // event handlers end
}

export type BlockServiceConstructor = new (
  options: BlockServiceOptions
) => BlockService;

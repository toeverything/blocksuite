import type { BaseBlockModel } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';

import type { UIEventDispatcher } from '../event/index.js';
import type { EventName, UIEventHandler } from '../event/index.js';

export interface BlockServiceOptions {
  // TODO: add these
  // selectionManager;
  // transformer;

  uiEventDispatcher: UIEventDispatcher;
}

export class BlockService<Model extends BaseBlockModel = BaseBlockModel> {
  disposables = new DisposableGroup();
  uiEventDispatcher: UIEventDispatcher;

  constructor(options: BlockServiceOptions) {
    this.uiEventDispatcher = options.uiEventDispatcher;
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

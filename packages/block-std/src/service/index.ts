import type { BaseBlockModel } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';

import type { EventName, UIEventHandler } from '../event/index.js';
import type { BlockStore } from '../store/index.js';

export interface BlockServiceOptions {
  store: BlockStore;
}

export class BlockService<Model extends BaseBlockModel = BaseBlockModel> {
  readonly store: BlockStore;
  readonly disposables = new DisposableGroup();

  constructor(options: BlockServiceOptions) {
    this.store = options.store;
  }

  get workspace() {
    return this.store.workspace;
  }

  get page() {
    return this.store.page;
  }

  get selectionManager() {
    return this.store.selectionManager;
  }

  get uiEventDispatcher() {
    return this.store.uiEventDispatcher;
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

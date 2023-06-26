import type { BaseBlockModel } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';

import type { UIEventDispatcher } from '../event/index.js';

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

  dispose() {
    this.disposables.dispose();
  }

  // TODO: life cycle methods
}

export type BlockServiceConstructor = new (
  options: BlockServiceOptions
) => BlockService;

import { DisposableGroup } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

import type { EventName, UIEventHandler } from '../event/index.js';
import type { BlockStdProvider } from '../provider/index.js';

export interface BlockServiceOptions {
  flavour: string;
  store: BlockStdProvider;
}

export class BlockService<_Model extends BaseBlockModel = BaseBlockModel> {
  readonly std: BlockStdProvider;
  readonly flavour: string;
  readonly disposables = new DisposableGroup();

  constructor(options: BlockServiceOptions) {
    this.flavour = options.flavour;
    this.std = options.store;
  }

  get workspace() {
    return this.std.workspace;
  }

  get page() {
    return this.std.page;
  }

  get selectionManager() {
    return this.std.selection;
  }

  get uiEventDispatcher() {
    return this.std.event;
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
  handleEvent(
    name: EventName,
    fn: UIEventHandler,
    options?: { global: boolean }
  ) {
    this.disposables.add(
      this.uiEventDispatcher.add(name, fn, {
        flavour: options?.global ? undefined : this.flavour,
      })
    );
  }

  bindHotKey(
    keymap: Record<string, UIEventHandler>,
    options?: { global: boolean }
  ) {
    this.disposables.add(
      this.uiEventDispatcher.bindHotkey(keymap, {
        flavour: options?.global ? undefined : this.flavour,
      })
    );
  }
  // event handlers end
}

export type BlockServiceConstructor = new (
  options: BlockServiceOptions
) => BlockService;

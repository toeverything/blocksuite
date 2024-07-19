import type { BlockModel } from '@blocksuite/store';

import { DisposableGroup } from '@blocksuite/global/utils';

import type { EventName, UIEventHandler } from '../event/index.js';
import type { BlockStdScope } from '../scope/index.js';
import type { BlockSpecSlots } from '../spec/slots.js';

export interface BlockServiceOptions {
  flavour: string;
  std: BlockStdScope;
  slots: BlockSpecSlots;
}

export class BlockService<_Model extends BlockModel = BlockModel> {
  readonly disposables = new DisposableGroup();

  readonly flavour: string;

  readonly specSlots: BlockSpecSlots;

  readonly std: BlockStdScope;

  constructor(options: BlockServiceOptions) {
    this.flavour = options.flavour;
    this.std = options.std;
    this.specSlots = options.slots;
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

  // life cycle start
  dispose() {
    this.disposables.dispose();
  }

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

  mounted() {
    this.specSlots.mounted.emit({ service: this });
  }

  unmounted() {
    this.specSlots.unmounted.emit({ service: this });
  }

  get collection() {
    return this.std.collection;
  }

  get doc() {
    return this.std.doc;
  }

  get host() {
    return this.std.host;
  }
  // life cycle end

  get selectionManager() {
    return this.std.selection;
  }

  get uiEventDispatcher() {
    return this.std.event;
  }
  // event handlers end
}

export type BlockServiceConstructor<T extends BlockService = BlockService> =
  new (options: BlockServiceOptions) => T;

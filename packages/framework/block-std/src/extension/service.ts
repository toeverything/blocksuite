import type { Container } from '@blocksuite/global/di';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { DisposableGroup } from '@blocksuite/global/utils';

import type { EventName, UIEventHandler } from '../event/index.js';

import {
  BlockFlavourIdentifier,
  BlockServiceIdentifier,
  BlockStdScope,
} from '../scope/index.js';
import { getSlots } from '../spec/index.js';
import { Extension } from './extension.js';

export abstract class BlockService extends Extension {
  static flavour: string;

  readonly disposables = new DisposableGroup();

  readonly flavour: string;

  readonly specSlots = getSlots();

  constructor(
    readonly std: BlockStdScope,
    readonly flavourProvider: { flavour: string }
  ) {
    super();
    this.flavour = flavourProvider.flavour;
  }

  static override setup(di: Container) {
    if (!this.flavour) {
      throw new BlockSuiteError(
        ErrorCode.ValueNotExists,
        'Flavour is not defined in the BlockService'
      );
    }
    di.addImpl(BlockServiceIdentifier(this.flavour), this, [
      BlockStdScope,
      BlockFlavourIdentifier(this.flavour),
    ]);
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

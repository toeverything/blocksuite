import type { Container } from '@blocksuite/global/di';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { DisposableGroup } from '@blocksuite/global/utils';

import type { EventName, UIEventHandler } from '../event/index.js';
import type { BlockStdScope } from '../scope/index.js';

import {
  BlockFlavourIdentifier,
  BlockServiceIdentifier,
  StdIdentifier,
} from '../identifier.js';
import { getSlots } from '../spec/index.js';
import { Extension } from './extension.js';

/**
 * @deprecated
 * BlockService is deprecated. You should reconsider where to put your feature.
 *
 * BlockService is a legacy extension that is used to provide services to the block.
 * In the previous version of BlockSuite, block service provides a way to extend the block.
 * However, in the new version, we recommend using the new extension system.
 */
export abstract class BlockService extends Extension {
  static flavour: string;

  readonly disposables = new DisposableGroup();

  readonly flavour: string;

  readonly specSlots = getSlots();

  get collection() {
    return this.std.collection;
  }

  get doc() {
    return this.std.doc;
  }

  get host() {
    return this.std.host;
  }

  get selectionManager() {
    return this.std.selection;
  }

  get uiEventDispatcher() {
    return this.std.event;
  }

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
    di.add(
      this as unknown as {
        new (
          std: BlockStdScope,
          flavourProvider: { flavour: string }
        ): BlockService;
      },
      [StdIdentifier, BlockFlavourIdentifier(this.flavour)]
    );
    di.addImpl(BlockServiceIdentifier(this.flavour), provider =>
      provider.get(this)
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
  // life cycle end

  mounted() {
    this.specSlots.mounted.emit({ service: this });
  }

  unmounted() {
    this.dispose();
    this.specSlots.unmounted.emit({ service: this });
  }
  // event handlers end
}

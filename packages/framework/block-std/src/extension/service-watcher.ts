import type { Container } from '@blocksuite/global/di';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

import type { BlockStdScope } from '../scope/index.js';
import type { BlockService } from './service.js';

import {
  BlockServiceIdentifier,
  LifeCycleWatcherIdentifier,
  StdIdentifier,
} from '../identifier.js';
import { LifeCycleWatcher } from './lifecycle-watcher.js';

const idMap = new Map<string, number>();

/**
 * @deprecated
 * BlockServiceWatcher is deprecated. You should reconsider where to put your feature.
 *
 * BlockServiceWatcher is a legacy extension that is used to watch the slots registered on block service.
 * However, we recommend using the new extension system.
 */
export abstract class BlockServiceWatcher extends LifeCycleWatcher {
  static flavour: string;

  constructor(
    std: BlockStdScope,
    readonly blockService: BlockService
  ) {
    super(std);
  }

  static override setup(di: Container) {
    if (!this.flavour) {
      throw new BlockSuiteError(
        ErrorCode.ValueNotExists,
        'Flavour is not defined in the BlockServiceWatcher'
      );
    }
    const id = idMap.get(this.flavour) ?? 0;
    idMap.set(this.flavour, id + 1);
    di.addImpl(
      LifeCycleWatcherIdentifier(`${this.flavour}-watcher-${id}`),
      this,
      [StdIdentifier, BlockServiceIdentifier(this.flavour)]
    );
  }
}

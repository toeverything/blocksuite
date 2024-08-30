import type { Container } from '@blocksuite/global/di';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

import type { BlockService } from './service.js';

import {
  BlockServiceIdentifier,
  BlockServiceWatcherIdentifier,
} from '../scope/index.js';
import { Extension } from './extension.js';

const idMap = new Map<string, number>();

export abstract class BlockServiceWatcher extends Extension {
  static flavour: string;

  constructor(readonly blockService: BlockService) {
    super();
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
      BlockServiceWatcherIdentifier(`${this.flavour}-watcher-${id}`),
      this,
      [BlockServiceIdentifier(this.flavour)]
    );
  }

  listen() {}
}

import type { Container } from '@blocksuite/global/di';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

import type { BlockStdScope } from '../scope/index.js';

import { LifeCycleWatcherIdentifier, StdIdentifier } from '../identifier.js';
import { Extension } from './extension.js';

export abstract class LifeCycleWatcher extends Extension {
  static key: string;

  constructor(readonly std: BlockStdScope) {
    super();
  }

  static override setup(di: Container) {
    if (!this.key) {
      throw new BlockSuiteError(
        ErrorCode.ValueNotExists,
        'Key is not defined in the LifeCycleWatcher'
      );
    }

    di.add(this as unknown as { new (std: BlockStdScope): LifeCycleWatcher }, [
      StdIdentifier,
    ]);

    di.addImpl(LifeCycleWatcherIdentifier(this.key), provider =>
      provider.get(this)
    );
  }

  created() {}

  mounted() {}

  rendered() {}

  unmounted() {}
}

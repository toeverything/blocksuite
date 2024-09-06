import type { Schema } from '../../../schema/index.js';
import type { Doc } from '../doc.js';
import type { BlockOptions, YBlock } from './types.js';

import { BlockViewType } from '../consts.js';
import { SyncController } from './sync-controller.js';

export * from './types.js';

export class Block {
  private _syncController: SyncController;

  blockViewType: BlockViewType = BlockViewType.Display;

  get flavour() {
    return this._syncController.flavour;
  }

  get id() {
    return this._syncController.id;
  }

  get model() {
    return this._syncController.model;
  }

  get pop() {
    return this._syncController.pop;
  }

  get stash() {
    return this._syncController.stash;
  }

  get version() {
    return this._syncController.version;
  }

  constructor(
    readonly schema: Schema,
    readonly yBlock: YBlock,
    readonly doc?: Doc,
    readonly options: BlockOptions = {}
  ) {
    const onChange = !options.onChange
      ? undefined
      : (key: string, value: unknown) => {
          options.onChange?.(this, key, value);
        };
    this._syncController = new SyncController(schema, yBlock, doc, onChange);
  }
}

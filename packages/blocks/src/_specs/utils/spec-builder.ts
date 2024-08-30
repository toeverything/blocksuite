import type { ExtensionType } from '@blocksuite/block-std';
import type { BlockSpec } from '@blocksuite/block-std';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

export class SpecBuilder {
  private readonly _value: BlockSpec[];

  constructor(spec: BlockSpec[]) {
    this._value = [...spec];
  }

  extend<Flavour extends BlockSuite.Flavour>(
    flavour: Flavour,
    extensions: ExtensionType[]
  ) {
    const specIndex = this._value.findIndex(
      s => s.schema.model.flavour === flavour
    );

    if (specIndex === -1) {
      throw new BlockSuiteError(
        ErrorCode.ValueNotExists,
        `BlockSpec not found for ${flavour}`
      );
    }

    this._value[specIndex] = {
      ...this._value[specIndex],
    };

    const spec = this._value[specIndex];
    const prevExtensions = spec.extensions || [];

    spec.extensions = [...prevExtensions, ...extensions];
  }

  get value() {
    return this._value;
  }
}

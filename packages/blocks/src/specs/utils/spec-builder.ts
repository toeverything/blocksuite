import type { BlockSpec, BlockSpecSlots } from '@blocksuite/block-std';
import type { DisposableGroup } from '@blocksuite/global/utils';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

export class SpecBuilder {
  private readonly _value: BlockSpec[];

  constructor(spec: BlockSpec[]) {
    this._value = [...spec];
  }

  setup<Flavour extends BlockSuite.ServiceKeys>(
    flavour: Flavour,
    setup: (
      slots: BlockSpecSlots<BlockSuite.BlockServices[Flavour]>,
      disposableGroup: DisposableGroup
    ) => void
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
    const oldSetup = spec.setup;

    spec.setup = (slots, disposableGroup) => {
      oldSetup?.(slots, disposableGroup);
      setup(
        slots as unknown as BlockSpecSlots<BlockSuite.BlockServices[Flavour]>,
        disposableGroup
      );
    };
  }

  get value() {
    return this._value;
  }
}

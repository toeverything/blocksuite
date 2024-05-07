import type { BlockSpec, BlockSpecSlots } from '@blocksuite/block-std';
import { assertExists, type DisposableGroup } from '@blocksuite/global/utils';

export class SpecBuilder {
  private readonly _value: BlockSpec[];
  constructor(spec: BlockSpec[]) {
    this._value = [...spec];
  }

  get value() {
    return this._value;
  }

  setup(
    flavour: BlockSuite.Flavour,
    setup: (slots: BlockSpecSlots, disposableGroup: DisposableGroup) => void
  ) {
    const spec = this._value.find(s => s.schema.model.flavour === flavour);
    assertExists(spec, `BlockSpec not found for ${flavour}`);
    const oldSetup = spec.setup;
    spec.setup = (slots, disposableGroup) => {
      oldSetup?.(slots, disposableGroup);
      setup(slots, disposableGroup);
    };
  }
}

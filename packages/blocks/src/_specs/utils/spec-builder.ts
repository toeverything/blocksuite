import type { ExtensionType } from '@blocksuite/block-std';

export class SpecBuilder {
  private _value: ExtensionType[];

  constructor(spec: ExtensionType[]) {
    this._value = [...spec];
  }

  extend(extensions: ExtensionType[]) {
    this._value = [...this._value, ...extensions];
  }

  get value() {
    return this._value;
  }
}

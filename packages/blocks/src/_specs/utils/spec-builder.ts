import type { ExtensionType } from '@blocksuite/block-std';

export class SpecBuilder {
  private _value: ExtensionType[];

  get value() {
    return this._value;
  }

  constructor(spec: ExtensionType[]) {
    this._value = [...spec];
  }

  extend(extensions: ExtensionType[]) {
    this._value = [...this._value, ...extensions];
  }
}

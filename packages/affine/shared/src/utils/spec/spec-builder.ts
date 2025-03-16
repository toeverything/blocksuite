import type { ExtensionType } from '@blocksuite/store';

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
    return this;
  }

  omit(target: ExtensionType) {
    this._value = this._value.filter(extension => extension !== target);
    return this;
  }

  hasAll(target: ExtensionType[]) {
    return target.every(t => this._value.includes(t));
  }

  hasOneOf(target: ExtensionType[]) {
    return target.some(t => this._value.includes(t));
  }

  replace(target: ExtensionType[], newExtension: ExtensionType[]) {
    this._value = [
      ...this._value.filter(extension => !target.includes(extension)),
      ...newExtension,
    ];
    return this;
  }
}

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { TemplateResult } from 'lit';
import { html } from 'lit';
import { property } from 'lit/decorators.js';

import type { TType } from '../../logical/typesystem.js';
import { createDatabasePopup } from '../popup.js';

export abstract class LiteralElement<
  T = unknown,
  Type extends TType = TType
> extends WithDisposable(ShadowlessElement) {
  @property()
  type!: Type;

  @property()
  value!: T;

  @property()
  onChange!: (value: T) => void;

  @property()
  mode: 'show' | 'edit' = 'show';

  showValue(): string {
    return this.value?.toString() ?? '[]';
  }

  doneValue(): T {
    return this.value;
  }

  done() {
    this.onChange(this.doneValue());
  }

  show(): TemplateResult {
    return html` <span @click="${this.popEdit}">${this.showValue()}</span> `;
  }

  edit(): TemplateResult {
    return html``;
  }

  static create<T>(type: TType, value: T, onChange: (value: T) => void) {
    // @ts-expect-error
    const ele = new this() as LiteralElement<T>;
    ele.type = type;
    ele.value = value;
    ele.onChange = v => {
      onChange(v);
      ele.value = v;
      ele.remove();
    };
    return ele;
  }

  _popEdit(target: HTMLElement = this) {
    const ele = (this.constructor as typeof LiteralElement).create(
      this.type,
      this.value,
      this.onChange
    );
    ele.mode = 'edit';
    ele.style.position = 'absolute';
    ele.style.zIndex = '999';
    createDatabasePopup(target, ele, {
      onClose: () => {
        ele.done();
      },
    });
  }

  popEdit() {
    this._popEdit();
  }

  override render() {
    if (this.mode === 'show') {
      return this.show();
    }
    return this.edit();
  }
}

import format from 'date-fns/format';
import { css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { DatabaseCellElement } from '../../register.js';

@customElement('affine-database-date-cell')
export class DateCell extends DatabaseCellElement<number> {
  static override styles = css`
    affine-database-date-cell {
      display: block;
      width: 100%;
      height: 100%;
    }

    .affine-database-date {
      display: flex;
      align-items: center;
      height: 100%;
      width: 100%;
      padding: 0;
      border: none;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
      font-weight: 400;
      background-color: transparent;
    }
  `;

  override render() {
    const value = this.value ? format(new Date(this.value), 'yyyy/MM/dd') : '';
    return html` <div class="affine-database-date date">${value}</div>`;
  }
}

@customElement('affine-database-date-cell-editing')
export class DateCellEditing extends DatabaseCellElement<number> {
  static override styles = css`
    affine-database-date-cell-editing {
      display: block;
      width: 100%;
      height: 100%;
      cursor: text;
    }

    .affine-database-date {
      display: flex;
      align-items: center;
      height: 100%;
      width: 100%;
      padding: 0;
      border: none;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
      font-weight: 400;
      background-color: transparent;
    }

    .affine-database-date:focus {
      outline: none;
    }
  `;

  @query('input')
  private _inputEle!: HTMLInputElement;

  override onExitEditMode() {
    this._setValue();
  }

  private _setValue = (str: string = this._inputEle.value) => {
    if (str === '') {
      this.onChange(undefined);
      this._inputEle.value = '';
      return;
    }

    const date = new Date(str);
    const value = format(date, 'yyyy-MM-dd');
    this.onChange(date.getTime());
    this._inputEle.value = `${value ?? ''}`;
  };

  override firstUpdated() {
    this._inputEle.focus();
  }

  private _onFocus = () => {
    this._inputEle.showPicker();
  };

  override render() {
    const value = this.value ? format(this.value, 'yyyy-MM-dd') : '';
    return html`<input
      type="date"
      class="affine-database-date date"
      .value="${value}"
      @focus=${this._onFocus}
    />`;
  }
}

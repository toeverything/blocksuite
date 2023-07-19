import { css, html } from 'lit';
import { query } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';

import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';

class DateCell extends DatabaseCellElement<string> {
  static override tag = literal`affine-database-date-cell`;

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
    return html` <div class="affine-database-date date">
      ${this.value ?? ''}
    </div>`;
  }
}

export class DateCellEditing extends DatabaseCellElement<string> {
  static override tag = literal`affine-database-date-cell-editing`;

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

  private _setValue = (value: string = this._inputEle.value) => {
    this.onChange(value);
    this._inputEle.value = `${this.value ?? ''}`;
  };

  override firstUpdated() {
    this._inputEle.focus();
  }

  private _onFocus = () => {
    this._inputEle.showPicker();
  };

  override render() {
    return html`<input
      type="date"
      class="affine-database-date date"
      .value="${this.value ?? ''}"
      @focus=${this._onFocus}
    />`;
  }
}

export const DateColumnRenderer = defineColumnRenderer(
  'date',
  {
    Cell: DateCell,
    CellEditing: DateCellEditing,
  },
  {
    displayName: 'Date',
  }
);

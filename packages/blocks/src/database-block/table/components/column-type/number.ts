import { css, html } from 'lit';
import { query } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';

import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';

class NumberCell extends DatabaseCellElement<number> {
  static override tag = literal`affine-database-number-cell`;

  static override styles = css`
    affine-database-number-cell {
      display: block;
      width: 100%;
      height: 100%;
    }

    .affine-database-number {
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
    return html` <div class="affine-database-number number">
      ${this.value ?? ''}
    </div>`;
  }
}

export class NumberCellEditing extends DatabaseCellElement<number> {
  static override tag = literal`affine-database-number-cell-editing`;

  static override styles = css`
    affine-database-number-cell-editing {
      display: block;
      width: 100%;
      height: 100%;
      cursor: text;
    }

    .affine-database-number {
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

    .affine-database-number:focus {
      outline: none;
    }
  `;

  @query('input')
  private _inputEle!: HTMLInputElement;

  focusEnd = () => {
    const end = this._inputEle.value.length;
    this._inputEle.focus();
    this._inputEle.setSelectionRange(end, end);
  };

  override onExitEditMode() {
    this._setValue();
  }

  private _setValue = (str: string = this._inputEle.value) => {
    if (!str) {
      this.onChange(undefined);
      return;
    }
    const value = Number.parseFloat(str);
    if (Object.is(value, NaN)) {
      this._inputEle.value = `${this.value ?? ''}`;
      return;
    }
    this.onChange(value, { captureSync: true });
    this._inputEle.value = `${this.value ?? ''}`;
  };

  private _keydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      this._setValue();
      setTimeout(() => {
        this.selectCurrentCell(false);
      });
    }
  };

  override firstUpdated() {
    this.focusEnd();
  }

  override render() {
    return html`<input
      .value="${this.value ?? ''}"
      @keydown="${this._keydown}"
      class="affine-database-number number"
    />`;
  }
}

export const NumberColumnRenderer = defineColumnRenderer(
  'number',
  {
    Cell: NumberCell,
    CellEditing: NumberCellEditing,
  },
  {
    displayName: 'Number',
  }
);

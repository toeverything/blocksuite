import { baseTheme } from '@toeverything/theme';
import { css, html, unsafeCSS } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { createIcon } from '../../../../components/icon/uni-icon.js';
import { BaseCellRenderer } from '../base-cell.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { numberPureColumnConfig } from './define.js';

@customElement('affine-database-number-cell')
export class NumberCell extends BaseCellRenderer<number> {
  static override styles = css`
    affine-database-number-cell {
      display: block;
      width: 100%;
    }

    .affine-database-number {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0;
      border: none;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      font-size: var(--data-view-cell-text-size);
      line-height: var(--data-view-cell-text-line-height);
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

@customElement('affine-database-number-cell-editing')
export class NumberCellEditing extends BaseCellRenderer<number> {
  static override styles = css`
    affine-database-number-cell-editing {
      display: block;
      width: 100%;
      cursor: text;
    }

    .affine-database-number {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0;
      border: none;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      font-size: var(--data-view-cell-text-size);
      line-height: var(--data-view-cell-text-line-height);
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
    this._inputEle.value = `${this.value ?? ''}`;
    this.onChange(value);
  };

  private _keydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      requestAnimationFrame(() => {
        this.selectCurrentCell(false);
      });
    }
  };

  override firstUpdated() {
    requestAnimationFrame(() => {
      this.focusEnd();
    });
  }

  _blur() {
    this.selectCurrentCell(false);
  }
  _focus() {
    if (!this.isEditing) {
      this.selectCurrentCell(true);
    }
  }

  override render() {
    const value = `${this.value ?? ''}`;
    return html`<input
      .value="${value}"
      @keydown="${this._keydown}"
      @blur="${this._blur}"
      @focus="${this._focus}"
      class="affine-database-number number"
    />`;
  }
}

columnRenderer.register({
  type: numberPureColumnConfig.type,
  icon: createIcon('DatabaseNumber'),
  cellRenderer: {
    view: createFromBaseCellRenderer(NumberCell),
    edit: createFromBaseCellRenderer(NumberCellEditing),
  },
});

export const numberColumnConfig = numberPureColumnConfig;

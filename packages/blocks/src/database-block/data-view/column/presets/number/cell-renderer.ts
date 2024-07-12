import { IS_MAC } from '@blocksuite/global/env';
import { baseTheme } from '@toeverything/theme';
import { css, html, unsafeCSS } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { stopPropagation } from '../../../utils/event.js';
import { createIcon } from '../../../utils/uni-icon.js';
import { BaseCellRenderer } from '../../base-cell.js';
import { createFromBaseCellRenderer } from '../../renderer.js';
import { numberColumnModelConfig } from './define.js';
import {
  type NumberFormat,
  formatNumber,
  parseNumber,
} from './utils/formatter.js';

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
      justify-content: flex-end;
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

  private _getFormattedString() {
    const enableNewFormatting = this.view.getFlag().enable_number_formatting;
    const decimals = (this.column.data.decimal as number) ?? 0;
    const formatMode = (this.column.data.format ?? 'number') as NumberFormat;
    return this.value
      ? enableNewFormatting
        ? formatNumber(this.value, formatMode, decimals)
        : this.value.toString()
      : '';
  }

  override render() {
    return html` <div class="affine-database-number number">
      ${this._getFormattedString()}
    </div>`;
  }
}

@customElement('affine-database-number-cell-editing')
export class NumberCellEditing extends BaseCellRenderer<number> {
  private _getFormattedString = (value: number) => {
    const enableNewFormatting = this.view.getFlag().enable_number_formatting;
    const decimals = (this.column.data.decimal as number) ?? 0;
    const formatMode = (this.column.data.format ?? 'number') as NumberFormat;
    return enableNewFormatting
      ? formatNumber(value, formatMode, decimals)
      : value.toString();
  };

  private _keydown = (e: KeyboardEvent) => {
    const ctrlKey = IS_MAC ? e.metaKey : e.ctrlKey;

    if (e.key.toLowerCase() === 'z' && ctrlKey) {
      e.stopPropagation();
      return;
    }

    if (e.key === 'Enter' && !e.isComposing) {
      requestAnimationFrame(() => {
        this.selectCurrentCell(false);
      });
    }
  };

  private _setValue = (str: string = this._inputEle.value) => {
    if (!str) {
      this.onChange(undefined);
      return;
    }

    const enableNewFormatting = this.view.getFlag().enable_number_formatting;
    const value = enableNewFormatting ? parseNumber(str) : parseFloat(str);
    if (isNaN(value)) {
      this._inputEle.value = this.value
        ? this._getFormattedString(this.value)
        : '';
      return;
    }

    this._inputEle.value = this._getFormattedString(value);
    this.onChange(value);
  };

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
      text-align: right;
    }

    .affine-database-number:focus {
      outline: none;
    }
  `;

  focusEnd = () => {
    const end = this._inputEle.value.length;
    this._inputEle.focus();
    this._inputEle.setSelectionRange(end, end);
  };

  _blur() {
    this.selectCurrentCell(false);
  }

  _focus() {
    if (!this.isEditing) {
      this.selectCurrentCell(true);
    }
  }

  override firstUpdated() {
    requestAnimationFrame(() => {
      this.focusEnd();
    });
  }

  override onExitEditMode() {
    this._setValue();
  }

  override render() {
    const formatted = this.value ? this._getFormattedString(this.value) : '';

    return html`<input
      type="text"
      autocomplete="off"
      .value="${formatted}"
      @keydown="${this._keydown}"
      @blur="${this._blur}"
      @focus="${this._focus}"
      class="affine-database-number number"
      @pointerdown="${stopPropagation}"
    />`;
  }

  @query('input')
  private accessor _inputEle!: HTMLInputElement;
}

export const numberColumnConfig = numberColumnModelConfig.renderConfig({
  icon: createIcon('DatabaseNumber'),
  cellRenderer: {
    view: createFromBaseCellRenderer(NumberCell),
    edit: createFromBaseCellRenderer(NumberCellEditing),
  },
});

import { baseTheme } from '@toeverything/theme';
import { css, html, unsafeCSS } from 'lit';
import { query } from 'lit/decorators.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import { textPropertyModelConfig } from './define.js';

export class TextCell extends BaseCellRenderer<string> {
  static override styles = css`
    affine-database-text-cell {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .affine-database-text {
      display: flex;
      align-items: center;
      height: 100%;
      width: 100%;
      padding: 0;
      border: none;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
      font-weight: 400;
      background-color: transparent;
    }
  `;

  override render() {
    return html` <div class="affine-database-text">${this.value ?? ''}</div>`;
  }
}
export class TextCellEditing extends BaseCellRenderer<string> {
  static override styles = css`
    affine-database-text-cell-editing {
      display: block;
      width: 100%;
      height: 100%;
      cursor: text;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .affine-database-text {
      display: flex;
      align-items: center;
      height: 100%;
      width: 100%;
      padding: 0;
      border: none;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
      font-weight: 400;
      background-color: transparent;
    }

    .affine-database-text:focus {
      outline: none;
    }
  `;

  private _keydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.isComposing) {
      this._setValue();
      setTimeout(() => {
        this.selectCurrentCell(false);
      });
    }
  };

  private _setValue = (str: string = this._inputEle.value) => {
    this._inputEle.value = `${this.value ?? ''}`;
    this.onChange(str);
  };

  focusEnd = () => {
    const end = this._inputEle.value.length;
    this._inputEle.focus();
    this._inputEle.setSelectionRange(end, end);
  };

  override firstUpdated() {
    this.focusEnd();
  }

  override onExitEditMode() {
    this._setValue();
  }

  override render() {
    return html`<input
      .value="${this.value ?? ''}"
      @keydown="${this._keydown}"
      class="affine-database-text"
    />`;
  }

  @query('input')
  private accessor _inputEle!: HTMLInputElement;
}

export const textPropertyConfig = textPropertyModelConfig.createPropertyMeta({
  icon: createIcon('TextIcon'),

  cellRenderer: {
    view: createFromBaseCellRenderer(TextCell),
    edit: createFromBaseCellRenderer(TextCellEditing),
  },
});

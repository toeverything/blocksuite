import { css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { BaseCellRenderer } from '../base-cell.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { titleColumnTypeName, titlePureColumnConfig } from './define.js';

@customElement('affine-database-title-cell')
export class TitleCell extends BaseCellRenderer<string> {
  static override styles = css`
    affine-database-title-cell {
      width: 100%;
      height: max-content;
      display: flex;
      align-items: center;
      white-space: pre-wrap;
    }

    .affine-database-title {
      display: flex;
      align-items: center;
      height: 100%;
      width: 100%;
      padding: 0;
      border: none;
      font-family: var(--affine-font-family);
      font-size: 12px;
      line-height: 20px;
      color: var(--affine-text-primary-color);
      font-weight: 400;
      background-color: transparent;
    }
  `;

  override render() {
    return html` <div class="affine-database-title">${this.value ?? ''}</div>`;
  }
}

@customElement('affine-database-title-cell-editing')
export class TitleCellEditing extends BaseCellRenderer<string> {
  static override styles = css`
    affine-database-title-cell-editing {
      width: 100%;
      height: max-content;
      cursor: text;
      display: flex;
      align-items: center;
      white-space: pre-wrap;
      position: relative;
    }

    .affine-database-title {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0;
      border: none;
      font-family: var(--affine-font-family);
      font-size: 12px;
      line-height: 20px;
      color: var(--affine-text-primary-color);
      font-weight: 400;
      background-color: transparent;
    }

    .affine-database-title:focus {
      outline: none;
    }

    textarea.affine-database-title {
      resize: none;
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 4px;
    }
  `;

  @query('textarea')
  private _inputEle!: HTMLTextAreaElement;

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
    this.onChange(str);
  };

  private _keydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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

  @state()
  text?: string;

  _input() {
    this.text = this._inputEle.value;
  }

  override render() {
    return html` <div class="affine-database-title" style="opacity: 0">
        ${this.text ?? this.value}
      </div>
      <textarea
        @keydown="${this._keydown}"
        @blur="${this._blur}"
        @focus="${this._focus}"
        @input="${this._input}"
        class="affine-database-title"
      >
${this.value ?? ''}</textarea
      >`;
  }
}

columnRenderer.register({
  type: titleColumnTypeName,
  cellRenderer: {
    view: createFromBaseCellRenderer(TitleCell),
    edit: createFromBaseCellRenderer(TitleCellEditing),
  },
});

export const titleColumnConfig = titlePureColumnConfig;

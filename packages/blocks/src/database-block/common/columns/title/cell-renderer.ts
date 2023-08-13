import { EditIcon } from '@blocksuite/global/config';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, type TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { createIcon } from '../../../../components/icon/uni-icon.js';
import { popSideDetail } from '../../detail/layout.js';
import { BaseCellRenderer } from '../base-cell.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { titleColumnTypeName, titlePureColumnConfig } from './define.js';

@customElement('data-view-title-cell')
export class TitleCell extends BaseCellRenderer<string> {
  static override styles = css`
    data-view-title-cell {
      width: 100%;
      height: max-content;
      display: flex;
      align-items: center;
      position: relative;
    }

    .data-view-title {
      position: relative;
      width: 100%;
      word-break: break-all;
    }

    .data-view-title,
    .data-view-title textarea {
      font-family: var(--affine-font-family);
      font-size: 12px;
      line-height: 20px;
      color: var(--affine-text-primary-color);
      font-weight: 400;
    }

    data-view-title-cell:hover .open-detail {
      visibility: visible;
    }

    .open-detail {
      visibility: hidden;
      display: flex;
      align-items: center;
      padding: 2px 6px;
      box-shadow: 0px 0px 4px 0px rgba(66, 65, 73, 0.14);
      gap: 4px;
      border-radius: 4px;
      font-size: 12px;
      line-height: 20px;
      cursor: pointer;
      background-color: var(--affine-background-primary-color);
    }

    .open-detail:hover {
      background-color: var(--affine-hover-color);
    }

    .edit-detail-icon {
      display: flex;
      align-items: center;
    }

    .edit-detail-icon svg {
      fill: var(--affine-icon-color);
      width: 16px;
      height: 16px;
    }
  `;
  _clickOpenDetail = (e: MouseEvent) => {
    e.stopPropagation();
    popSideDetail({
      view: this.column.dataViewManager,
      rowId: this.rowId,
    });
  };

  override render() {
    return html`<span class="data-view-title" style="white-space: pre-wrap"
        >${this.value ?? ''}</span
      >
      <div class="open-detail" @click="${this._clickOpenDetail}">
        <div class="edit-detail-icon">${EditIcon}</div>
        Edit
      </div> `;
  }
}

@customElement('data-view-title-cell-editing')
export class TitleCellEditing extends BaseCellRenderer<string> {
  static override styles = css`
    data-view-title-cell-editing {
      width: 100%;
      height: max-content;
      cursor: text;
      display: flex;
      align-items: center;
    }

    .data-view-title textarea {
      resize: none;
      border: none;
      outline: none;
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 100%;
      padding: 0;
      background-color: transparent;
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
    if (str == this.value) {
      return;
    }
    if (!str) {
      this.onChange(undefined);
      return;
    }
    this.onChange(str);
  };

  private _keydown = (e: KeyboardEvent) => {
    this.rectChanged?.();
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
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
    return html` <div class="data-view-title">
      <span style="opacity: 0;white-space: pre-wrap"
        >${this.text ?? this.value}<span> </span></span
      ><textarea
        @keydown="${this._keydown}"
        @blur="${this._blur}"
        @focus="${this._focus}"
        @input="${this._input}"
        .value=${this.value ?? ''}
      ></textarea>
    </div>`;
  }
}

@customElement('data-view-title-detail-cell')
export class TitleDetailCell extends BaseCellRenderer<string> {
  static override styles = css``;

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(
      this,
      'keydown',
      e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
      },
      true
    );
  }

  extra(): {
    model: BaseBlockModel;
    result: TemplateResult;
  } {
    return this.column.getExtra(this.rowId) as never;
  }

  override render() {
    return this.extra().result;
  }
}

columnRenderer.register({
  type: titleColumnTypeName,
  icon: createIcon('TextIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(TitleCell),
    edit: createFromBaseCellRenderer(TitleCellEditing),
  },
  detailCellRenderer: {
    view: createFromBaseCellRenderer(TitleDetailCell),
  },
});

export const titleColumnConfig = titlePureColumnConfig;

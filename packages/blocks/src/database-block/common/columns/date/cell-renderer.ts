import format from 'date-fns/format/index.js';
import { css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { createIcon } from '../../../../components/icon/uni-icon.js';
import { BaseCellRenderer } from '../base-cell.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { datePureColumnConfig } from './define.js';

@customElement('affine-database-date-cell')
export class DateCell extends BaseCellRenderer<number> {
  static override styles = css`
    affine-database-date-cell {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
    }

    .affine-database-date {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0;
      border: none;
      font-family: var(--affine-font-family);
      color: var(--affine-text-primary-color);
      font-weight: 400;
      background-color: transparent;
      font-size: var(--data-view-cell-text-size);
      line-height: var(--data-view-cell-text-line-height);
      height: var(--data-view-cell-text-line-height);
    }
  `;

  override render() {
    const value = this.value ? format(new Date(this.value), 'yyyy/MM/dd') : '';
    return html` <div class="affine-database-date date">${value}</div>`;
  }
}

@customElement('affine-database-date-cell-editing')
export class DateCellEditing extends BaseCellRenderer<number> {
  static override styles = css`
    affine-database-date-cell-editing {
      width: 100%;
      height: 100%;
      cursor: text;
      display: flex;
      align-items: center;
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

columnRenderer.register({
  type: datePureColumnConfig.type,
  icon: createIcon('DateTime'),
  cellRenderer: {
    view: createFromBaseCellRenderer(DateCell),
    edit: createFromBaseCellRenderer(DateCellEditing),
  },
});

export const dateColumnConfig = datePureColumnConfig;

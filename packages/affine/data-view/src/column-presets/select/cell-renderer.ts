import { html } from 'lit/static-html.js';

import { BaseCellRenderer } from '../../core/column/index.js';
import { createFromBaseCellRenderer } from '../../core/column/renderer.js';
import {
  popTagSelect,
  type SelectTag,
} from '../../core/utils/tags/multi-tag-select.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import { type SelectColumnData, selectColumnModelConfig } from './define.js';

export class SelectCell extends BaseCellRenderer<string[], SelectColumnData> {
  override render() {
    const value = this.value ? [this.value] : [];
    return html`
      <affine-multi-tag-view
        .value="${value}"
        .options="${this.column.data$.value.options}"
      ></affine-multi-tag-view>
    `;
  }
}

export class SelectCellEditing extends BaseCellRenderer<
  string,
  SelectColumnData
> {
  private popTagSelect = () => {
    this._disposables.add({
      dispose: popTagSelect(
        this.querySelector('affine-multi-tag-view') ?? this,
        {
          mode: 'single',
          options: this._options,
          onOptionsChange: this._onOptionsChange,
          value: this._value,
          onChange: this._onChange,
          onComplete: this._editComplete,
          minWidth: 400,
        }
      ),
    });
  };

  _editComplete = () => {
    this.selectCurrentCell(false);
  };

  _onChange = ([id]: string[]) => {
    this.onChange(id);
  };

  _onOptionsChange = (options: SelectTag[]) => {
    this.column.updateData(data => {
      return {
        ...data,
        options,
      };
    });
  };

  get _options(): SelectTag[] {
    return this.column.data$.value.options;
  }

  get _value() {
    const value = this.value;
    return value ? [value] : [];
  }

  override firstUpdated() {
    this.popTagSelect();
  }

  override render() {
    return html`
      <affine-multi-tag-view
        .value="${this._value}"
        .options="${this._options}"
      ></affine-multi-tag-view>
    `;
  }
}

export const selectColumnConfig = selectColumnModelConfig.createColumnMeta({
  icon: createIcon('SingleSelectIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(SelectCell),
    edit: createFromBaseCellRenderer(SelectCellEditing),
  },
});

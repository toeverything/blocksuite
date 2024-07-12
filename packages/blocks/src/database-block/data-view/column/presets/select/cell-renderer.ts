import { customElement } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { SelectColumnData } from '../../types.js';

import '../../../utils/tags/multi-tag-select.js';
import {
  type SelectTag,
  popTagSelect,
} from '../../../utils/tags/multi-tag-select.js';
import '../../../utils/tags/multi-tag-view.js';
import { createIcon } from '../../../utils/uni-icon.js';
import { BaseCellRenderer } from '../../base-cell.js';
import { createFromBaseCellRenderer } from '../../renderer.js';
import { selectColumnModelConfig } from './define.js';

@customElement('affine-database-select-cell')
export class SelectCell extends BaseCellRenderer<string[], SelectColumnData> {
  override render() {
    const value = this.value ? [this.value] : [];
    return html`
      <affine-multi-tag-view
        .value="${value}"
        .options="${this.column.data.options}"
      ></affine-multi-tag-view>
    `;
  }
}

@customElement('affine-database-select-cell-editing')
export class SelectCellEditing extends BaseCellRenderer<
  string,
  SelectColumnData
> {
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

  private popTagSelect = () => {
    this._disposables.add({
      dispose: popTagSelect(
        this.querySelector('affine-multi-tag-view') ?? this,
        {
          minWidth: 400,
          mode: 'single',
          onChange: this._onChange,
          onComplete: this._editComplete,
          onOptionsChange: this._onOptionsChange,
          options: this._options,
          value: this._value,
        }
      ),
    });
  };

  get _options(): SelectTag[] {
    return this.column.data.options;
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

export const selectColumnConfig = selectColumnModelConfig.renderConfig({
  cellRenderer: {
    edit: createFromBaseCellRenderer(SelectCellEditing),
    view: createFromBaseCellRenderer(SelectCell),
  },
  icon: createIcon('DatabaseSelect'),
});

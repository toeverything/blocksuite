import '../../../../components/tags/multi-tag-select.js';
import '../../../../components/tags/multi-tag-view.js';

import { html, literal } from 'lit/static-html.js';

import type { SelectTag } from '../../../../components/tags/multi-tag-select.js';
import { popTagSelect } from '../../../../components/tags/multi-tag-select.js';
import type { SelectColumnData } from '../../../common/column-manager.js';
import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';

class SelectCell extends DatabaseCellElement<string[], SelectColumnData> {
  static override tag = literal`affine-database-select-cell`;

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

export class SelectCellEditing extends DatabaseCellElement<
  string,
  SelectColumnData
> {
  static override tag = literal`affine-database-select-cell-editing`;

  get _options(): SelectTag[] {
    return this.column.data.options;
  }

  get _value() {
    const value = this.value;
    return value ? [value] : [];
  }

  _onChange = ([id]: string[]) => {
    this.onChange(id);
  };

  _editComplete = () => {
    this._setEditing(false);
  };
  _onOptionsChange = (options: SelectTag[]) => {
    this.column.updateData(data => {
      return {
        ...data,
        options,
      };
    });
  };

  override firstUpdated() {
    this.popTagSelect();
  }

  private popTagSelect = () => {
    popTagSelect(this, {
      mode: 'single',
      options: this._options,
      onOptionsChange: this._onOptionsChange,
      value: this._value,
      onChange: this._onChange,
      onComplete: this._editComplete,
      minWidth: 400,
    });
  };

  override render() {
    return html`
      <affine-multi-tag-view
        .value="${this._value}"
        .options="${this._options}"
      ></affine-multi-tag-view>
    `;
  }
}

export const SelectColumnRenderer = defineColumnRenderer(
  'select',
  {
    Cell: SelectCell,
    CellEditing: SelectCellEditing,
  },
  {
    displayName: 'Select',
  }
);

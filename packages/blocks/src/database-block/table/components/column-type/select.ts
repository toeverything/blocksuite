import './components/multi-tag-select.js';
import './components/multi-tag-view.js';

import { html, literal } from 'lit/static-html.js';

import type { SelectColumnData } from '../../../common/column-manager.js';
import type { SelectTag } from '../../../types.js';
import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';

class SelectCell extends DatabaseCellElement<string[], SelectColumnData> {
  static override tag = literal`affine-database-select-cell`;

  override render() {
    const value = this.value ? [this.value] : [];
    return html`
      <affine-database-multi-tag-view
        .value="${value}"
        .options="${this.columnData.options}"
      ></affine-database-multi-tag-view>
    `;
  }
}

export class SelectCellEditing extends DatabaseCellElement<
  string,
  SelectColumnData
> {
  static override tag = literal`affine-database-select-cell-editing`;

  get _options(): SelectTag[] {
    return this.columnData.options;
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

  _updateOptions = (update: (options: SelectTag[]) => SelectTag[]) => {
    this.updateColumnData(data => {
      return {
        ...data,
        options: update(data.options),
      };
    });
  };

  _newTag = (tag: SelectTag) => {
    this._updateOptions(options => {
      if (options.find(v => v.value === tag.value) == null) {
        return [...options, tag];
      }
      return options;
    });
  };

  _deleteTag = (id: string) => {
    this._updateOptions(options => options.filter(v => v.id !== id));
  };

  _changeTag = (tag: SelectTag) => {
    this._updateOptions(options =>
      options.map(v => (v.id === tag.id ? tag : v))
    );
  };

  override render() {
    return html`
      <affine-database-multi-tag-select
        .options="${this._options}"
        .value="${this._value}"
        .onChange="${this._onChange}"
        .editComplete="${this._editComplete}"
        .newTag="${this._newTag}"
        .deleteTag="${this._deleteTag}"
        .changeTag="${this._changeTag}"
        .container="${this.parentElement}"
        .page="${this.page}"
      >
      </affine-database-multi-tag-select>
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

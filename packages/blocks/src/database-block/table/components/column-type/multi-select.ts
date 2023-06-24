import './components/multi-tag-view.js';
import './components/multi-tag-select.js';

import { html, literal } from 'lit/static-html.js';

import type { SelectColumnData } from '../../../common/column-manager.js';
import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';
import type { SelectTag } from '../../types.js';
import { SelectMode } from '../../types.js';

class MultiSelectCell extends DatabaseCellElement<string[], SelectColumnData> {
  static override tag = literal`affine-database-multi-select-cell`;

  override render() {
    return html`
      <affine-database-multi-tag-view
        .value="${this.value ?? []}"
        .options="${this.column.data.options}"
      ></affine-database-multi-tag-view>
    `;
  }
}

class MultiSelectCellEditing extends DatabaseCellElement<
  string[],
  SelectColumnData
> {
  static override tag = literal`affine-database-multi-select-cell-editing`;

  get _options(): SelectTag[] {
    return this.column.data.options;
  }

  get _value() {
    return this.value ?? [];
  }

  _onChange = (ids: string[]) => {
    this.onChange(ids);
  };

  _editComplete = () => {
    this._setEditing(false);
  };

  _updateOptions = (update: (options: SelectTag[]) => SelectTag[]) => {
    this.column.updateData(data => {
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
        .mode="${SelectMode.Multi}"
        style="width: 400px;"
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

export const MultiSelectColumnRenderer = defineColumnRenderer(
  'multi-select',
  {
    Cell: MultiSelectCell,
    CellEditing: MultiSelectCellEditing,
  },
  {
    displayName: 'Multi Select',
  }
);

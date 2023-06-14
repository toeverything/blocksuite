import './components/multi-tag-select.js';
import './components/multi-tag-view.js';

import { html, literal } from 'lit/static-html.js';

import type { SelectColumnData } from '../../../common/column-manager.js';
import type { SelectTag } from '../../../types.js';
import type { TableViewCell } from '../../register.js';
import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';

class SelectCell
  extends DatabaseCellElement<string[], SelectColumnData>
  implements TableViewCell
{
  static override tag = literal`affine-database-select-cell`;
  cellType = 'select' as const;

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

export class SelectCellEditing
  extends DatabaseCellElement<string, SelectColumnData>
  implements TableViewCell
{
  static override tag = literal`affine-database-select-cell-editing`;
  cellType = 'select' as const;

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
    this.setEditing(false);
  };

  _updateOptions = (update: (options: SelectTag[]) => SelectTag[]) => {
    this.updateColumnProperty(oldProperty => {
      return {
        data: {
          ...oldProperty.data,
          options: update(oldProperty.data.options),
        },
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
        .container="${this.container}"
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

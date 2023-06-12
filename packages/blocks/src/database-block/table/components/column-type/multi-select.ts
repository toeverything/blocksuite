import { customElement } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';

import type { SelectColumnData } from '../../../common/column-manager.js';
import {
  DatabaseCellElement,
  defineColumnRenderer,
  type TableViewCell,
} from '../../register.js';
import type { SelectTag } from '../../types.js';
import { SelectMode } from '../../types.js';

@customElement('affine-database-multi-select-cell')
class MultiSelectCell
  extends DatabaseCellElement<string[], SelectColumnData>
  implements TableViewCell
{
  static override tag = literal`affine-database-multi-select-cell`;
  cellType = 'multi-select' as const;

  override render() {
    return html`
      <affine-database-multi-tag-view
        .value=${this.cell?.value ?? []}
        .options=${this.column.data.options}
        .setHeight=${this.rowHost.setHeight}
      ></affine-database-multi-tag-view>
    `;
  }
}

@customElement('affine-database-multi-select-cell-editing')
class MultiSelectCellEditing
  extends DatabaseCellElement<string[], SelectColumnData>
  implements TableViewCell
{
  static override tag = literal`affine-database-multi-select-cell-editing`;
  cellType = 'multi-select' as const;

  get _options(): SelectTag[] {
    return this.column.data.options;
  }

  get _value() {
    return this.cell?.value ?? [];
  }

  _onChange = (ids: string[]) => {
    this.rowHost.setValue(ids);
  };

  _editComplete = () => {
    this.rowHost.setEditing(false);
  };

  _updateOptions = (update: (options: SelectTag[]) => SelectTag[]) => {
    this.rowHost.updateColumnProperty(oldProperty => {
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
        .mode="${SelectMode.Multi}"
        .options="${this._options}"
        .value="${this._value}"
        .onChange="${this._onChange}"
        .editComplete="${this._editComplete}"
        .newTag="${this._newTag}"
        .deleteTag="${this._deleteTag}"
        .changeTag="${this._changeTag}"
        .container="${this.rowHost}"
        .databaseModel="${this.databaseModel}"
      >
      </affine-database-multi-tag-select>
    `;
  }
}

export const MultiSelectColumnRenderer = defineColumnRenderer(
  'multi-select',
  () => ({
    selection: [] as SelectTag[],
  }),
  () => [] as SelectTag[],
  {
    Cell: MultiSelectCell,
    CellEditing: MultiSelectCellEditing,
  },
  {
    displayName: 'Multi Select',
  }
);

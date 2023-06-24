import '../../../../components/tags/multi-tag-select.js';
import '../../../../components/tags/multi-tag-view.js';

import { html, literal } from 'lit/static-html.js';

import type { SelectColumnData } from '../../../common/column-manager.js';
import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';
import type { SelectTag } from '../../types.js';

class MultiSelectCell extends DatabaseCellElement<string[], SelectColumnData> {
  static override tag = literal`affine-database-multi-select-cell`;

  override render() {
    return html`
      <affine-multi-tag-view
        .value="${this.value ?? []}"
        .options="${this.column.data.options}"
      ></affine-multi-tag-view>
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

  _onOptionsChange = (options: SelectTag[]) => {
    this.column.updateData(data => {
      return {
        ...data,
        options,
      };
    });
  };

  override render() {
    return html`
      <affine-multi-tag-select
        style="width: 400px;"
        .options="${this._options}"
        .onOptionsChange="${this._onOptionsChange}"
        .value="${this._value}"
        .onChange="${this._onChange}"
        .editComplete="${this._editComplete}"
        .container="${this.parentElement}"
        .page="${this.page}"
      >
      </affine-multi-tag-select>
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

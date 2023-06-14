import './multi-tag-select.js';

import { customElement } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';

import type { SelectColumnData } from '../../../../common/column-manager.js';
import { DatabaseCellElement } from '../../../register.js';
import type { SelectTag } from '../../../types.js';

@customElement('affine-database-select-cell-editing')
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

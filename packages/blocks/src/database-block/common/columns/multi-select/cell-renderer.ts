import '../../../../components/tags/multi-tag-select.js';
import '../../../../components/tags/multi-tag-view.js';

import { customElement } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { createIcon } from '../../../../components/icon/uni-icon.js';
import type { SelectTag } from '../../../../components/tags/multi-tag-select.js';
import { popTagSelect } from '../../../../components/tags/multi-tag-select.js';
import { BaseCellRenderer } from '../base-cell.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import type { SelectColumnData } from '../types.js';
import { multiSelectPureColumnConfig } from './define.js';

@customElement('affine-database-multi-select-cell')
export class MultiSelectCell extends BaseCellRenderer<
  string[],
  SelectColumnData
> {
  override render() {
    return html`
      <affine-multi-tag-view
        .value="${this.value ?? []}"
        .options="${this.column.data.options}"
      ></affine-multi-tag-view>
    `;
  }
}
@customElement('affine-database-multi-select-cell-editing')
export class MultiSelectCellEditing extends BaseCellRenderer<
  string[],
  SelectColumnData
> {
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
    this.selectCurrentCell(false);
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

columnRenderer.register({
  type: multiSelectPureColumnConfig.type,
  icon: createIcon('DatabaseMultiSelect'),
  cellRenderer: {
    view: createFromBaseCellRenderer(MultiSelectCell),
    edit: createFromBaseCellRenderer(MultiSelectCellEditing),
  },
});

export const multiSelectColumnConfig = multiSelectPureColumnConfig;

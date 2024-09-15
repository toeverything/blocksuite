import { html } from 'lit/static-html.js';

import type { SelectColumnData } from '../select/define.js';

import { BaseCellRenderer } from '../../core/column/index.js';
import { createFromBaseCellRenderer } from '../../core/column/renderer.js';
import {
  popTagSelect,
  type SelectTag,
} from '../../core/utils/tags/multi-tag-select.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import { multiSelectColumnModelConfig } from './define.js';

export class MultiSelectCell extends BaseCellRenderer<
  string[],
  SelectColumnData
> {
  override render() {
    return html`
      <affine-multi-tag-view
        .value="${Array.isArray(this.value) ? this.value : []}"
        .options="${this.column.data$.value.options}"
      ></affine-multi-tag-view>
    `;
  }
}

export class MultiSelectCellEditing extends BaseCellRenderer<
  string[],
  SelectColumnData
> {
  private popTagSelect = () => {
    this._disposables.add({
      dispose: popTagSelect(
        this.querySelector('affine-multi-tag-view') ?? this,
        {
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

  _onChange = (ids: string[]) => {
    this.onChange(ids);
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
    return this.value ?? [];
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

export const multiSelectColumnConfig =
  multiSelectColumnModelConfig.createColumnMeta({
    icon: createIcon('MultiSelectIcon'),
    cellRenderer: {
      view: createFromBaseCellRenderer(MultiSelectCell),
      edit: createFromBaseCellRenderer(MultiSelectCellEditing),
    },
  });

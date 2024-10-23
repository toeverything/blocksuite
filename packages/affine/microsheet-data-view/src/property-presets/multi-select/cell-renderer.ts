import { popupTargetFromElement } from '@blocksuite/affine-components/context-menu';
import { html } from 'lit/static-html.js';

import type { SelectPropertyData } from '../select/define.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import {
  popTagSelect,
  type SelectTag,
} from '../../core/utils/tags/multi-tag-select.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import { multiSelectPropertyModelConfig } from './define.js';

export class MultiSelectCell extends BaseCellRenderer<
  string[],
  SelectPropertyData
> {
  override render() {
    return html`
      <affine-microsheet-multi-tag-view
        .value="${Array.isArray(this.value) ? this.value : []}"
        .options="${this.property.data$.value.options}"
      ></affine-microsheet-multi-tag-view>
    `;
  }
}

export class MultiSelectCellEditing extends BaseCellRenderer<
  string[],
  SelectPropertyData
> {
  private popTagSelect = () => {
    this._disposables.add({
      dispose: popTagSelect(
        popupTargetFromElement(
          this.querySelector('affine-microsheet-multi-tag-view') ?? this
        ),
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
    this.property.dataUpdate(data => {
      return {
        ...data,
        options,
      };
    });
  };

  get _options(): SelectTag[] {
    return this.property.data$.value.options;
  }

  get _value() {
    return this.value ?? [];
  }

  override firstUpdated() {
    this.popTagSelect();
  }

  override render() {
    return html`
      <affine-microsheet-multi-tag-view
        .value="${this._value}"
        .options="${this._options}"
      ></affine-microsheet-multi-tag-view>
    `;
  }
}

export const multiSelectPropertyConfig =
  multiSelectPropertyModelConfig.createPropertyMeta({
    icon: createIcon('MultiSelectIcon'),
    cellRenderer: {
      view: createFromBaseCellRenderer(MultiSelectCell),
      edit: createFromBaseCellRenderer(MultiSelectCellEditing),
    },
  });

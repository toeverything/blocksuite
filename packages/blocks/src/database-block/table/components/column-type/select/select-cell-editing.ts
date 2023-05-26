import './select-option.js';

import {
  DatabaseDone,
  DatabaseSearchClose,
  MoreHorizontalIcon,
  PlusIcon,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { nanoid } from '@blocksuite/store';
import { createPopper } from '@popperjs/core';
import { css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html, literal } from 'lit/static-html.js';

import { getService } from '../../../../../__internal__/service.js';
import { getTagColor, onClickOutside } from '../../../../utils.js';
import {
  SELECT_EDIT_POPUP_WIDTH,
  SELECT_TAG_NAME_MAX_LENGTH,
} from '../../../consts.js';
import { DatabaseCellElement } from '../../../register.js';
import type { SelectTag } from '../../../types.js';
import { SelectMode, type SelectTagActionType } from '../../../types.js';
import { getCellCoord } from '../../selection/utils.js';
import type { SelectOption } from './select-option.js';
import { SelectActionPopup } from './select-option-popup.js';

const KEYS_WHITE_LIST = ['Enter', 'ArrowUp', 'ArrowDown'];

const styles = css`
  affine-database-select-cell-editing {
    z-index: 2;
    border: 1px solid var(--affine-border-color);
    border-radius: 4px;
    background: var(--affine-background-primary-color);
    box-shadow: var(--affine-shadow-2);
  }
  .affine-database-select-cell-select {
    font-size: var(--affine-font-sm);
  }
  .select-input-container {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 44px;
    padding: 10px 8px;
    background: var(--affine-hover-color);
  }
  .select-input {
    flex: 1 1 0%;
    height: 24px;
    border: none;
    font-family: var(--affine-font-family);
    color: inherit;
    background: transparent;
    line-height: 24px;
  }
  .select-input:focus {
    outline: none;
  }
  .select-input::placeholder {
    color: var(--affine-placeholder-color);
  }
  .select-option-container {
    padding: 8px;
    color: var(--affine-black-90);
  }
  .select-option-container-header {
    padding: 8px 0px;
    color: var(--affine-black-60);
  }
  .select-input-container .select-selected {
    display: flex;
    align-items: center;
    padding: 2px 10px;
    gap: 10px;
    height: 28px;
    background: var(--affine-tag-white);
    border-radius: 4px;
    color: var(--affine-black-90);
    background: var(--affine-tertiary-color);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .select-selected-text {
    width: calc(100% - 16px);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .select-selected > .close-icon {
    display: flex;
    align-items: center;
  }

  .select-option-new {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 36px;
    padding: 4px;
    gap: 5px;
    border-radius: 4px;
    background: var(--affine-selected-color);
  }
  .select-option-new-text {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    height: 28px;
    padding: 2px 10px;
    border-radius: 4px;
    background: var(--affine-tag-red);
  }
  .select-option-new-icon {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    color: var(--affine-text-primary-color);
  }
  .select-option-new-icon svg {
    width: 16px;
    height: 16px;
  }

  .select-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 36px;
    padding: 4px;
    border-radius: 4px;
    margin-bottom: 4px;
    cursor: pointer;
  }
  .select-option.selected,
  .select-option:hover {
    background: var(--affine-hover-color);
  }
  .select-option:hover .select-option-icon {
    display: flex;
  }
  .select-option-text-container {
    width: calc(100% - 28px);
    overflow: hidden;
  }
  .select-option-icon {
    display: none;
    justify-content: center;
    align-items: center;
    width: 28px;
    height: 28px;
    border-radius: 3px;
    cursor: pointer;
  }
  .select-option-icon:hover {
    background: var(--affine-hover-color);
  }
  .select-option-icon svg {
    width: 16px;
    height: 16px;
    pointer-events: none;
  }
  .editing {
    background: var(--affine-hover-color);
  }
  .editing .select-option-text [data-virgo-text='true'] {
    display: block;
    white-space: pre !important;
    overflow: unset;
    text-overflow: unset;
  }
  .editing .select-option-icon {
    display: flex;
    background: var(--affine-hover-background);
  }
`;

@customElement('affine-database-select-cell-editing')
export class SelectCellEditing extends DatabaseCellElement<SelectTag[]> {
  value: SelectTag | undefined = undefined;

  static override styles = styles;
  static override tag = literal`affine-database-select-cell-editing`;
  override cellType = 'select' as const;

  @property()
  mode: SelectMode = SelectMode.Single;

  @query('.select-input')
  private _selectInput!: HTMLInputElement;

  @state()
  private _inputValue = '';

  @state()
  private _editingIndex = -1;

  @state()
  private _selectedOptionIndex = -1;

  @query('.select-option-container')
  private _selectOptionContainer!: HTMLDivElement;
  private _selectColor: string | undefined = undefined;

  get isSingleMode() {
    return this.mode === SelectMode.Single;
  }

  get selectionList() {
    return this.column.selection as SelectTag[];
  }

  protected override firstUpdated() {
    this.style.width = `${SELECT_EDIT_POPUP_WIDTH}px`;
    this._selectInput.focus();
  }

  override connectedCallback() {
    super.connectedCallback();

    this._disposables.addFromEvent(
      document.body,
      'keydown',
      this._onSelectOption
    );

    createPopper(
      {
        getBoundingClientRect: () => {
          const rect = this.rowHost.getBoundingClientRect();
          rect.y = rect.y - rect.height - 2;
          rect.x = rect.x - 2;
          return rect;
        },
      },
      this,
      {
        placement: 'bottom-start',
        strategy: 'fixed',
      }
    );
  }

  protected override updated(_changedProperties: Map<PropertyKey, unknown>) {
    super.updated(_changedProperties);

    if (_changedProperties.has('cell')) {
      this._selectInput.focus();
    }
  }

  private _onSelectOption = (event: KeyboardEvent) => {
    const key = event.key;

    if (KEYS_WHITE_LIST.indexOf(key) <= -1) return;
    event.preventDefault();
    event.stopPropagation();

    const maxIndex = this.selectionList.length - 1;
    if (this._selectedOptionIndex === maxIndex && key === 'ArrowDown') {
      this._selectedOptionIndex = 0;
      return;
    }
    if (this._selectedOptionIndex <= 0 && key === 'ArrowUp') {
      this._selectedOptionIndex = maxIndex;
      return;
    }

    if (key === 'ArrowDown') {
      this._selectedOptionIndex++;
    } else if (key === 'ArrowUp') {
      this._selectedOptionIndex--;
    } else if (key === 'Enter') {
      const index = this._selectedOptionIndex;
      if (index === -1) return;
      if (this.isSingleMode) {
        this._selectedOptionIndex = -1;
      }

      const selected = this.cell?.value ?? [];
      const currentSelection = this.selectionList[index];
      this._onSelect(selected, currentSelection);
      this._selectCell();
    }
  };

  private _selectCell = (exitEditing = false) => {
    if (this.isSingleMode || exitEditing) this.rowHost.setEditing(false);

    const service = getService('affine:database');
    const cell =
      this._selectOptionContainer.closest<HTMLElement>('.database-cell');
    assertExists(cell);
    const coord = getCellCoord(cell, this.databaseModel.id, 'Escape');
    service.setCellSelection({
      type: 'select',
      databaseId: this.databaseModel.id,
      coords: [coord],
    });
  };

  private _onDeleteSelected = (
    selectedValue: SelectTag[],
    value: SelectTag
  ) => {
    const filteredValue = selectedValue.filter(item => item !== value);
    this.rowHost.setValue(filteredValue);
  };

  private _onSelectSearchInput = (event: KeyboardEvent) => {
    const value = (event.target as HTMLInputElement).value;
    this._inputValue = value;
    if (!this._selectColor) {
      this._selectColor = getTagColor();
    }
  };

  private _onSelectOrAdd = (
    event: KeyboardEvent,
    selectedValue: SelectTag[]
  ) => {
    const inputValue = this._inputValue.trim();

    if (event.key === 'Backspace' && inputValue === '') {
      this._onDeleteSelected(
        selectedValue,
        selectedValue[selectedValue.length - 1]
      );
    } else if (event.key === 'Enter' && inputValue !== '') {
      if (this._selectedOptionIndex !== -1) return;
      const selectTag = this.selectionList.find(
        item => item.value === inputValue
      );
      if (selectTag) {
        this._onSelect(selectedValue, selectTag);
      } else {
        this._onAddSelection(selectedValue);
      }
    } else if (event.key === 'Escape') {
      this._selectCell(true);
    }
  };

  private _onSelect = (selectedValue: SelectTag[], select: SelectTag) => {
    // when editing, do not select
    if (this._editingIndex !== -1) return;

    const isExist =
      selectedValue.findIndex(item => item.value === select.value) > -1;
    if (isExist) return;

    this.value = select;
    const isSelected = selectedValue.indexOf(this.value) > -1;
    if (!isSelected) {
      const newValue = this.isSingleMode
        ? [this.value]
        : [...selectedValue, this.value];
      this.rowHost.setValue(newValue);
      if (this.isSingleMode) this.rowHost.setEditing(false);

      if (!this.isSingleMode && newValue.length > 1) {
        this._calcRowHostHeight();
      }
    }
  };

  private _onAddSelection = (selectedValue: SelectTag[]) => {
    let value = this._inputValue.trim();
    if (value === '') return;
    if (value.length > SELECT_TAG_NAME_MAX_LENGTH) {
      value = value.slice(0, SELECT_TAG_NAME_MAX_LENGTH);
    }

    const tagColor = this._selectColor ?? getTagColor();
    this._selectColor = undefined;
    const newSelect = { id: nanoid(), value, color: tagColor };

    this.rowHost.updateColumnProperty(property => {
      const selection = property.selection as SelectTag[];
      return {
        ...property,
        selection:
          selection.findIndex(select => select.value === value) === -1
            ? [...selection, newSelect]
            : selection,
      };
    });

    const newValue = this.isSingleMode
      ? [newSelect]
      : [...selectedValue, newSelect];
    this.rowHost.setValue(newValue);
    this.rowHost.setEditing(false);

    if (!this.isSingleMode && newValue.length > 1) {
      this._calcRowHostHeight();
    }
  };

  private _calcRowHostHeight = () => {
    setTimeout(() => {
      const shadowRoot =
        this.rowHost.shadowRoot?.children[0].shadowRoot?.children[0].shadowRoot;
      const selectCell = shadowRoot?.querySelector(
        '.affine-database-select-cell-container'
      );
      if (selectCell) {
        const { height } = selectCell.getBoundingClientRect();
        this.rowHost.setHeight(height);
      }
    });
  };

  private _onSelectAction = (type: SelectTagActionType, index: number) => {
    if (type === 'rename') {
      this._setEditingIndex(index);
      return;
    }

    if (type === 'delete') {
      this.databaseModel.updateColumn({
        ...this.column,
        selection: this.selectionList.filter((_, i) => i !== index),
      });
      const select = this.selectionList[index];
      this.databaseModel.deleteSelectedCellTag(this.column.id, select);
      return;
    }
  };

  private _showSelectAction = (index: number) => {
    const selectOption = this.querySelectorAll('.select-option').item(index);
    assertExists(selectOption);

    const action = new SelectActionPopup();
    action.onAction = this._onSelectAction;
    action.index = index;
    selectOption.appendChild(action);
    const onClose = () => action.remove();
    action.onClose = onClose;

    createPopper(
      {
        getBoundingClientRect: () => {
          const optionIcon = selectOption.querySelector('.select-option-icon');
          assertExists(optionIcon);
          const { height } = action.getBoundingClientRect();
          const rect = optionIcon.getBoundingClientRect();
          rect.y = rect.y + height + 36;
          rect.x = rect.x + 33;
          return rect;
        },
      },
      action,
      {
        placement: 'bottom-end',
      }
    );
    onClickOutside(selectOption as HTMLElement, onClose, 'mousedown');
  };

  private _onSaveSelectionName = (index: number) => {
    const selectOption = this._selectOptionContainer
      .querySelectorAll('affine-database-select-option')
      .item(index) as SelectOption;

    const selection = [...this.selectionList];
    const value = selectOption.getSelectionValue();
    const isExist =
      selection.findIndex(
        (select, i) => i !== index && select.value === value
      ) > -1;
    if (isExist) return;

    const oldSelect = selection[index];
    const newSelect = { ...oldSelect, value };
    selection[index] = newSelect;
    this.databaseModel.updateColumn({
      ...this.column,
      selection,
    });
    this.databaseModel.renameSelectedCellTag(
      this.column.id,
      oldSelect,
      newSelect
    );

    this._setEditingIndex(-1);
  };

  private _setEditingIndex = (index: number) => {
    this._editingIndex = index;
  };

  override render() {
    const filteredSelection = this.selectionList.filter(item => {
      if (!this._inputValue) {
        return true;
      }
      return (
        item.value
          .toLocaleLowerCase()
          .indexOf(this._inputValue.toLocaleLowerCase()) > -1
      );
    });

    const selectedTag = this.cell?.value ?? [];
    const showCreateTip =
      this._inputValue &&
      filteredSelection.findIndex(item => item.value === this._inputValue) ===
        -1;
    const selectCreateTip = showCreateTip
      ? html`<div class="select-option-new" @click=${this._onAddSelection}>
          <div class="select-option-new-icon">Create ${PlusIcon}</div>
          <span
            class="select-option-new-text"
            style=${styleMap({ backgroundColor: this._selectColor })}
            >${this._inputValue}</span
          >
        </div>`
      : null;

    return html`
      <div class="affine-database-select-cell-select">
        <div class="select-input-container">
          ${selectedTag.map(item => {
            const style = styleMap({
              backgroundColor: item.color,
            });
            return html`<div class="select-selected" style=${style}>
              <div class="select-selected-text">${item.value}</div>
              <span
                class="close-icon"
                @click=${() => this._onDeleteSelected(selectedTag, item)}
                >${DatabaseSearchClose}</span
              >
            </div>`;
          })}
          <input
            class="select-input"
            placeholder="Type here..."
            maxlength=${SELECT_TAG_NAME_MAX_LENGTH}
            @input=${this._onSelectSearchInput}
            @keydown=${(event: KeyboardEvent) =>
              this._onSelectOrAdd(event, selectedTag)}
          />
        </div>
        <div class="select-option-container">
          <div class="select-option-container-header">
            Select tag or create one
          </div>
          ${selectCreateTip}
          ${repeat(
            filteredSelection,
            select => select.id,
            (select, index) => {
              const isEditing = index === this._editingIndex;
              const isSelected = index === this._selectedOptionIndex;
              const onOptionIconClick = isEditing
                ? () => this._onSaveSelectionName(index)
                : () => this._showSelectAction(index);

              const classes = classMap({
                'select-option': true,
                selected: isSelected,
                editing: isEditing,
              });
              return html`
                <div class="${classes}">
                  <div
                    class="select-option-text-container"
                    @click=${() => this._onSelect(selectedTag, select)}
                  >
                    <affine-database-select-option
                      style=${styleMap({
                        cursor: isEditing ? 'text' : 'pointer',
                      })}
                      .databaseModel=${this.databaseModel}
                      .select=${select}
                      .editing=${isEditing}
                      .index=${index}
                      .saveSelectionName=${this._onSaveSelectionName}
                      .setEditingIndex=${this._setEditingIndex}
                    ></affine-database-select-option>
                  </div>
                  <div class="select-option-icon" @click=${onOptionIconClick}>
                    ${isEditing ? DatabaseDone : MoreHorizontalIcon}
                  </div>
                </div>
              `;
            }
          )}
        </div>
      </div>
    `;
  }
}

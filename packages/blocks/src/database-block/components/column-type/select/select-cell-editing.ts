import './select-option.js';

import {
  DatabaseDone,
  DatabaseSearchClose,
  MoreHorizontalIcon,
  PlusIcon,
} from '@blocksuite/global/config';
import type { SelectTag } from '@blocksuite/global/database';
import { assertExists } from '@blocksuite/global/utils';
import { createPopper } from '@popperjs/core';
import { css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html, literal } from 'lit/static-html.js';

import {
  SELECT_EDIT_POPUP_WIDTH,
  SELECT_TAG_NAME_MAX_LENGTH,
} from '../../../consts.js';
import { DatabaseCellElement } from '../../../register.js';
import { SelectMode, type SelectTagActionType } from '../../../types.js';
import { getTagColor, onClickOutside } from '../../../utils.js';
import type { SelectOption } from './select-option.js';
import { SelectActionPopup } from './select-option-popup.js';

const styles = css`
  :host {
    z-index: 2;
    background: var(--affine-background-primary-color);
    box-shadow: var(--affine-popover-shadow);
  }
  .affine-database-select-cell-select {
    font-size: var(--affine-font-sm);
  }
  .affine-database-select-cell-select * {
    box-sizing: border-box;
  }
  .select-input-container {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 44px;
    width: 345px;
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
  }
  .select-option:hover {
    background: var(--affine-hover-color);
  }
  .select-option:hover .select-option-icon {
    display: flex;
  }
  .select-option-text-container {
    flex: 1;
  }
  .select-option-text {
    display: none;
    display: inline-block;
    height: 100%;
    padding: 2px 10px;
    background: var(--affine-tag-white);
    border-radius: 4px;
    outline: none;
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

  @property()
  mode: SelectMode = SelectMode.Single;

  @query('.select-input')
  private _selectInput!: HTMLInputElement;

  @state()
  private _inputValue = '';

  @state()
  private _editingIndex = -1;

  @query('.select-option-container')
  private _selectOptionContainer!: HTMLDivElement;
  private _selectColor: string | undefined = undefined;

  get isSingleMode() {
    return this.mode === SelectMode.Single;
  }

  protected override firstUpdated() {
    this.style.width = `${SELECT_EDIT_POPUP_WIDTH}px`;
    this._selectInput.focus();
  }

  override connectedCallback() {
    super.connectedCallback();
    createPopper(
      {
        getBoundingClientRect: () => {
          const rect = this.rowHost.getBoundingClientRect();
          rect.y = rect.y - rect.height;
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
    if (event.key === 'Enter' && this._inputValue.trim() !== '') {
      this._onAddSelection(selectedValue);
    }
  };

  private _onSelect = (selectedValue: SelectTag[], select: SelectTag) => {
    // when editing, do not select
    if (this._editingIndex !== -1) return;
    this.value = select;
    const isSelected = selectedValue.indexOf(this.value) > -1;
    if (!isSelected) {
      const newValue = this.isSingleMode
        ? [this.value]
        : [...selectedValue, this.value];
      this.rowHost.setValue(newValue);
      this.rowHost.setEditing(false);

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
    const newSelect = { value, color: tagColor };

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
      const selection = [...(this.column.selection as SelectTag[])];
      this.databaseModel.updateColumn({
        ...this.column,
        selection: selection.filter((_, i) => i !== index),
      });
      const select = selection[index];
      this.databaseModel.deleteSelectedCellTag(this.column.id, select);
      return;
    }
  };

  private _showSelectAction = (index: number) => {
    const selectOption = this.shadowRoot
      ?.querySelectorAll('.select-option')
      .item(index);
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

    const selection = [...(this.column.selection as SelectTag[])];
    const oldSelect = selection[index];
    const newSelect = { ...oldSelect, value: selectOption.getSelectionValue() };
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
    const selection = this.column.selection as SelectTag[];
    const filteredSelection = selection.filter(item => {
      if (!this._inputValue) {
        return true;
      }
      return (
        item.value
          .toLocaleLowerCase()
          .indexOf(this._inputValue.toLocaleLowerCase()) > -1
      );
    });

    const selectedTag = (this.cell?.value ?? []) as SelectTag[];
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
            return html`<span class="select-selected" style=${style}>
              ${item.value}
              <span
                class="close-icon"
                @click=${() => this._onDeleteSelected(selectedTag, item)}
                >${DatabaseSearchClose}</span
              >
            </span>`;
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
            item => item,
            (select, index) => {
              const isEditing = index === this._editingIndex;
              const onOptionIconClick = isEditing
                ? () => this._onSaveSelectionName(index)
                : () => this._showSelectAction(index);
              return html`
                <div class="select-option ${isEditing ? 'editing' : ''}">
                  <div
                    class="select-option-text-container"
                    @click=${() => this._onSelect(selectedTag, select)}
                  >
                    <affine-database-select-option
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

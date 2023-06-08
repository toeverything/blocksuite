import './select-option.js';

import {
  DatabaseDone,
  DatabaseSearchClose,
  MoreHorizontalIcon,
  PlusIcon,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { nanoid } from '@blocksuite/store';
import { autoPlacement, computePosition, offset } from '@floating-ui/dom';
import { css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { DatabaseBlockModel } from '../../../../database-model.js';
import { getTagColor, onClickOutside } from '../../../../utils.js';
import {
  SELECT_EDIT_POPUP_WIDTH,
  SELECT_TAG_NAME_MAX_LENGTH,
} from '../../../consts.js';
import {
  type CellSelectionEnterKeys,
  selectCellByElement,
} from '../../../selection-manager/cell.js';
import type { SelectTag } from '../../../types.js';
import { SelectMode, type SelectTagActionType } from '../../../types.js';
import type { SelectOption } from './select-option.js';
import { SelectOptionColor } from './select-option-color.js';
import { SelectActionPopup } from './select-option-popup.js';

const KEYS_WHITE_LIST = ['Enter', 'ArrowUp', 'ArrowDown'];

const styles = css`
  affine-database-multi-tag-select {
    position: fixed;
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

  .select-selected > .close-icon:hover {
    cursor: pointer;
  }

  .select-selected > .close-icon > svg {
    fill: var(--affine-black-90);
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
    position: relative;
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

@customElement('affine-database-multi-tag-select')
export class SelectCellEditing extends WithDisposable(ShadowlessElement) {
  tempValue: string | undefined = undefined;

  static override styles = styles;
  cellType = 'select' as const;

  @property()
  mode: SelectMode = SelectMode.Single;

  @property()
  options: SelectTag[] = [];

  @property()
  value: string[] = [];
  @property()
  container!: HTMLElement;
  @property()
  databaseModel!: DatabaseBlockModel;

  @property()
  onChange!: (value: string[]) => void;

  @property()
  editComplete!: () => void;

  @property()
  newTag!: (tag: SelectTag) => void;
  @property()
  deleteTag!: (id: string) => void;
  @property()
  changeTag!: (tag: SelectTag) => void;

  @query('.select-input')
  private _selectInput!: HTMLInputElement;

  @state()
  private _inputValue = '';

  @state()
  private _editingId?: string;

  @state()
  private _selectedOptionIndex = -1;

  @query('.select-option-container')
  private _selectOptionContainer!: HTMLDivElement;
  private _selectColor: string | undefined = undefined;

  get isSingleMode() {
    return this.mode === SelectMode.Single;
  }

  get selectionList() {
    return this.options;
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

    computePosition(
      {
        getBoundingClientRect: () => {
          const rect = this.container.getBoundingClientRect();
          rect.y = rect.y - rect.height - 2;
          rect.x = rect.x - 2;
          return rect;
        },
      },
      this,
      {
        placement: 'bottom-start',
      }
    ).then(({ x, y }) => {
      Object.assign(this.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
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

      const selected = this.value;
      const currentSelection = this.selectionList[index];
      this._onSelect(selected, currentSelection.id);
      const cell =
        this._selectOptionContainer.closest<HTMLElement>('.database-cell');
      assertExists(cell);
      this._selectCell(cell, 'Escape');
    }
  };

  private _selectCell = (
    element: Element,
    key: CellSelectionEnterKeys,
    exitEditing = false
  ) => {
    if (this.isSingleMode || exitEditing) this.editComplete();
    selectCellByElement(element, this.databaseModel.id, key);
  };

  private _onDeleteSelected = (selectedValue: string[], value: string) => {
    const filteredValue = selectedValue.filter(item => item !== value);
    this.onChange(filteredValue);
  };

  private _onSelectSearchInput = (event: KeyboardEvent) => {
    const value = (event.target as HTMLInputElement).value;
    this._inputValue = value;
    if (!this._selectColor) {
      this._selectColor = getTagColor();
    }
  };

  private _onSelectOrAdd = (event: KeyboardEvent, selectedValue: string[]) => {
    const inputValue = this._inputValue.trim();

    if (event.key === 'Backspace' && inputValue === '') {
      this._onDeleteSelected(
        selectedValue,
        selectedValue[selectedValue.length - 1]
      );
    } else if (event.key === 'Enter' && inputValue !== '') {
      const selectTag = this.options.find(
        item => item.value === inputValue
      )?.id;
      if (selectTag) {
        this._onSelect(selectedValue, selectTag);
      } else {
        this._onAddSelection(selectedValue);
      }
    } else if (event.key === 'Escape') {
      this._selectCell(event.target as Element, 'Escape', true);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      this._selectCell(event.target as Element, 'Tab', true);
    }
  };

  private _onSelect = (selectedValue: string[], select: string) => {
    // when editing, do not select
    if (this._editingId != null) return;

    const isExist = selectedValue.findIndex(item => item === select) > -1;
    if (isExist) {
      this.editComplete();
      return;
    }

    this.tempValue = select;
    const isSelected = selectedValue.indexOf(this.tempValue) > -1;
    if (!isSelected) {
      const newValue = this.isSingleMode
        ? [this.tempValue]
        : [...selectedValue, this.tempValue];
      this.onChange(newValue);
      this.editComplete();
    }
  };

  private _onAddSelection = (selectedValue: string[]) => {
    let value = this._inputValue.trim();
    if (value === '') return;
    if (value.length > SELECT_TAG_NAME_MAX_LENGTH) {
      value = value.slice(0, SELECT_TAG_NAME_MAX_LENGTH);
    }

    const tagColor = this._selectColor ?? getTagColor();
    this._selectColor = undefined;
    const newSelect = { id: nanoid(), value, color: tagColor };
    this.newTag(newSelect);
    const newValue = this.isSingleMode
      ? [newSelect.id]
      : [...selectedValue, newSelect.id];
    this.onChange(newValue);
    this.editComplete();
  };

  private _onSelectAction = (
    type: SelectTagActionType,
    id: string,
    element: Element,
    onActionPopupClose: () => void
  ) => {
    if (type === 'rename') {
      this._setEditingId(id);
      return;
    }

    if (type === 'delete') {
      this.deleteTag(id);
      return;
    }
    if (type === 'change-color') {
      const optionColor = new SelectOptionColor();
      optionColor.onChange = color => {
        this._onSaveSelectionColor(id, color);
        onActionPopupClose();
        onClose();
      };
      element.appendChild(optionColor);
      const onClose = () => optionColor.remove();

      computePosition(element, optionColor, {
        // placement: 'right-start',
        middleware: [
          offset({
            mainAxis: 4,
          }),
          autoPlacement({
            allowedPlacements: ['right-start', 'bottom-start'],
          }),
        ],
      }).then(({ x, y }) => {
        Object.assign(optionColor.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      });

      onClickOutside(
        optionColor,
        ele => {
          ele.remove();
        },
        'mousedown'
      );
    }
  };

  private _showSelectAction = (id: string) => {
    const selectOption = this.querySelector(`[data-select-option-id="${id}"]`)
      ?.parentElement?.parentElement;
    assertExists(selectOption);

    const action = new SelectActionPopup();
    action.onAction = (type, id) => {
      const reference = action.shadowRoot?.firstElementChild;
      assertExists(reference);
      this._onSelectAction(type, id, reference, onClose);
    };
    action.tagId = id;
    selectOption.appendChild(action);
    const onClose = () => action.remove();

    computePosition(selectOption, action, {
      placement: 'bottom-end',
    }).then(({ x, y }) => {
      Object.assign(action.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
    onClickOutside(selectOption as HTMLElement, onClose, 'mousedown');
  };

  private _onSaveSelectionName = (id: string) => {
    const selectOption = this._selectOptionContainer.querySelector(
      `[data-select-option-id="${id}"]`
    ) as SelectOption;

    const value = selectOption.getSelectionValue();
    const selection = this.options.find(tag => tag.id === id);
    if (selection) {
      this.changeTag({ ...selection, value });
    }
    this._setEditingId();
  };
  private _onSaveSelectionColor = (id: string, color: string) => {
    const selection = this.options.find(tag => tag.id === id);
    if (selection) {
      this.changeTag({ ...selection, color });
    }
  };

  private _setEditingId = (id?: string) => {
    this._editingId = id;
  };

  override render() {
    const filteredSelection = this.options.filter(item => {
      if (!this._inputValue) {
        return true;
      }
      return (
        item.value
          .toLocaleLowerCase()
          .indexOf(this._inputValue.toLocaleLowerCase()) > -1
      );
    });

    const selectedTag = this.value;
    const showCreateTip =
      this._inputValue &&
      filteredSelection.findIndex(item => item.value === this._inputValue) ===
        -1;
    const selectCreateTip = showCreateTip
      ? html` <div class="select-option-new" @click="${this._onAddSelection}">
          <div class="select-option-new-icon">Create ${PlusIcon}</div>
          <span
            class="select-option-new-text"
            style=${styleMap({ backgroundColor: this._selectColor })}
            >${this._inputValue}</span
          >
        </div>`
      : null;
    const map = new Map<string, SelectTag>(this.options.map(v => [v.id, v]));
    return html`
      <div class="affine-database-select-cell-select">
        <div class="select-input-container">
          ${selectedTag.map(id => {
            const option = map.get(id);
            if (!option) {
              return;
            }
            const style = styleMap({
              backgroundColor: option.color,
            });
            return html` <div class="select-selected" style=${style}>
              <div class="select-selected-text">${option.value}</div>
              <span
                class="close-icon"
                @click="${() => this._onDeleteSelected(selectedTag, id)}"
                >${DatabaseSearchClose}</span
              >
            </div>`;
          })}
          <input
            class="select-input"
            placeholder="Type here..."
            maxlength="${SELECT_TAG_NAME_MAX_LENGTH}"
            @input="${this._onSelectSearchInput}"
            @keydown="${(event: KeyboardEvent) =>
              this._onSelectOrAdd(event, selectedTag)}"
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
              const isEditing = select.id === this._editingId;
              const isSelected = index === this._selectedOptionIndex;
              const onOptionIconClick = isEditing
                ? () => this._onSaveSelectionName(select.id)
                : () => this._showSelectAction(select.id);
              const classes = classMap({
                'select-option': true,
                selected: isSelected,
                editing: isEditing,
              });
              return html`
                <div class="${classes}">
                  <div
                    class="select-option-text-container"
                    @click="${() => this._onSelect(selectedTag, select.id)}"
                  >
                    <affine-database-select-option
                      style=${styleMap({
                        cursor: isEditing ? 'text' : 'pointer',
                      })}
                      data-select-option-id="${select.id}"
                      .databaseModel="${this.databaseModel}"
                      .select="${select}"
                      .editing="${isEditing}"
                      .index="${index}"
                      .tagId="${select.id}"
                      .saveSelectionName="${this._onSaveSelectionName}"
                      .setEditingId="${this._setEditingId}"
                    ></affine-database-select-option>
                  </div>
                  <div class="select-option-icon" @click="${onOptionIconClick}">
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

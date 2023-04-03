import {
  DatabaseDone,
  DeleteIcon,
  MoreHorizontalIcon,
  PenIcon,
  PlusIcon,
} from '@blocksuite/global/config';
import type { SelectTag } from '@blocksuite/global/database';
import { assertExists } from '@blocksuite/global/utils';
import { VEditor } from '@blocksuite/virgo/virgo';
import { createPopper } from '@popperjs/core';
import { css, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html, literal } from 'lit/static-html.js';

import type { DatabaseBlockModel } from '../../database-model.js';
import {
  DatabaseCellLitElement,
  defineColumnSchemaRenderer,
} from '../../register.js';
import type { SelectTagAction, SelectTagActionName } from '../../types.js';
import { getTagColor, onClickOutside } from '../../utils.js';
import { actionStyles, isDivider } from '../edit-column-popup.js';

export const enum SelectMode {
  Multi = 'multi',
  Single = 'single',
}

const tagActions: SelectTagAction[] = [
  {
    type: 'rename',
    text: 'Rename',
    icon: PenIcon,
  },
  {
    type: 'divider',
  },
  {
    type: 'delete',
    text: 'Delete',
    icon: DeleteIcon,
  },
];

/** select input max length */
const INPUT_MAX_LENGTH = 10;

@customElement('affine-database-select-option-text')
class SelectOptionText extends LitElement {
  static styles = css`
    .select-option-text {
      display: inline-block;
      min-width: 2px;
      height: 100%;
      padding: 2px 10px;
      background: #fce8ff;
      border-radius: 4px;
    }
    .select-option-text:focus {
      outline: none;
    }
  `;

  @property()
  databaseModel!: DatabaseBlockModel;

  @property()
  select!: SelectTag;

  @property()
  editing!: boolean;

  @query('.select-option-text')
  private _container!: HTMLDivElement;

  private _vEditor!: VEditor;

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('editing') && this.editing) {
      this._vEditor.focusEnd();
    }
  }

  getSelectionValue() {
    return this._vEditor.yText.toString();
  }

  firstUpdated() {
    this._vEditor = new VEditor(this.select.value, {
      defaultMode: 'pure',
    });
    this._vEditor.mount(this._container);
    this._vEditor.bindHandlers({
      virgoInput: this._handleInput,
      paste: this._handlePaste,
    });
  }

  private _handleInput = (event: InputEvent) => {
    const length = this._vEditor.yText.length;
    if (length >= INPUT_MAX_LENGTH && event.data) {
      // prevent input
      return true;
    }
    return false;
  };

  private _handlePaste = (event: ClipboardEvent) => {
    const length = this._vEditor.yText.length;
    const restLength = INPUT_MAX_LENGTH - length;
    if (restLength <= 0) return;

    const data = event.clipboardData?.getData('text/plain');
    if (!data) return;

    const vRange = this._vEditor.getVRange();
    const text = data.length > restLength ? data.slice(0, restLength) : data;
    if (vRange) {
      this._vEditor.insertText(vRange, text);
      this._vEditor.setVRange({
        index: vRange.index + text.length,
        length: 0,
      });
    }
  };

  render() {
    const style = styleMap({
      backgroundColor: this.select.color,
    });
    return html`<div class="select-option-text" style=${style}></div>`;
  }
}

@customElement('affine-database-select-cell')
class SelectCell extends DatabaseCellLitElement<SelectTag[]> {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      width: calc(100% + 8px);
      height: 100%;
      margin: -2px -4px;
    }
    .affine-database-select-cell-container * {
      box-sizing: border-box;
    }
    .affine-database-select-cell-container {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      width: 100%;
    }
    .affine-database-select-cell-container .select-selected {
      height: 28px;
      padding: 2px 10px;
      border-radius: 4px;
      background: #f5f5f5;
    }
  `;

  static tag = literal`affine-database-select-cell`;

  render() {
    const values = (this.cell?.value ?? []) as SelectTag[];
    return html`
      <div
        class="affine-database-select-cell-container"
        style=${styleMap({
          maxWidth: `${this.columnSchema.width}px`,
        })}
      >
        ${values.map(item => {
          const style = styleMap({
            backgroundColor: item.color,
          });
          return html`<span class="select-selected" style=${style}
            >${item.value}</span
          >`;
        })}
      </div>
    `;
  }
}

@customElement('affine-database-select-action')
class SelectAction extends LitElement {
  static styles = css`
    :host {
      z-index: 11;
    }
    .affine-database-select-action {
      width: 200px;
      padding: 8px;
      border: 1px solid #e3e2e4;
      border-radius: 4px;
      background: #fff;
      box-shadow: 0px 0px 12px rgba(66, 65, 73, 0.14),
        inset 0px 0px 0px 0.5px #e3e3e4;
    }
    ${actionStyles}
    .action {
      color: #424149;
    }
    .action svg {
      width: 20px;
      height: 20px;
    }
    .rename,
    .delete {
      fill: #77757d;
    }
  `;

  @property()
  index!: number;

  @property()
  onAction!: (type: SelectTagActionName, index: number) => void;

  render() {
    return html`
      <div class="affine-database-select-action">
        ${tagActions.map(action => {
          if (isDivider(action))
            return html`<div class="action-divider"></div>`;

          return html`
            <div
              class="action ${action.type}"
              @mousedown=${() => this.onAction(action.type, this.index)}
            >
              <div class="action-content">
                ${action.icon}<span>${action.text}</span>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
}
@customElement('affine-database-select-cell-editing')
class SelectCellEditing extends DatabaseCellLitElement<SelectTag[]> {
  value: SelectTag | undefined = undefined;

  static styles = css`
    :host {
      z-index: 2;
      background: var(--affine-popover-background);
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
      background: rgba(0, 0, 0, 0.04);
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
      color: #888a9e;
    }
    .select-option-container {
      padding: 8px;
    }
    .select-option-container-header {
      padding: 8px 0px;
      color: rgba(0, 0, 0, 0.6);
    }
    .select-input-container .select-selected {
      display: flex;
      align-items: center;
      padding: 2px 10px;
      gap: 10px;
      height: 28px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .select-option-new {
      display: flex;
      flex-direction: row;
      align-items: center;
      height: 36px;
      padding: 4px;
      gap: 5px;
      border-radius: 4px;
      background: rgba(84, 56, 255, 0.04);
    }
    .select-option-new-text {
      height: 28px;
      padding: 2px 10px;
      border-radius: 4px;
      background: #ffe1e1;
    }
    .select-option-new-icon {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 28px;
      color: #424149;
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
      background: rgba(0, 0, 0, 0.04);
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
      background: #f5f5f5;
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
      background: rgba(0, 0, 0, 0.04);
    }
    .select-option-icon svg {
      width: 16px;
      height: 16px;
      pointer-events: none;
    }
    .editing {
      background: rgba(0, 0, 0, 0.04);
    }
    .editing .select-option-icon {
      display: flex;
      background: rgba(0, 0, 0, 0.08);
    }
  `;
  static tag = literal`affine-database-select-cell-editing`;

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

  protected firstUpdated() {
    // this.style.width = `${this.columnSchema.width}px`;
    this.style.width = `${345}px`;
    this._selectInput.focus();
  }

  connectedCallback() {
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
    if (value.length > INPUT_MAX_LENGTH) {
      value = value.slice(0, INPUT_MAX_LENGTH);
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

  private _onSelectAction = (type: SelectTagActionName, index: number) => {
    if (type === 'rename') {
      this._editingIndex = index;
      return;
    }

    if (type === 'delete') {
      const selection = [...(this.columnSchema.selection as SelectTag[])];
      this.databaseModel.page.db.updateColumnSchema({
        ...this.columnSchema,
        selection: selection.filter((_, i) => i !== index),
      });
      const select = selection[index];
      this.databaseModel.page.db.deleteSelectedCellTag(
        this.columnSchema.id,
        select
      );
      return;
    }
  };

  private _showSelectAction = (index: number) => {
    const selectOption = this.shadowRoot
      ?.querySelectorAll('.select-option')
      .item(index);
    assertExists(selectOption);

    const action = new SelectAction();
    action.onAction = this._onSelectAction;
    action.index = index;
    selectOption.appendChild(action);

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
    onClickOutside(
      selectOption as HTMLElement,
      () => action.remove(),
      'mousedown'
    );
  };

  private _onSaveSelectionName = (index: number) => {
    const selectOption = this._selectOptionContainer
      .querySelectorAll('affine-database-select-option-text')
      .item(index) as SelectOptionText;

    const selection = [...(this.columnSchema.selection as SelectTag[])];
    const oldSelect = selection[index];
    const newSelect = { ...oldSelect, value: selectOption.getSelectionValue() };
    selection[index] = newSelect;
    this.databaseModel.page.db.updateColumnSchema({
      ...this.columnSchema,
      selection,
    });
    this.databaseModel.page.db.renameSelectedCellTag(
      this.columnSchema.id,
      oldSelect,
      newSelect
    );

    this._editingIndex = -1;
  };

  override render() {
    const selection = this.columnSchema.selection as SelectTag[];
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

    return html`
      <div class="affine-database-select-cell-select">
        <div class="select-input-container">
          ${selectedTag.map(item => {
            const style = styleMap({
              backgroundColor: item.color,
            });
            return html`<span class="select-selected" style=${style}>
              ${item.value}
              <span @click=${() => this._onDeleteSelected(selectedTag, item)}
                >x</span
              >
            </span>`;
          })}
          <input
            class="select-input"
            placeholder="Type here..."
            maxlength=${INPUT_MAX_LENGTH}
            @input=${this._onSelectSearchInput}
            @keydown=${(event: KeyboardEvent) =>
              this._onSelectOrAdd(event, selectedTag)}
          />
        </div>
        <div class="select-option-container">
          <div class="select-option-container-header">
            Select tag or create one
          </div>
          ${showCreateTip
            ? html`<div
                class="select-option-new"
                @click=${this._onAddSelection}
              >
                <div class="select-option-new-icon">Create ${PlusIcon}</div>
                <span
                  class="select-option-new-text"
                  style=${styleMap({ backgroundColor: this._selectColor })}
                  >${this._inputValue}</span
                >
              </div>`
            : html``}
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
                    <affine-database-select-option-text
                      .databaseModel=${this.databaseModel}
                      .select=${select}
                      .editing=${index === this._editingIndex}
                    ></affine-database-select-option-text>
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

@customElement('affine-database-select-column-property-editing')
class SelectColumnPropertyEditing extends DatabaseCellLitElement<SelectTag[]> {
  static tag = literal`affine-database-select-column-property-editing`;
}

export const SelectColumnSchemaRenderer = defineColumnSchemaRenderer(
  'select',
  () => ({
    selection: [] as SelectTag[],
  }),
  () => null as SelectTag[] | null,
  {
    Cell: SelectCell,
    CellEditing: SelectCellEditing,
    ColumnPropertyEditing: SelectColumnPropertyEditing,
  },
  {
    displayName: 'Select',
  }
);

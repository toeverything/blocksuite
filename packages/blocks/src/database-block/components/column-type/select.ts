import { MoreHorizontalIcon, PlusIcon } from '@blocksuite/global/config';
import { createPopper } from '@popperjs/core';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html, literal } from 'lit/static-html.js';

import {
  DatabaseCellLitElement,
  defineColumnSchemaRenderer,
} from '../../register.js';

export const enum SelectMode {
  Multi = 'multi',
  Single = 'single',
}

/** select input max length */
const INPUT_MAX_LENGTH = 10;

@customElement('affine-database-select-cell')
class SelectCell extends DatabaseCellLitElement<string[]> {
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
      background: #f3f0ff;
    }
  `;

  static tag = literal`affine-database-select-cell`;
  override render() {
    const values = (this.column?.value ?? []) as string[];
    return html`
      <div
        class="affine-database-select-cell-container"
        style=${styleMap({
          maxWidth: `${this.columnSchema.internalProperty.width}px`,
        })}
      >
        ${values.map(item => {
          return html`<span class="select-selected">${item}</span>`;
        })}
      </div>
    `;
  }
}

@customElement('affine-database-select-cell-editing')
class SelectCellEditing extends DatabaseCellLitElement<string[]> {
  value: string | undefined = undefined;

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
      background: #f3f0ff;
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
      position: relative;
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
      background: #fce8ff;
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
  `;
  static tag = literal`affine-database-select-cell-editing`;

  @property()
  mode: SelectMode = SelectMode.Single;

  @state()
  private _inputValue = '';

  get isSingleMode() {
    return this.mode === SelectMode.Single;
  }

  protected firstUpdated() {
    // this.style.width = `${this.columnSchema.internalProperty.width}px`;
    this.style.width = `${345}px`;
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

  private _onDeleteSelected = (selectedValue: string[], value: string) => {
    const filteredValue = selectedValue.filter(item => item !== value);
    this.rowHost.setValue(filteredValue);
  };

  private _onSelectSearchInput = (event: KeyboardEvent) => {
    const value = (event.target as HTMLInputElement).value;
    this._inputValue = value;
  };

  private _onSelectOrAdd = (event: KeyboardEvent, selectedValue: string[]) => {
    if (event.key === 'Enter' && this._inputValue.trim() !== '') {
      this._onAddSelection(selectedValue);
    }
  };

  private _onSelect = (selectedValue: string[], select: string) => {
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

  private _onAddSelection = (selectedValue: string[]) => {
    let value = this._inputValue.trim();
    if (value === '') return;
    if (value.length > INPUT_MAX_LENGTH) {
      value = value.slice(0, INPUT_MAX_LENGTH);
    }

    this.rowHost.updateColumnProperty(property => {
      const selection = property.selection as string[];
      return {
        ...property,
        selection:
          selection.findIndex(select => select === value) === -1
            ? [...selection, value]
            : selection,
      };
    });

    const newValue = this.isSingleMode ? [value] : [...selectedValue, value];
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

  override render() {
    const selection = this.columnSchema.property.selection as string[];
    const filteredSelection = selection.filter(item => {
      if (!this._inputValue) {
        return true;
      }
      return (
        item.toLocaleLowerCase().indexOf(this._inputValue.toLocaleLowerCase()) >
        -1
      );
    });

    const selectedValue = (this.column?.value ?? []) as string[];
    const showCreateTip =
      this._inputValue &&
      filteredSelection.findIndex(item => item === this._inputValue) === -1;

    return html`
      <div class="affine-database-select-cell-select">
        <div class="select-input-container">
          ${selectedValue.map(value => {
            return html`<span class="select-selected">
              ${value}
              <span @click=${() => this._onDeleteSelected(selectedValue, value)}
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
              this._onSelectOrAdd(event, selectedValue)}
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
                <span class="select-option-new-text">${this._inputValue}</span>
              </div>`
            : html``}
          ${filteredSelection.map(select => {
            return html`
              <div class="select-option">
                <div
                  class="select-option-text-container"
                  @click=${() => this._onSelect(selectedValue, select)}
                >
                  <span class="select-option-text" contenteditable=${false}
                    >${select}</span
                  >
                </div>
                <div class="select-option-icon">${MoreHorizontalIcon}</div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }
}

@customElement('affine-database-select-column-property-editing')
class SelectColumnPropertyEditing extends DatabaseCellLitElement<string[]> {
  static tag = literal`affine-database-select-column-property-editing`;
}

export const SelectColumnSchemaRenderer = defineColumnSchemaRenderer(
  'select',
  () => ({
    selection: [] as string[],
  }),
  () => null as string[] | null,
  {
    Cell: SelectCell,
    CellEditing: SelectCellEditing,
    ColumnPropertyEditing: SelectColumnPropertyEditing,
  },
  {
    displayName: 'Select',
  }
);

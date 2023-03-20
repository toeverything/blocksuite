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

@customElement('affine-database-select-cell')
class SelectCell extends DatabaseCellLitElement<string> {
  static styles = css`
    :host {
      width: 100%;
    }
    .affine-database-select-cell-container {
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      min-height: 32px;
    }
    .affine-database-select-cell-container .select-selected {
      padding: 5px;
      margin: 3px;
      font-size: 14px;
      line-height: 1;
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
class SelectCellEditing extends DatabaseCellLitElement<string> {
  value: string | undefined = undefined;

  static styles = css`
    :host {
      z-index: 2;
      background: var(--affine-popover-background);
      box-shadow: var(--affine-popover-shadow);
    }
    .select-input-container {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }
    .select-input {
      flex: 1;
      height: 32px;
      min-width: 80px;
      border: none;
      border-radius: 10px;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-sm);
      box-sizing: border-box;
      color: inherit;
      background: transparent;
    }
    .select-input:focus {
      outline: none;
    }
    .select-input::placeholder {
      color: #888a9e;
      font-size: var(--affine-font-sm);
    }
    .select-option-container-header {
      font-size: 12px;
    }
    .select-input-container .select-selected {
      padding: 5px;
      margin: 3px;
      font-size: 14px;
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
    this.style.width = `${this.columnSchema.internalProperty.width}px`;
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
        placement: 'bottom',
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
    if (value.trim() !== '') {
      this._inputValue = value;
    }
  };

  private _onSelectOrAdd = (event: KeyboardEvent, selectedValue: string[]) => {
    if (event.key === 'Enter') {
      this.value = (event.target as HTMLInputElement).value;
      this.rowHost.updateColumnProperty(property => {
        const selection = property.selection as string[];
        return {
          ...property,
          selection:
            selection.findIndex(select => select === this.value) === -1
              ? [...selection, this.value]
              : selection,
        };
      });

      const newValue = this.isSingleMode
        ? [this.value]
        : [...selectedValue, this.value];
      this.rowHost.setValue(newValue);
      this.rowHost.setEditing(false);
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
    }
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
            placeholder="Search for an option..."
            @input=${this._onSelectSearchInput}
            @keydown=${(event: KeyboardEvent) =>
              this._onSelectOrAdd(event, selectedValue)}
          />
        </div>
        <div class="select-option-container">
          <div class="select-option-container-header">
            Select an option or create one
          </div>
          ${filteredSelection.map(select => {
            return html`
              <div
                class="select-option"
                @click=${() => this._onSelect(selectedValue, select)}
              >
                ${select}
              </div>
            `;
          })}
          ${showCreateTip
            ? html`<div class="select-option-new">
                Create <span>${this._inputValue}</span>
              </div>`
            : html``}
        </div>
      </div>
    `;
  }
}

@customElement('affine-database-select-column-property-editing')
class SelectColumnPropertyEditing extends DatabaseCellLitElement<string> {
  static tag = literal`affine-database-select-column-property-editing`;
}

export const SelectColumnSchemaRenderer = defineColumnSchemaRenderer(
  'select',
  () => ({
    selection: [] as string[],
  }),
  () => null as string | null,
  {
    Cell: SelectCell,
    CellEditing: SelectCellEditing,
    ColumnPropertyEditing: SelectColumnPropertyEditing,
  },
  {
    displayName: 'Select',
  }
);

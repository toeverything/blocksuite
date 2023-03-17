import { createPopper } from '@popperjs/core';
import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';

import {
  DatabaseCellLitElement,
  defineColumnSchemaRenderer,
} from '../../register.js';

@customElement('affine-database-select-cell')
class SelectCell extends DatabaseCellLitElement {
  static styles = css`
    :host {
      width: 100%;
      height: 100%;
    }
  `;

  static tag = literal`affine-database-select-cell`;
  override render() {
    return html` <div>${this.column?.value}</div> `;
  }
}

@customElement('affine-database-select-cell-editing')
class SelectCellEditing extends DatabaseCellLitElement {
  value: string | undefined = undefined;

  static styles = css`
    :host {
      z-index: 2;
      background: var(--affine-popover-background);
      box-shadow: var(--affine-popover-shadow);
    }
  `;
  static tag = literal`affine-database-select-cell-editing`;

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

  override render() {
    const selection = this.columnSchema.property.selection as string[];
    return html`
      <div>
        <input
          @keydown=${(event: KeyboardEvent) => {
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
              this.rowHost.setValue(this.value);
              this.rowHost.setEditing(false);
            }
          }}
        />
        ${selection.map(select => {
          return html`
            <li
              @click=${() => {
                this.value = select;
                this.rowHost.setValue(this.value);
                this.rowHost.setEditing(false);
              }}
            >
              ${select}
            </li>
          `;
        })}
      </div>
    `;
  }
}

@customElement('affine-database-select-column-property-editing')
class SelectColumnPropertyEditing extends DatabaseCellLitElement {
  static tag = literal`affine-database-select-column-property-editing`;
}

export const SelectColumnSchemaRenderer = defineColumnSchemaRenderer(
  'select',
  () => ({
    selection: [] as string[],
  }),
  () => [] as string[],
  {
    Cell: SelectCell,
    CellEditing: SelectCellEditing,
    ColumnPropertyEditing: SelectColumnPropertyEditing,
  },
  {
    displayName: 'Select',
  }
);

import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';

import {
  DatabaseCellLitElement,
  defineColumnSchemaRenderer,
} from '../../register.js';

@customElement('affine-database-number-cell')
class NumberCell extends DatabaseCellLitElement<number> {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }
  `;

  static tag = literal`affine-database-number-cell`;

  render() {
    return html` <span class="number">${this.cell?.value}</span> `;
  }
}

@customElement('affine-database-number-cell-editing')
class NumberCellEditing extends DatabaseCellLitElement<number> {
  static styles = css`
    :host {
      width: 100%;
    }

    .affine-database-number {
      width: 100%;
      padding: 0;
      border: 0;
      font-size: 16px;
      color: var(--affine-text-color);
      font-family: var(--affine-font-family);
      outline: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    }
    .affine-database-number:focus-visible {
      outline-offset: 0px;
    }
    .affine-database-number::-webkit-outer-spin-button,
    .affine-database-number::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `;

  static tag = literal`affine-database-number-cell-editing`;
  value: number | undefined = undefined;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keypress', (event: KeyboardEvent) => {
      if (event.key === 'Enter' && this.value) {
        this.rowHost.setEditing(false);
      }
    });
  }

  protected render() {
    return html`
      <input
        class="affine-database-number"
        @input=${(event: Event) => {
          this.value = (event.target as HTMLInputElement).valueAsNumber;
        }}
        @blur=${() => {
          if (this.value) {
            this.rowHost.setValue(this.value);
          }
        }}
        type="number"
        value=${this.cell?.value ?? ''}
      />
    `;
  }
}

@customElement('affine-database-number-column-property-editing')
class NumberColumnPropertyEditing extends DatabaseCellLitElement<number> {
  static tag = literal`affine-database-number-column-property-editing`;
}
export const NumberColumnSchemaRenderer = defineColumnSchemaRenderer(
  'number',
  () => ({
    decimal: 0,
  }),
  () => null as number | null,
  {
    Cell: NumberCell,
    CellEditing: NumberCellEditing,
    ColumnPropertyEditing: NumberColumnPropertyEditing,
  },
  {
    displayName: 'Number',
  }
);

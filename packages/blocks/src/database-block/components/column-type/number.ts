import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';

import {
  DatabaseCellLitElement,
  defineColumnSchemaRenderer,
} from '../../register.js';

@customElement('affine-database-number-cell')
class NumberCell extends DatabaseCellLitElement {
  static styles = css`
    :host {
      width: 100%;
      height: 100%;
    }
  `;

  static tag = literal`affine-database-number-cell`;

  render() {
    return html` <span>${this.column?.value}</span> `;
  }
}

@customElement('affine-database-number-cell-editing')
class NumberCellEditing extends DatabaseCellLitElement {
  static styles = css`
    :host {
      width: 100%;
      height: 100%;
    }
  `;

  static tag = literal`affine-database-number-cell-editing`;
  value: number | undefined = undefined;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keypress', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        this.rowHost.setValue(this.value);
        this.rowHost.setEditing(false);
      }
    });
  }

  protected render() {
    return html`
      <input
        @input=${(event: Event) => {
          this.value = (event.target as HTMLInputElement).valueAsNumber;
        }}
        @blur=${() => {
          this.rowHost.setValue(this.value);
        }}
        type="number"
        value=${this.column?.value ?? ''}
      />
    `;
  }
}

@customElement('affine-database-number-column-property-editing')
class NumberColumnPropertyEditing extends DatabaseCellLitElement {
  static tag = literal`affine-database-number-column-property-editing`;
}
export const NumberColumnSchemaRenderer = defineColumnSchemaRenderer(
  'number',
  () => ({
    decimal: 0,
  }),
  () => 0,
  {
    Cell: NumberCell,
    CellEditing: NumberCellEditing,
    ColumnPropertyEditing: NumberColumnPropertyEditing,
  },
  {
    displayName: 'Number',
  }
);

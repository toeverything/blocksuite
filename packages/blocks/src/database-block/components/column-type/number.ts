import {
  DatabaseCellLitElement,
  defineTagSchemaRenderer,
} from '@blocksuite/global/database';
import { customElement } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';
import { html } from 'lit';

@customElement('affine-database-number-cell-preview')
class NumberCellPreview extends DatabaseCellLitElement {
  static tag = literal`affine-database-number-cell-preview`;

  render() {
    return html` <span>${this.tag?.value}</span> `;
  }
}

@customElement('affine-database-number-cell-editing')
class NumberCellEditing extends DatabaseCellLitElement {
  static tag = literal`affine-database-number-cell-editing`;
  value: number | undefined = undefined;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keypress', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
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
          this.rowHost.setEditing(false);
        }}
        type="number"
        value=${this.tag?.value}
      />
    `;
  }
}

@customElement('affine-database-number-column-property-editing')
class NumberColumnPropertyEditing extends DatabaseCellLitElement {
  static tag = literal`affine-database-number-column-property-editing`;
}
export const NumberTagSchemaRenderer = defineTagSchemaRenderer(
  'number',
  () => ({
    decimal: 0,
  }),
  () => 0,
  {
    CellPreview: NumberCellPreview,
    CellEditing: NumberCellEditing,
    ColumnPropertyEditing: NumberColumnPropertyEditing,
  },
  {
    displayName: 'Number',
  }
);

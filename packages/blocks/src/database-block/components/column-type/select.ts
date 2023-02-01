import {
  DatabaseCellLitElement,
  defineTagSchemaRenderer,
} from '@blocksuite/global/database';
import { customElement } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';
import { css } from 'lit';

@customElement('affine-database-select-cell-preview')
class SelectCellPreview extends DatabaseCellLitElement {
  static tag = literal`affine-database-select-cell-preview`;
  override render() {
    return html` <div>${this.tag?.value}</div> `;
  }
}

@customElement('affine-database-select-cell-editing')
class SelectCellEditing extends DatabaseCellLitElement {
  value: string | undefined = undefined;

  static styles = css`
    :host {
      position: fixed;
      height: 300px;
      background: var(--affine-popover-background);
      box-shadow: var(--affine-popover-shadow);
    }
  `;
  static tag = literal`affine-database-select-cell-editing`;

  protected firstUpdated() {
    this.style.width = `${this.column.internalProperty.width}px`;
  }

  override render() {
    const selection = this.column.property.selection as string[];
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
              this.rowHost.setEditing(false);
            }
          }}
        />
        ${selection.map(select => {
          return html`
            <li
              @click=${() => {
                this.value = select;
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

export const SelectTagSchemaRenderer = defineTagSchemaRenderer(
  'select',
  () => ({
    selection: [] as string[],
  }),
  () => [] as string[],
  {
    CellPreview: SelectCellPreview,
    CellEditing: SelectCellEditing,
    ColumnPropertyEditing: SelectColumnPropertyEditing,
  },
  {
    displayName: 'Select',
  }
);

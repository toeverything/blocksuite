import type { RowHost } from '@blocksuite/global/database';
import { assertExists } from '@blocksuite/global/utils';
import { css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import {
  DatabaseCellLitElement,
  getColumnSchemaRenderer,
} from '../register.js';
import { onClickOutside } from '../utils.js';

/** affine-database-cell-container padding */
const CELL_PADDING = 8;

@customElement('affine-database-cell-container')
export class DatabaseCellContainer
  extends DatabaseCellLitElement<unknown>
  implements RowHost
{
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 10px ${CELL_PADDING}px;
      border-right: 1px solid var(--affine-border-color);
    }
  `;

  @state()
  private _isEditing = false;

  setValue(value: unknown) {
    queueMicrotask(() => {
      this.databaseModel.page.captureSync();
      this.databaseModel.page.db.updateColumn(this.rowModel.id, {
        columnId: this.columnSchema.id,
        value,
      });
      this.requestUpdate();
    });
  }

  setEditing = (isEditing: boolean) => {
    assertExists(this.shadowRoot);
    this._isEditing = isEditing;
    if (!this._isEditing) {
      setTimeout(() => {
        this.addEventListener('click', this._onClick);
      });
    }
  };

  updateColumnProperty(
    apply: (oldProperty: Record<string, unknown>) => Record<string, unknown>
  ) {
    const newProperty = apply(this.columnSchema);
    this.databaseModel.page.captureSync();
    this.databaseModel.page.db.updateColumnSchema({
      ...this.columnSchema,
      ...newProperty,
    });
  }

  setHeight = (height: number) => {
    this.style.height = `${height + CELL_PADDING * 2}px`;
  };

  protected firstUpdated() {
    this.setAttribute('data-block-is-database-input', 'true');
    this.setAttribute('data-row-id', this.rowModel.id);
    this.setAttribute('data-column-id', this.columnSchema.id);
  }

  _onClick = (event: Event) => {
    this._isEditing = true;
    this.removeEventListener('click', this._onClick);
    setTimeout(() => {
      onClickOutside(
        this,
        () => {
          this.addEventListener('click', this._onClick);
          this._isEditing = false;
        },
        'mousedown'
      );
    });
  };

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this._onClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
    super.disconnectedCallback();
  }

  /* eslint-disable lit/binding-positions, lit/no-invalid-html */
  render() {
    const renderer = getColumnSchemaRenderer(this.columnSchema.type);
    const column = this.databaseModel.page.db.getColumn(
      this.rowModel,
      this.columnSchema
    );
    if (this._isEditing && renderer.components.CellEditing !== false) {
      const editingTag = renderer.components.CellEditing.tag;
      return html`
        <${editingTag}
          data-is-editing-cell="true"
          .rowHost=${this}
          .databaseModel=${this.databaseModel}
          .rowModel=${this.rowModel}
          .columnSchema=${this.columnSchema}
          .column=${column}
        ></${editingTag}>
      `;
    }
    const previewTag = renderer.components.Cell.tag;
    return html`
      <${previewTag}
        .rowHost=${this}
        .databaseModel=${this.databaseModel}
        .rowModel=${this.rowModel}
        .columnSchema=${this.columnSchema}
        .column=${column}
      ></${previewTag}>
    `;
  }
  /* eslint-enable lit/binding-positions, lit/no-invalid-html */
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-cell-container': DatabaseCellContainer;
  }
}

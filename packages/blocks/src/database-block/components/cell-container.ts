import type { RowHost } from '@blocksuite/global/database';
import { assertExists } from '@blocksuite/global/utils';
import { css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { DatabaseCellLitElement, getTagSchemaRenderer } from '../register.js';
import { onClickOutside } from '../utils.js';

@customElement('affine-database-cell-container')
export class DatabaseCellContainer
  extends DatabaseCellLitElement
  implements RowHost
{
  static styles = css`
    :host {
      display: flex;
      align-items: center;
    }
  `;

  @state()
  private _isEditing = false;

  setValue(value: unknown) {
    if (value) {
      setTimeout(() => {
        this.databaseModel.page.captureSync();
        this.databaseModel.page.updateBlockTag(this.rowModel.id, {
          schemaId: this.column.id,
          value,
        });
      });
    }
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
    const newProperty = apply(this.column.property);
    this.databaseModel.page.captureSync();
    this.databaseModel.page.setTagSchema({
      ...this.column,
      property: newProperty,
    });
  }

  protected firstUpdated() {
    this.databaseModel.propsUpdated.on(() => this.requestUpdate());
    this.databaseModel.childrenUpdated.on(() => this.requestUpdate());
    this.rowModel.propsUpdated.on(() => this.requestUpdate());
    this.rowModel.childrenUpdated.on(() => this.requestUpdate());
    this.setAttribute('data-block-is-database-input', 'true');
    this.setAttribute('data-row-id', this.rowModel.id);
    this.setAttribute('data-column-id', this.column.id);
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('column')) {
      requestAnimationFrame(() => {
        this.style.minWidth = `${this.column.internalProperty.width}px`;
        this.style.maxWidth = `${this.column.internalProperty.width}px`;
      });
    }
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
  protected render() {
    const renderer = getTagSchemaRenderer(this.column.type);
    const tag = this.databaseModel.page.getBlockTagByTagSchema(
      this.rowModel,
      this.column
    );
    if (this._isEditing && renderer.components.CellEditing !== false) {
      const editingTag = renderer.components.CellEditing.tag;
      return html`
        <${editingTag}
          data-is-editing-cell="true"
          .rowHost=${this}
          .databaseModel=${this.databaseModel}
          .rowModel=${this.rowModel}
          .column=${this.column}
          .tag=${tag}
        ></${editingTag}>
      `;
    }
    const previewTag = renderer.components.Cell.tag;
    return html`
      <${previewTag}
        .rowHost=${this}
        .databaseModel=${this.databaseModel}
        .rowModel=${this.rowModel}
        .column=${this.column}
        .tag=${tag}
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

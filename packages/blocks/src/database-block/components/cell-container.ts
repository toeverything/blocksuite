import { customElement, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';
import {
  DatabaseCellLitElement,
  getTagSchemaRenderer,
  RowHost,
} from '@blocksuite/global/database';
import { css } from 'lit';
import { assertExists } from '@blocksuite/global/utils';

@customElement('affine-database-cell-container')
export class DatabaseCellContainer
  extends DatabaseCellLitElement
  implements RowHost
{
  static styles = css``;

  @state()
  isEditing = false;

  setEditing = (isEditing: boolean) => {
    assertExists(this.shadowRoot);
    const editingCell = this.shadowRoot.querySelector(
      '[data-is-editing-cell="true"]'
    );
    const value = (editingCell as unknown as { value: unknown }).value;
    if (value) {
      this.databaseModel.page.captureSync();
      this.databaseModel.page.updateBlockTag(this.rowModel.id, {
        type: this.column.id,
        value,
      });
    }
    this.isEditing = isEditing;
  };

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
        this.style.minWidth = `${this.column.meta.width}px`;
        this.style.maxWidth = `${this.column.meta.width}px`;
      });
    }
  }

  _onClick = (event: Event) => {
    this.isEditing = true;
  };

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this._onClick);
  }

  disconnectedCallback() {
    this.addEventListener('click', this._onClick);
    super.disconnectedCallback();
  }

  /* eslint-disable lit/binding-positions, lit/no-invalid-html */
  protected render() {
    const renderer = getTagSchemaRenderer(this.column.type);
    const tag = this.databaseModel.page.getBlockTagByTagSchema(
      this.rowModel,
      this.column
    );
    if (this.isEditing) {
      const editingTag = renderer.uiSchema.CellEditing.tag;
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
    const previewTag = renderer.uiSchema.CellPreview.tag;
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

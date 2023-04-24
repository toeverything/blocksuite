import type { RowHost } from '@blocksuite/global/database';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { ColumnRendererHelper } from '../register.js';
import { DatabaseCellElement } from '../register.js';
import { onClickOutside } from '../utils.js';

/** affine-database-cell-container padding */
const CELL_PADDING = 8;

@customElement('affine-database-cell-container')
export class DatabaseCellContainer
  extends DatabaseCellElement<unknown>
  implements RowHost
{
  static override styles = css`
    affine-database-cell-container {
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

  @property()
  columnRenderer!: ColumnRendererHelper;

  private get readonly() {
    return this.databaseModel.page.readonly;
  }

  setValue(value: unknown) {
    queueMicrotask(() => {
      this.databaseModel.page.captureSync();
      this.databaseModel.updateCell(this.rowModel.id, {
        columnId: this.column.id,
        value,
      });
      this.databaseModel.applyColumnUpdate();
      this.requestUpdate();
    });
  }

  setEditing = (isEditing: boolean) => {
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
    const newProperty = apply(this.column);
    this.databaseModel.page.captureSync();
    this.databaseModel.updateColumn({
      ...this.column,
      ...newProperty,
    });
  }

  setHeight = (height: number) => {
    this.style.height = `${height + CELL_PADDING * 2}px`;
  };

  protected override firstUpdated() {
    this.setAttribute('data-block-is-database-input', 'true');
    this.setAttribute('data-row-id', this.rowModel.id);
    this.setAttribute('data-column-id', this.column.id);

    // prevent block selection
    const onStopPropagation = (event: Event) => event.stopPropagation();
    this._disposables.addFromEvent(this, 'mousedown', onStopPropagation);
    this._disposables.addFromEvent(this, 'mousemove', onStopPropagation);
  }

  _onClick = (event: Event) => {
    if (this.readonly) return;

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

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this._onClick);
  }

  override disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
    super.disconnectedCallback();
  }

  /* eslint-disable lit/binding-positions, lit/no-invalid-html */
  override render() {
    const renderer = this.columnRenderer.get(this.column.type);
    const cell = this.databaseModel.getCell(this.rowModel.id, this.column.id);
    if (
      !this.readonly &&
      this._isEditing &&
      renderer.components.CellEditing !== false
    ) {
      const editingTag = renderer.components.CellEditing.tag;
      return html`
        <${editingTag}
          data-is-editing-cell="true"
          .rowHost=${this}
          .databaseModel=${this.databaseModel}
          .rowModel=${this.rowModel}
          .column=${this.column}
          .cell=${cell}
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
        .cell=${cell}
      ></${previewTag}>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-cell-container': DatabaseCellContainer;
  }
}

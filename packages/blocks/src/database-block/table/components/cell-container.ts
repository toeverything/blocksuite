import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { TableMixColumn } from '../../common/view-manager.js';
import type { DatabaseBlockModel } from '../../database-model.js';
import { onClickOutside } from '../../utils.js';
import type { ColumnRendererHelper } from '../register.js';
import type { Column, RowHost, SetValueOption } from '../types.js';

/** affine-database-cell-container padding */
const CELL_PADDING = 8;

@customElement('affine-database-cell-container')
export class DatabaseCellContainer
  extends WithDisposable(ShadowlessElement)
  implements RowHost
{
  static override styles = css`
    affine-database-cell-container {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 0 ${CELL_PADDING}px;
      border-right: 1px solid var(--affine-border-color);
    }

    affine-database-cell-container * {
      box-sizing: border-box;
    }

    affine-database-multi-select-cell,
    affine-database-select-cell {
      cursor: pointer;
      width: 100%;
      height: 100%;
    }
  `;

  @state()
  private _isEditing = false;

  @property()
  columnRenderer!: ColumnRendererHelper;

  @property()
  rowModel!: BaseBlockModel;

  @property()
  column!: TableMixColumn;

  @property()
  databaseModel!: DatabaseBlockModel;

  private get readonly() {
    return this.databaseModel.page.readonly;
  }

  override connectedCallback() {
    super.connectedCallback();

    const disposables = this._disposables;
    disposables.addFromEvent(this, 'click', this._onClick);
  }

  protected override firstUpdated() {
    this.setAttribute('data-block-is-database-input', 'true');
    this.setAttribute('data-row-id', this.rowModel.id);
    this.setAttribute('data-column-id', this.column.id);
  }

  private _onClick = (event: Event) => {
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

  setValue = (
    value: unknown,
    option: SetValueOption = { captureSync: true }
  ) => {
    const captureSync = option.captureSync ?? true;
    const sync = option.sync ?? false;
    const run = () => {
      if (captureSync) {
        this.databaseModel.page.captureSync();
      }
      this.databaseModel.updateCell(this.rowModel.id, {
        columnId: this.column.id,
        value,
      });
      this.databaseModel.applyColumnUpdate();
      this.requestUpdate();
    };
    if (sync) {
      run();
    } else {
      queueMicrotask(() => {
        run();
      });
    }
  };

  setEditing = (isEditing: boolean) => {
    this._isEditing = isEditing;
    if (!isEditing) {
      this.databaseModel;
    }
    if (!this._isEditing) {
      setTimeout(() => {
        this.addEventListener('click', this._onClick);
      });
    }
  };

  setHeight = (height: number) => {
    this.style.height = `${height + CELL_PADDING * 2}px`;
  };

  updateColumnProperty = (
    apply: (oldProperty: Column) => Partial<Column>
  ): void => {
    const newProperty = apply(this.column);
    this.databaseModel.page.captureSync();
    this.databaseModel.updateColumn({
      ...this.column,
      ...newProperty,
    });
  };

  /* eslint-disable lit/binding-positions, lit/no-invalid-html */
  override render() {
    const renderer = this.columnRenderer.get(this.column.type);
    const cell = this.databaseModel.getCell(this.rowModel.id, this.column.id);

    if (
      !this.readonly &&
      this._isEditing &&
      renderer.components.CellEditing !== null
    ) {
      const editingTag = renderer.components.CellEditing.tag;
      return html`
        <${editingTag}
          data-is-editing-cell='true'
          .updateColumnProperty='${this.updateColumnProperty}'
          .readonly='${this.readonly}'
          .page='${this.databaseModel.page}'
          .columnData='${this.column.data}'
          .value='${cell?.value}'
          .onChange='${this.setValue}'
          .setHeight='${this.setHeight}'
          .setEditing='${this.setEditing}'
          .container='${this}'
        ></${editingTag}>
      `;
    }
    const previewTag = renderer.components.Cell.tag;
    return html`
      <${previewTag}
        .updateColumnProperty='${this.updateColumnProperty}'
        .readonly='${this.readonly}'
        .page='${this.databaseModel.page}'
        .columnData='${this.column.data}'
        .value='${cell?.value}'
        .onChange='${this.setValue}'
        .setHeight='${this.setHeight}'
        .setEditing='${this.setEditing}'
        .container='${this}'
      ></${previewTag}>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-cell-container': DatabaseCellContainer;
  }
}

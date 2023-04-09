import type { SelectTag } from '@blocksuite/global/database';
import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';

import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';
import { SelectMode } from '../../types.js';

@customElement('affine-database-multi-select-cell')
class MultiSelectCell extends DatabaseCellElement<SelectTag[]> {
  static styles = css`
    :host {
      width: 100%;
    }
  `;
  static tag = literal`affine-database-multi-select-cell`;

  render() {
    return html`
      <affine-database-select-cell
        .rowHost=${this.rowHost}
        .databaseModel=${this.databaseModel}
        .rowModel=${this.rowModel}
        .column=${this.column}
        .cell=${this.cell}
      ></affine-database-select-cell>
    `;
  }
}

@customElement('affine-database-multi-select-cell-editing')
class MultiSelectCellEditing extends DatabaseCellElement<SelectTag[]> {
  static tag = literal`affine-database-multi-select-cell-editing`;

  render() {
    return html`
      <affine-database-select-cell-editing
        data-is-editing-cell="true"
        .rowHost=${this.rowHost}
        .databaseModel=${this.databaseModel}
        .rowModel=${this.rowModel}
        .column=${this.column}
        .cell=${this.cell}
        .mode=${SelectMode.Multi}
      ></affine-database-select-cell-editing>
    `;
  }
}

@customElement('affine-database-multi-select-column-property-editing')
class MultiSelectColumnPropertyEditing extends DatabaseCellElement<
  SelectTag[]
> {
  static tag = literal`affine-database-multi-select-column-property-editing`;
}

export const MultiSelectColumnRenderer = defineColumnRenderer(
  'multi-select',
  () => ({
    selection: [] as SelectTag[],
  }),
  () => [] as SelectTag[],
  {
    Cell: MultiSelectCell,
    CellEditing: MultiSelectCellEditing,
    ColumnPropertyEditing: MultiSelectColumnPropertyEditing,
  },
  {
    displayName: 'Multi Select',
  }
);

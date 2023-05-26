import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';

import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';
import type { SelectTag } from '../../types.js';
import { SelectMode } from '../../types.js';

@customElement('affine-database-multi-select-cell')
class MultiSelectCell extends DatabaseCellElement<SelectTag[]> {
  static override styles = css`
    :host {
      width: 100%;
    }
  `;
  static override tag = literal`affine-database-multi-select-cell`;
  override cellType = 'multi-select' as const;

  override render() {
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
  static override tag = literal`affine-database-multi-select-cell-editing`;
  override cellType = 'multi-select' as const;

  override render() {
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

export const MultiSelectColumnRenderer = defineColumnRenderer(
  'multi-select',
  () => ({
    selection: [] as SelectTag[],
  }),
  () => [] as SelectTag[],
  {
    Cell: MultiSelectCell,
    CellEditing: MultiSelectCellEditing,
  },
  {
    displayName: 'Multi Select',
  }
);

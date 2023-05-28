import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html, literal } from 'lit/static-html.js';

import {
  DatabaseCellElement,
  defineColumnRenderer,
  type TableViewCell,
} from '../../../register.js';
import type { SelectTag } from '../../../types.js';
import { SelectCellEditing } from './select-cell-editing.js';

@customElement('affine-database-select-cell')
class SelectCell
  extends DatabaseCellElement<SelectTag[]>
  implements TableViewCell
{
  static override styles = css`
    affine-database-select-cell {
      display: flex;
      align-items: center;
      width: calc(100% + 8px);
      height: 100%;
      margin: -2px -4px;
    }
    .affine-database-select-cell-container * {
      box-sizing: border-box;
    }
    .affine-database-select-cell-container {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      width: 100%;
      cursor: pointer;
      font-size: var(--affine-font-sm);
    }
    .affine-database-select-cell-container .select-selected {
      height: 28px;
      padding: 2px 10px;
      border-radius: 4px;
      white-space: nowrap;
      background: var(--affine-tag-white);
    }
  `;

  static override tag = literal`affine-database-select-cell`;

  cellType = 'select' as const;

  override render() {
    const values = this.cell?.value ?? [];
    return html`
      <div
        class="affine-database-select-cell-container"
        style=${styleMap({
          maxWidth: `${this.column.width}px`,
        })}
      >
        ${values.map(item => {
          const style = styleMap({
            backgroundColor: item.color,
          });
          return html`<span class="select-selected" style=${style}
            >${item.value}</span
          >`;
        })}
      </div>
    `;
  }
}

export const SelectColumnRenderer = defineColumnRenderer(
  'select',
  () => ({
    selection: [] as SelectTag[],
  }),
  () => [] as SelectTag[],
  {
    Cell: SelectCell,
    CellEditing: SelectCellEditing,
  },
  {
    displayName: 'Select',
  }
);

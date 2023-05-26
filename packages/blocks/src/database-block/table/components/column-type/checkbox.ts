import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';

import {
  checkboxChecked,
  checkboxUnchecked,
} from '../../../../list-block/utils/icons.js';
import {
  DatabaseCellElement,
  defineColumnRenderer,
  type TableViewCell,
} from '../../register.js';

@customElement('affine-database-checkbox-cell')
class CheckboxCell
  extends DatabaseCellElement<boolean>
  implements TableViewCell
{
  static override tag = literal`affine-database-checkbox-cell`;
  cellType = 'checkbox' as const;

  static override styles = css`
    affine-database-checkbox-cell {
      display: block;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }

    .affine-database-checkbox-container {
      height: 100%;
    }

    .affine-database-checkbox {
      display: flex;
      align-items: center;
      height: 100%;
      width: 100%;
    }
  `;

  protected override firstUpdated() {
    this._disposables.addFromEvent(this, 'click', this._onChange);
  }

  private _onChange() {
    const checked = !this.cell?.value;

    this.rowHost.setValue(checked);
  }

  protected override render() {
    const checked = this.cell?.value ?? false;

    const icon = checked ? checkboxChecked() : checkboxUnchecked();
    return html`<div class="affine-database-checkbox-container">
      <div class="affine-database-checkbox checkbox ${checked && 'checked'}">
        ${icon}
      </div>
    </div>`;
  }
}

export const CheckboxColumnRenderer = defineColumnRenderer(
  'checkbox',
  () => ({}),
  () => false,
  {
    Cell: CheckboxCell,
    CellEditing: null,
  },
  {
    displayName: 'Checkbox',
  }
);

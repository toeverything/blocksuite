import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';

import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';

@customElement('affine-database-number-cell-editing')
class NumberCellEditing extends DatabaseCellElement<number> {
  static override styles = css`
    affine-database-number-cell-editing {
      display: block;
      width: 100%;
      height: 100%;
      cursor: text;
    }

    .affine-database-number {
      display: flex;
      align-items: center;
      height: 100%;
      border: none;
      width: 100%;
      padding: 0;
    }

    .affine-database-number:focus {
      outline: none;
    }

    .affine-database-number v-line {
      display: flex !important;
      align-items: center;
      height: 100%;
      width: 100%;
    }

    .affine-database-number v-line > div {
      flex-grow: 1;
    }
  `;

  static override tag = literal`affine-database-number-cell-editing`;

  override firstUpdated() {
    this._disposables.addFromEvent(this, 'click', this._onClick);
  }

  private _onClick = () => {
    this.databaseModel.page.captureSync();
  };

  private _input = (e: InputEvent) => {
    const ele = e.target as HTMLInputElement;
    this.rowHost.setValue(Number(ele.value));
  };

  protected override render() {
    return html`<input
      type="number"
      value="${this.cell?.value}"
      @input="${this._input}"
      class="affine-database-number number"
    />`;
  }
}

export const NumberColumnRenderer = defineColumnRenderer(
  'number',
  () => ({
    decimal: 0,
  }),
  page => null,
  {
    Cell: NumberCellEditing,
    CellEditing: null,
  },
  {
    displayName: 'Number',
  }
);

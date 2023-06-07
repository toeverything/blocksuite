import { css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';

import {
  DatabaseCellElement,
  defineColumnRenderer,
  type TableViewCell,
} from '../../register.js';

@customElement('affine-database-number-cell-editing')
export class NumberCellEditing
  extends DatabaseCellElement<number>
  implements TableViewCell
{
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

  @query('input')
  private _inputEle!: HTMLInputElement;

  static override tag = literal`affine-database-number-cell-editing`;
  cellType = 'number' as const;

  focusEnd = () => {
    const end = this._inputEle.value.length;
    setTimeout(() => {
      this._inputEle.setSelectionRange(end, end);
    });
  };

  private _blur = (e: Event) => {
    if (!this._inputEle.value) {
      return;
    }
    const value = Number(this._inputEle.value);
    if (Object.is(value, NaN)) {
      this._inputEle.value = `${this.cell?.value ?? ''}`;
      return;
    }
    this.rowHost.setValue(value, { captureSync: true });
  };
  private _focus = (e: Event) => {
    this.focusEnd();
  };

  protected override render() {
    return html`<input
      .value="${this.cell?.value ?? ''}"
      @focus="${this._focus}"
      @blur="${this._blur}"
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

import type { Y } from '@blocksuite/store/index.js';
import { VEditor } from '@blocksuite/virgo/virgo.js';
import { css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';

import type { AffineVEditor } from '../../../__internal__/rich-text/virgo/types.js';
import { setupVirgoScroll } from '../../../__internal__/utils/virgo.js';
import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';

@customElement('affine-database-number-cell-editing')
class NumberCellEditing extends DatabaseCellElement<Y.Text> {
  static override styles = css`
    :host {
      width: 100%;
    }

    .affine-database-number:focus {
      outline: none;
    }
  `;

  static override tag = literal`affine-database-number-cell-editing`;
  value: number | undefined = undefined;

  @query('.affine-database-number')
  private _container!: HTMLDivElement;

  private _vEditor: AffineVEditor | null = null;

  protected override firstUpdated() {
    this._onInitVEditor();
  }

  private _onInitVEditor = () => {
    let value: Y.Text;
    if (!this.cell?.value) {
      const yText = new this.databaseModel.page.YText('');
      this.databaseModel.updateCell(this.rowModel.id, {
        columnId: this.column.id,
        value: yText,
      });
      value = yText;
    } else {
      value = this.cell.value as Y.Text;
    }

    this._vEditor = new VEditor(value);
    setupVirgoScroll(this.databaseModel.page, this._vEditor);
    this._vEditor.mount(this._container);
    this._vEditor.focusEnd();
  };

  protected override render() {
    return html`<div class="affine-database-number"></div>`;
  }
}

@customElement('affine-database-number-column-property-editing')
class NumberColumnPropertyEditing extends DatabaseCellElement<Y.Text> {
  static override tag = literal`affine-database-number-column-property-editing`;
}

export const NumberColumnRenderer = defineColumnRenderer(
  'number',
  () => ({
    decimal: 0,
  }),
  page => new page.YText(''),
  {
    Cell: NumberCellEditing,
    CellEditing: false,
    ColumnPropertyEditing: NumberColumnPropertyEditing,
  },
  {
    displayName: 'Number',
  }
);

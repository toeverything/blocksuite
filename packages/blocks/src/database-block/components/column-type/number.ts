import { assertExists, type Y } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';

import { setupVirgoScroll } from '../../../__internal__/utils/virgo.js';
import { VirgoInput } from '../../../components/virgo-input/virgo-input.js';
import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';

@customElement('affine-database-number-cell-editing')
class NumberCellEditing extends DatabaseCellElement<Y.Text> {
  static override styles = css`
    affine-database-number-cell-editing {
      display: block;
      width: 100%;
      height: 100%;
    }

    .affine-database-number {
      display: flex;
      align-items: center;
      height: 100%;
    }
    .affine-database-number:focus {
      outline: none;
    }
    .affine-database-number v-line {
      width: 100%;
    }
  `;

  static override tag = literal`affine-database-number-cell-editing`;

  @query('.affine-database-number')
  private _container!: HTMLDivElement;

  private _vInput: VirgoInput | null = null;
  private get _vEditor() {
    assertExists(this._vInput);
    return this._vInput.vEditor;
  }

  override firstUpdated() {
    this._disposables.addFromEvent(this, 'click', this._onClick);
    this._onInitVEditor();
  }

  private _onClick = () => {
    this.databaseModel.page.captureSync();
  };

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
      value = this.cell.value;
    }

    this._vInput = new VirgoInput({
      yText: value,
      rootElement: this._container,
      type: 'number',
    });
    setupVirgoScroll(this.databaseModel.page, this._vEditor);
    this._container.addEventListener('keydown', event => {
      if (!this._vInput) return;
      if (event.key === 'Enter') {
        if (event.shiftKey) {
          // soft enter
        } else {
          // exit editing
          this.rowHost.setEditing(false);
          this._container.blur();
        }
        event.preventDefault();
        return;
      }
    });
  };

  protected override render() {
    return html`<div class="affine-database-number number"></div>`;
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

import { assertExists, type Y } from '@blocksuite/store';
import { VEditor } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';

import type { AffineVEditor } from '../../../__internal__/rich-text/virgo/types.js';
import { setupVirgoScroll } from '../../../__internal__/utils/virgo.js';
import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';

@customElement('affine-database-number-cell-editing')
class NumberCellEditing extends DatabaseCellElement<Y.Text> {
  static override styles = css`
    affine-database-number-cell-editing {
      width: 100%;
      display: block;
    }

    .affine-database-number:focus {
      outline: none;
    }
  `;

  static override tag = literal`affine-database-number-cell-editing`;

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

    const isNumeric = (str: string) => {
      // Use regular expressions to check if the string is a number
      // ^ indicates the beginning of a string
      // -? indicates an optional minus sign
      // (?:0|[1-9]\d*) indicates an integer part that starts with zero or a number between 1 and 9
      // (\.\d+)? indicates an optional fractional part, i.e. a dot followed by one or more digits
      // $ indicates the end of a string
      const regex = /^-?(?:0|[1-9]\d*)(\.\d+)?$/;
      return regex.test(str);
    };

    this._vEditor = new VEditor(value);
    setupVirgoScroll(this.databaseModel.page, this._vEditor);
    this._vEditor.mount(this._container);
    this._vEditor.bindHandlers({
      paste: (event: ClipboardEvent) => {
        const vEditor = this._vEditor;
        assertExists(vEditor);
        const data = event.clipboardData?.getData('text/plain');
        if (data) {
          const vRange = vEditor.getVRange();
          const text = data.replace(/(\r\n|\r|\n)/g, '\n');
          if (vRange && isNumeric(text)) {
            vEditor.insertText(vRange, text);
            vEditor.setVRange({
              index: vRange.index + text.length,
              length: 0,
            });
          }
        }
      },
      virgoInput(ctx) {
        if (ctx.data && !isNumeric(ctx.data)) {
          ctx.data = '';
        }
        return ctx;
      },
      virgoCompositionEnd(ctx) {
        if (ctx.data && !isNumeric(ctx.data)) {
          ctx.data = '';
        }
        return ctx;
      },
    });
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

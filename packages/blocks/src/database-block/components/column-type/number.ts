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

  private vEditor: AffineVEditor | null = null;

  // override connectedCallback(): void {
  //   super.connectedCallback();
  //   console.log('number connectedCallback');
  // }

  override firstUpdated() {
    console.log('number firstUpdated');
    this._disposables.addFromEvent(this, 'click', this._onClick);
    this._onInitVEditor();
  }

  protected override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has('cell') && !this.vEditor) {
      console.log('number updated', this._container, this);
      this._onInitVEditor();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    console.log('number disconnectedCallback');

    this.vEditor?.unmount();
    this.vEditor = null;
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

    this.vEditor = new VEditor(value);
    setupVirgoScroll(this.databaseModel.page, this.vEditor);
    this.vEditor.mount(this._container);
    this.vEditor.bindHandlers({
      paste: (event: ClipboardEvent) => {
        const vEditor = this.vEditor;
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
      virgoInput: ctx => {
        const vEditor = this.vEditor;
        assertExists(vEditor);
        const originText = vEditor.yText.toString();
        const vRange = vEditor.getVRange();
        if (!vRange) return ctx;
        const text =
          originText.slice(0, vRange.index) +
          ctx.data +
          originText.slice(vRange.index + vRange.length);
        if (ctx.data && !isNumeric(text)) {
          ctx.data = '';
        }
        return ctx;
      },
      virgoCompositionEnd: ctx => {
        const vEditor = this.vEditor;
        assertExists(vEditor);
        const originText = vEditor.yText.toString();
        const vRange = vEditor.getVRange();
        if (!vRange) return ctx;
        const text =
          originText.slice(0, vRange.index) +
          ctx.data +
          originText.slice(vRange.index + vRange.length);
        if (ctx.data && !isNumeric(text)) {
          ctx.data = '';
        }
        return ctx;
      },
      keydown: event => {
        if (!this.vEditor) return;
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
      },
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

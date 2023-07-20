import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import { startDrag } from '../../../utils/drag.js';
import { getResultInRange } from '../../../utils/utils.js';
import { DEFAULT_COLUMN_MIN_WIDTH } from '../../consts.js';
import { getTableContainer } from '../../table-view.js';
import type { DataViewTableColumnManager } from '../../table-view-manager.js';

const dragBarWidth = 16;

@customElement('affine-database-column-width-drag-bar')
export class ColumnWidthDragBar extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .column-width-drag-bar {
      height: 100%;
      position: absolute;
      top: 0;
      cursor: col-resize;
      display: flex;
      justify-content: center;
    }

    .preview-bar {
      width: 2px;
      height: 100%;
      background-color: blue;
      transition: 0.3s opacity;
      opacity: 0;
    }

    .column-width-drag-bar:hover .preview-bar {
      opacity: 1;
    }
  `;
  @property({ attribute: false })
  left!: number;
  @property({ attribute: false })
  column!: DataViewTableColumnManager;
  @state()
  dragLeft = 0;

  private _bar = createRef<HTMLElement>();
  private _startDrag = (evt: MouseEvent) => {
    const tableContainer = getTableContainer(this);
    const database = this.closest('affine-database-table');
    const offsetParent = database?.offsetParent;
    const bar = this._bar.value;
    assertExists(bar);
    assertExists(database);
    assertExists(offsetParent);
    const rect = bar.getBoundingClientRect();
    const scale = rect.width / dragBarWidth;
    const tableRect = tableContainer.getBoundingClientRect();
    const left = rect.left + rect.width / 2 - this.column.width * scale - scale;

    const preview = createWidthAdjustPreview(
      database,
      scale,
      this.column.width,
      tableRect.height / scale,
      tableRect.top - scale,
      left
    );
    tableContainer.style.pointerEvents = 'none';
    startDrag<{ width: number }>(evt, {
      onDrag: () => ({ width: this.column.width }),
      onMove: ({ x }) => {
        const width = Math.round(
          getResultInRange(
            (x - left) / scale,
            DEFAULT_COLUMN_MIN_WIDTH,
            Infinity
          )
        );
        this.dragLeft = width - this.column.width;
        preview.display(width);
        return {
          width,
        };
      },
      onDrop: ({ width }) => {
        tableContainer.style.pointerEvents = 'auto';
        this.dragLeft = 0;
        this.column.updateWidth(width);
        preview.remove();
      },
    });
  };

  override render() {
    const style = styleMap({
      left: `${this.left - dragBarWidth / 2 + this.dragLeft}px`,
      width: `${dragBarWidth}px`,
      'z-index': this.dragLeft ? '999' : undefined,
    });
    const barStyle = styleMap({
      opacity: this.dragLeft ? '1' : undefined,
    });
    return html`
      <div
        ${ref(this._bar)}
        style=${style}
        class="column-width-drag-bar"
        @mousedown="${this._startDrag}"
      >
        <div class="preview-bar" style=${barStyle}></div>
      </div>
    `;
  }
}

const createWidthAdjustPreview = (
  container: Element,
  scale: number,
  width: number,
  height: number,
  top: number,
  left: number
) => {
  const div = document.createElement('div');
  div.style.pointerEvents = 'none';
  div.style.position = 'absolute';
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;
  div.style.zIndex = '9';
  div.style.backgroundColor = 'rgba(0,0,0,0.3)';
  container.append(div);
  const parent = div.offsetParent;
  assertExists(parent);
  const rect = parent.getBoundingClientRect();
  const offsetLeft = (left - rect.left) / scale;
  const offsetTop = (top - rect.top) / scale;
  div.style.left = `${offsetLeft}px`;
  div.style.top = `${offsetTop}px`;
  return {
    display(width: number) {
      div.style.width = `${width}px`;
    },
    remove() {
      div.remove();
    },
  };
};

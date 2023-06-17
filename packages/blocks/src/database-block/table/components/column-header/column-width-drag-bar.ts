import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { startDrag } from '../../../utils/drag.js';
import { getResultInRange } from '../../../utils/utils.js';
import { DEFAULT_COLUMN_MIN_WIDTH } from '../../consts.js';
import { getHeaderContainer } from '../../table-view.js';
import type { ColumnManager } from '../../table-view-manager.js';

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
  @property()
  left!: number;
  @property()
  column!: ColumnManager;
  @state()
  dragLeft = 0;
  private _startDrag = (evt: MouseEvent) => {
    const headerContainer = getHeaderContainer(this);
    const tableContainer = headerContainer.parentElement;
    const database = this.closest('affine-database');
    assertExists(database);
    const rect = this.getBoundingClientRect();
    assertExists(tableContainer);
    const tableRect = tableContainer.getBoundingClientRect();
    const left = rect.left + this.left - this.column.width;
    const preview = createWidthAdjustPreview(
      database,
      this.column.width,
      tableRect.height,
      tableRect.top,
      left
    );
    tableContainer.style.pointerEvents = 'none';
    startDrag<{ width: number }>(evt, {
      onDrag: () => ({ width: this.column.width }),
      onMove: ({ x }) => {
        const width = Math.round(
          getResultInRange(x - left, DEFAULT_COLUMN_MIN_WIDTH, Infinity)
        );
        preview.display(width);
        return {
          width,
        };
      },
      onDrop: ({ width }) => {
        tableContainer.style.pointerEvents = 'auto';
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
  width: number,
  height: number,
  top: number,
  left: number
) => {
  const div = document.createElement('div');
  // div.style.pointerEvents='none';
  div.style.position = 'absolute';
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;
  div.style.zIndex = '9';
  div.style.backgroundColor = 'rgba(0,0,0,0.3)';
  container.append(div);
  const parent = div.offsetParent;
  assertExists(parent);
  const rect = parent.getBoundingClientRect();
  const offsetLeft = left - rect.left;
  const offsetTop = top - rect.top;
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

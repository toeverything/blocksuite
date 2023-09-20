import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import { startDrag } from '../../../utils/drag.js';
import { getResultInRange } from '../../../utils/utils.js';
import { DEFAULT_COLUMN_MIN_WIDTH } from '../../consts.js';
import type { DataViewTableColumnManager } from '../../table-view-manager.js';
import { getTableContainer } from '../../types.js';

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
      background-color: var(--affine-primary-color);
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

  public override connectedCallback() {
    super.connectedCallback();
    this.closest('affine-database-table')?.handleEvent('dragStart', context => {
      const target = context.get('pointerState').raw.target;
      if (target instanceof Element && this.contains(target)) {
        this._startDrag(context.get('pointerState').raw);
        return true;
      }
      return false;
    });
  }

  private _bar = createRef<HTMLElement>();
  private _startDrag = (evt: PointerEvent) => {
    const tableContainer = getTableContainer(this);
    const bar = this._bar.value;
    assertExists(bar);
    const rect = bar.getBoundingClientRect();
    const scale = rect.width / dragBarWidth;
    const tableRect = tableContainer.getBoundingClientRect();
    const left = rect.left + rect.width / 2 - this.column.width * scale - scale;
    const groups = tableContainer.querySelectorAll(
      'affine-data-view-table-group'
    );
    const rectList = Array.from(groups).map(group => {
      const groupRect = group.getBoundingClientRect();
      const top =
        group
          .querySelector('affine-database-column-header')
          ?.getBoundingClientRect().top ?? groupRect.top;
      const bottom =
        group
          .querySelector('.affine-database-block-rows')
          ?.getBoundingClientRect().bottom ?? groupRect.bottom;
      return {
        top: top - tableRect.top,
        bottom: bottom - tableRect.top,
      };
    });
    const preview = createWidthAdjustPreview(
      document.body,
      this.column.width * scale,
      tableRect.top,
      rectList,
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
        preview.display(width * scale);
        return {
          width,
        };
      },
      onDrop: ({ width }) => {
        this.column.updateWidth(width);
      },
      onClear: () => {
        tableContainer.style.pointerEvents = 'auto';
        this.dragLeft = 0;
        preview.remove();
      },
    });
  };

  override render() {
    if (this.column.dataViewManager.readonly) {
      return;
    }
    const style = styleMap({
      left: `${this.left - dragBarWidth / 2 + this.dragLeft}px`,
      width: `${dragBarWidth}px`,
      'z-index': this.dragLeft ? '999' : undefined,
    });
    const barStyle = styleMap({
      opacity: this.dragLeft ? '1' : undefined,
    });
    return html`
      <div ${ref(this._bar)} style=${style} class="column-width-drag-bar">
        <div class="preview-bar" style=${barStyle}></div>
      </div>
    `;
  }
}

const createWidthAdjustPreview = (
  container: Element,
  width: number,
  top: number,
  lines: { top: number; bottom: number }[],
  left: number
) => {
  const previewContainer = document.createElement('div');
  previewContainer.style.position = 'fixed';
  lines.forEach(({ top, bottom }) => {
    const div = document.createElement('div');
    div.style.pointerEvents = 'none';
    div.style.position = 'absolute';
    div.style.width = `100%`;
    div.style.height = `${bottom - top}px`;
    div.style.top = `${top}px`;
    div.style.left = `0`;
    div.style.zIndex = '9';
    div.style.backgroundColor = 'rgba(0,0,0,0.3)';
    previewContainer.append(div);
  });

  container.append(previewContainer);
  previewContainer.style.left = `${left}px`;
  previewContainer.style.top = `${top}px`;
  previewContainer.style.width = `${width}px`;
  return {
    display(width: number) {
      previewContainer.style.width = `${width}px`;
    },
    remove() {
      previewContainer.remove();
    },
  };
};

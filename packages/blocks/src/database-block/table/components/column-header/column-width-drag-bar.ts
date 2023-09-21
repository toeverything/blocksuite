import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { startDrag } from '../../../utils/drag.js';
import { getResultInRange } from '../../../utils/utils.js';
import { DEFAULT_COLUMN_MIN_WIDTH } from '../../consts.js';
import type { DataViewTableColumnManager } from '../../table-view-manager.js';

type GroupRectList = {
  top: number;
  bottom: number;
}[];

@customElement('affine-database-column-width-drag-bar')
export class ColumnWidthDragBar extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-database-column-width-drag-bar {
      position: fixed;
      left: 0;
      top: 0;
      z-index: 1;
      pointer-events: none;
    }

    .width-drag-bar-container {
      position: absolute;
    }

    .width-drag-bar-group {
      position: absolute;
      width: 100%;
      border-right: 2px solid var(--affine-primary-color);
      background-color: var(--affine-hover-color);
    }
  `;
  @property({ attribute: false })
  top!: number;
  @property({ attribute: false })
  left!: number;
  @property({ attribute: false })
  width!: number;
  @property({ attribute: false })
  lines!: GroupRectList;

  protected override render(): unknown {
    const containerStyle = styleMap({
      top: `${this.top}px`,
      left: `${this.left}px`,
      width: `${this.width}px`,
    });
    return html`
      <div class="width-drag-bar-container" style=${containerStyle}>
        ${repeat(this.lines, ({ top, bottom }) => {
          const groupStyle = styleMap({
            top: `${top}px`,
            height: `${bottom - top}px`,
          });
          return html`<div
            class="width-drag-bar-group"
            style=${groupStyle}
          ></div>`;
        })}
      </div>
    `;
  }
}

const getGroupRectList = (tableContainer: HTMLElement) => {
  const tableRect = tableContainer.getBoundingClientRect();
  const groups = tableContainer.querySelectorAll(
    'affine-data-view-table-group'
  );
  return Array.from(groups).map(group => {
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
};
export const startDragWidthAdjustmentBar = (
  evt: PointerEvent,
  tableContainer: HTMLElement,
  width: number,
  column: DataViewTableColumnManager
) => {
  const scale = column.width / width;
  const tableRect = tableContainer.getBoundingClientRect();
  const left =
    tableContainer
      .querySelector(
        `affine-database-header-column[data-column-id='${column.id}']`
      )
      ?.getBoundingClientRect().left ?? 0;
  const rectList = getGroupRectList(tableContainer);
  const preview = getWidthAdjustPreview();
  preview.display(column.width * scale, tableRect.top, rectList, left);
  tableContainer.style.pointerEvents = 'none';
  startDrag<{ width: number }>(evt, {
    onDrag: () => ({ width: column.width }),
    onMove: ({ x }) => {
      const width = Math.round(
        getResultInRange((x - left) / scale, DEFAULT_COLUMN_MIN_WIDTH, Infinity)
      );
      preview.display(width * scale, tableRect.top, rectList, left);
      return {
        width,
      };
    },
    onDrop: ({ width }) => {
      column.updateWidth(width);
    },
    onClear: () => {
      tableContainer.style.pointerEvents = 'auto';
      preview.remove();
    },
  });
};
export const showWidthAdjustmentBar = (
  tableContainer: HTMLElement,
  left: number
) => {
  const tableRect = tableContainer.getBoundingClientRect();
  const rectList = getGroupRectList(tableContainer);
  return getWidthAdjustPreview().display(0, tableRect.top, rectList, left);
};
export const hideWidthAdjustmentBar = () => {
  return getWidthAdjustPreview().remove();
};
let preview: WidthAdjustPreview | null = null;
type WidthAdjustPreview = {
  display: (
    width: number,
    top: number,
    lines: GroupRectList,
    left: number
  ) => void;
  remove: () => void;
};
const getWidthAdjustPreview = (): WidthAdjustPreview => {
  if (!preview) {
    const dragBar = new ColumnWidthDragBar();
    preview = {
      display(width: number, top: number, lines: GroupRectList, left: number) {
        document.body.append(dragBar);
        dragBar.left = left;
        dragBar.lines = lines;
        dragBar.top = top;
        dragBar.width = width;
      },
      remove() {
        dragBar.remove();
      },
    };
  }

  return preview;
};

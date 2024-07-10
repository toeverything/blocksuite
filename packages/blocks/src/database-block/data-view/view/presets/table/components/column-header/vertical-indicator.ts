import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { startDrag } from '../../../../../utils/drag.js';
import { getResultInRange } from '../../../../../utils/utils.js';
import { DEFAULT_COLUMN_MIN_WIDTH } from '../../consts.js';
import type { DataViewTableColumnManager } from '../../table-view-manager.js';

type GroupRectList = {
  top: number;
  bottom: number;
}[];

@customElement('data-view-table-vertical-indicator')
export class TableVerticalIndicator extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    data-view-table-vertical-indicator {
      position: fixed;
      left: 0;
      top: 0;
      z-index: 1;
      pointer-events: none;
    }

    .vertical-indicator-container {
      position: absolute;
      pointer-events: none;
    }

    .vertical-indicator-group {
      position: absolute;
      z-index: 1;
      width: 100%;
      background-color: var(--affine-hover-color);
      pointer-events: none;
    }
    .vertical-indicator-group::after {
      position: absolute;
      z-index: 1;
      width: 2px;
      height: 100%;
      content: '';
      right: 0;
      background-color: var(--affine-primary-color);
      border-radius: 1px;
    }
    .with-shadow.vertical-indicator-group::after {
      box-shadow: 0px 0px 8px 0px rgba(30, 150, 235, 0.35);
    }
  `;

  @property({ attribute: false })
  accessor top!: number;

  @property({ attribute: false })
  accessor left!: number;

  @property({ attribute: false })
  accessor width!: number;

  @property({ attribute: false })
  accessor lines!: GroupRectList;

  @property({ attribute: false })
  accessor shadow = false;

  protected override render(): unknown {
    const containerStyle = styleMap({
      top: `${this.top}px`,
      left: `${this.left}px`,
      width: `${Math.max(this.width, 1)}px`,
    });
    return html`
      <div class="vertical-indicator-container" style=${containerStyle}>
        ${repeat(this.lines, ({ top, bottom }) => {
          const groupStyle = styleMap({
            top: `${top}px`,
            height: `${bottom - top}px`,
          });
          const groupClass = classMap({
            'with-shadow': this.shadow,
            'vertical-indicator-group': true,
          });
          return html`<div class="${groupClass}" style=${groupStyle}></div>`;
        })}
      </div>
    `;
  }
}

export const getTableGroupRects = (tableContainer: HTMLElement) => {
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
  const scale = width / column.width;
  const tableRect = tableContainer.getBoundingClientRect();
  const left =
    tableContainer
      .querySelector(
        `affine-database-header-column[data-column-id='${column.id}']`
      )
      ?.getBoundingClientRect().left ?? 0;
  const rectList = getTableGroupRects(tableContainer);
  const preview = getVerticalIndicator();
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
let preview: VerticalIndicator | null = null;
type VerticalIndicator = {
  display: (
    width: number,
    top: number,
    lines: GroupRectList,
    left: number,
    shadow?: boolean
  ) => void;
  remove: () => void;
};
export const getVerticalIndicator = (): VerticalIndicator => {
  if (!preview) {
    const dragBar = new TableVerticalIndicator();
    preview = {
      display(
        width: number,
        top: number,
        lines: GroupRectList,
        left: number,
        shadow = false
      ) {
        document.body.append(dragBar);
        dragBar.left = left;
        dragBar.lines = lines;
        dragBar.top = top;
        dragBar.width = width;
        dragBar.shadow = shadow;
      },
      remove() {
        dragBar.remove();
      },
    };
  }

  return preview;
};

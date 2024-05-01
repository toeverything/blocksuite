import { ShadowlessElement } from '@blocksuite/block-std';
import { assertEquals } from '@blocksuite/global/utils';
import { DocCollection, type Text } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';

import { tRichText } from '../../../../logical/data-type.js';
import type { DataViewTable } from '../table-view.js';
import type { TableViewSelection } from '../types.js';

@customElement('data-view-drag-to-fill')
export class DragToFillElement extends ShadowlessElement {
  static override styles = css`
    .drag-to-fill {
      border-radius: 50%;
      box-sizing: border-box;
      background-color: var(--affine-background-primary-color);
      border: 2px solid var(--affine-primary-color);
      display: none;
      position: absolute;
      cursor: ns-resize;
      width: 10px;
      height: 10px;
      transform: translate(-50%, -50%);
      pointer-events: auto;
      user-select: none;
      transition: scale 0.2s ease;
      z-index: 2;
    }
    .drag-to-fill.dragging {
      scale: 1.1;
    }
  `;

  @state()
  dragging = false;

  dragToFillRef = createRef<HTMLDivElement>();

  override render() {
    // TODO add tooltip
    return html`<div
      ${ref(this.dragToFillRef)}
      draggable="true"
      data-drag-to-fill="true"
      class="drag-to-fill ${this.dragging ? 'dragging' : ''}"
    ></div>`;
  }
}

export function fillSelectionWithFocusCellData(
  host: DataViewTable,
  selection: TableViewSelection
) {
  const { groupKey, rowsSelection, columnsSelection, focus } = selection;

  const focusCell = host.selectionController.getCellContainer(
    groupKey,
    focus.rowIndex,
    focus.columnIndex
  );

  if (!focusCell) return;

  if (rowsSelection && columnsSelection) {
    assertEquals(
      columnsSelection.start,
      columnsSelection.end,
      'expected selections on a single column'
    );

    const curCol = focusCell.column; // we are sure that we are always in the same column while iterating through rows
    const focusData = curCol.getValue(focusCell.rowId);

    const draggingColIdx = columnsSelection.start;
    const { start, end } = rowsSelection;

    for (let i = start; i <= end; i++) {
      if (i === focus.rowIndex) continue;

      const cellContainer = host.selectionController.getCellContainer(
        groupKey,
        i,
        draggingColIdx
      );

      if (!cellContainer) continue;

      const curRowId = cellContainer.rowId;

      if (tRichText.is(curCol.dataType)) {
        const focusCellText = focusData as Text | undefined;

        const delta = focusCellText?.toDelta() ?? [{ insert: '' }];
        const curCellText = curCol.getValue(curRowId) as Text | undefined;

        if (curCellText) {
          curCellText.clear();
          curCellText.applyDelta(delta);
        } else {
          const newText = new DocCollection.Y.Text();
          newText.applyDelta(delta);
          curCol.setValue(curRowId, newText);
        }
      } else {
        curCol.setValue(curRowId, focusData);
      }
    }
  }
}

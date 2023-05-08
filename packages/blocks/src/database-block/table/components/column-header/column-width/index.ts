import { assertExists, DisposableGroup } from '@blocksuite/global/utils';

import type { DatabaseBlockModel } from '../../../../database-model.js';
import {
  DEFAULT_ADD_BUTTON_WIDTH,
  DEFAULT_COLUMN_MIN_WIDTH,
} from '../../../consts.js';

type ColumnWidthConfig = {
  index: number;
  rafId?: number;
  rawWidth: number;
  scrollLeft: number;
  lastClientX: number;
  startClientX: number;
  currentCell: HTMLElement;
  rowCells: HTMLElement[];
};

export function initChangeColumnWidthHandlers(
  headerContainer: HTMLElement,
  tableContainer: HTMLElement,
  targetModel: DatabaseBlockModel,
  changeActiveColumnIndex: (index: number) => void
) {
  let changeColumnWidthConfig: ColumnWidthConfig | null = null;

  const onColumnWidthPointerdown = (event: PointerEvent, index: number) => {
    // all rows cell in current column
    const currentColumnCells = Array.from(
      tableContainer.querySelectorAll<HTMLElement>(
        `.database-cell:nth-child(${index + 1})`
      )
    );

    const dragHandleCell = headerContainer.querySelector<HTMLElement>(
      `.database-cell:nth-child(${index + 1})`
    );
    assertExists(dragHandleCell);

    const parentElement = tableContainer.parentElement;
    assertExists(parentElement);
    changeColumnWidthConfig = {
      index,
      rowCells: currentColumnCells,
      scrollLeft: parentElement.scrollLeft,
      lastClientX: event.clientX,
      startClientX: event.clientX,
      rawWidth: currentColumnCells[0].clientWidth,
      currentCell: dragHandleCell,
      rafId: undefined,
    };
    changeActiveColumnIndex(index);
  };

  const onColumnWidthPointermove = (event: PointerEvent) => {
    if (!changeColumnWidthConfig) return;

    const {
      rafId,
      rowCells,
      rawWidth,
      lastClientX,
      startClientX,
      scrollLeft: startScrollLeft,
    } = changeColumnWidthConfig;

    if (event.clientX - lastClientX === 0) return;

    const direction = event.clientX - lastClientX > 0 ? 'right' : 'left';
    changeColumnWidthConfig.lastClientX = event.clientX;

    const onUpdateDOM = () => {
      const columnWidth =
        rawWidth + event.clientX - startClientX <= DEFAULT_COLUMN_MIN_WIDTH
          ? DEFAULT_COLUMN_MIN_WIDTH
          : rawWidth + event.clientX - startClientX;

      // update column width
      rowCells.forEach(cell => {
        cell.style.width = `${columnWidth}px`;
        const titleText = cell.querySelector<HTMLDivElement>(
          '.affine-database-column-text-input'
        );
        if (titleText) {
          // 54px is the width of other elements of the column
          titleText.style.width = `${columnWidth - 54}px`;
        }
      });

      // scroll when crossing the right border
      const parentElement = tableContainer.parentElement;
      assertExists(parentElement);
      const { right: boundaryRight, left: boundaryLeft } =
        parentElement.getBoundingClientRect();
      // the distance from the drag handle to the right border
      const dragHandleRight =
        event.clientX - boundaryRight + DEFAULT_ADD_BUTTON_WIDTH;
      // x
      if (dragHandleRight >= 0) {
        // → | →
        // the `|` is boundary
        if (direction === 'right') {
          // 1. Drag right 100 (scroll distance 100)
          // 2. Drag left 30 (scroll distance unchanged)
          // 3. At this point, dragging further to the right should keep the 100
          parentElement.scrollLeft = Math.max(
            parentElement.scrollLeft,
            startScrollLeft + dragHandleRight
          );
        } else {
          // → | ←
          let scrollLeft = parentElement.scrollLeft;
          if (dragHandleRight <= DEFAULT_ADD_BUTTON_WIDTH) {
            scrollLeft += dragHandleRight;
          }
          parentElement.scrollLeft = Math.min(
            scrollLeft,
            startScrollLeft + dragHandleRight
          );
        }
        return;
      }

      // scroll when crossing the left border
      const dragHandleLeft =
        event.clientX - boundaryLeft - DEFAULT_ADD_BUTTON_WIDTH;
      // ← | ←
      if (dragHandleLeft <= 0 && parentElement.scrollLeft > 0) {
        parentElement.scrollLeft = startScrollLeft + dragHandleLeft;
      }
    };
    if (rafId) cancelAnimationFrame(rafId);
    changeColumnWidthConfig.rafId = requestAnimationFrame(onUpdateDOM);
  };

  const onColumnWidthPointerup = (event: PointerEvent) => {
    changeActiveColumnIndex(-1);
    if (!changeColumnWidthConfig) return;
    const { rafId, index, rowCells } = changeColumnWidthConfig;
    if (rafId) cancelAnimationFrame(rafId);
    changeColumnWidthConfig = null;

    const columnWidth = rowCells[0].offsetWidth;
    targetModel.page.captureSync();
    if (index === 0) {
      targetModel.page.updateBlock(targetModel, {
        titleColumnWidth: columnWidth,
      });
    } else {
      const columnId = targetModel.columns[index - 1].id;
      const columnProps = targetModel.getColumn(columnId);
      targetModel.updateColumn({
        ...columnProps,
        width: columnWidth,
      });
      targetModel.applyColumnUpdate();
    }
  };

  const disposables = new DisposableGroup();
  const dragHandles = headerContainer.querySelectorAll<HTMLDivElement>(
    '.affine-database-column-drag-handle'
  );
  dragHandles.forEach((dragHandle, index) => {
    disposables.addFromEvent(dragHandle, 'pointerdown', (event: PointerEvent) =>
      onColumnWidthPointerdown(event, index)
    );
  });

  disposables.addFromEvent(document, 'pointermove', onColumnWidthPointermove);
  disposables.addFromEvent(document, 'pointerup', onColumnWidthPointerup);
  return disposables;
}

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { DatabaseTableViewRowSelect } from '../../../../std.js';

type SelectionState = Pick<DatabaseTableViewRowSelect, 'databaseId' | 'rowIds'>;
type SelectionCache = {
  left: number;
  top: number;
  height: number;
  rowIds: string[];
};

@customElement('database-row-level-selection')
export class RowLevelSelection extends WithDisposable(LitElement) {
  static override styles = css`
    .database-row-level-selection {
      position: absolute;
      z-index: 1;
      box-sizing: border-box;
      width: 100%;
      border: 2px solid var(--affine-primary-color);
      border-radius: 2px;
      background: var(--affine-primary-color-04);
    }
  `;

  private _selectionCache: SelectionCache | null = null;

  @property()
  container!: HTMLElement;

  @state()
  state: SelectionState | null = null;

  setSelection = ({ databaseId, rowIds }: SelectionState) => {
    this.state = {
      databaseId,
      rowIds,
    };
  };

  clearSelection = () => {
    this.state = null;
  };

  private _getStyles = () => {
    const hideStyles = styleMap({
      left: 0,
      top: 0,
      height: 0,
      display: 'none',
    });
    if (!this.state) return hideStyles;

    const { rowIds } = this.state;
    const { startRow, endRow } = getRowsByIds(this.container, {
      startRowId: rowIds[0],
      endRowId: rowIds[rowIds.length - 1],
    });

    if (!startRow || !endRow) return hideStyles;

    if (this._selectionCache) {
      const { left, top, height, rowIds: cacheRowIds } = this._selectionCache;
      if (isRowIdsSame(rowIds, cacheRowIds)) {
        return styleMap({
          left: `${left}px`,
          top: `${top}px`,
          height: `${height}px`,
        });
      }
    }

    const containerPos = this.container.getBoundingClientRect();
    const { left, top } = startRow.getBoundingClientRect();
    const height = calcSelectionHeight(this.container, rowIds);

    const styleLeft = left - containerPos.left;
    const styleTop = top - containerPos.top;
    const styles = styleMap({
      left: `${styleLeft}px`,
      top: `${styleTop}px`,
      height: `${height}px`,
    });

    this._selectionCache = {
      left: styleLeft,
      top: styleTop,
      height,
      rowIds,
    };
    return styles;
  };

  override render() {
    const styles = this._getStyles();
    return html`<div
      class="database-row-level-selection"
      style=${styles}
    ></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'database-row-level-selection': RowLevelSelection;
  }
}

function getRowsByIds(
  container: Element,
  { startRowId, endRowId }: { startRowId: string; endRowId: string }
) {
  const startRow = container.querySelector(
    `.database-row[data-row-id="${startRowId}"]`
  );
  const endRow = container.querySelector(
    `.database-row[data-row-id="${endRowId}"]`
  );

  return {
    startRow,
    endRow,
  };
}

function calcSelectionHeight(container: Element, rowIds: string[]) {
  return rowIds.reduce((acc, rowId) => {
    const row = container.querySelector(
      `.database-row[data-row-id="${rowId}"]`
    );
    if (!row) {
      return acc;
    }
    const { height } = row.getBoundingClientRect();
    return acc + height;
  }, 0);
}

function isRowIdsSame(rowIds: string[], rowIdsCache: string[]) {
  // ids are in the same order, so a simplified comparison can be done
  return rowIds.toString() === rowIdsCache.toString();
}

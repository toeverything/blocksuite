import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { DatabaseTableViewRowState } from '../../../../std.js';

type SelectionState = Pick<DatabaseTableViewRowState, 'databaseId' | 'rowIds'>;
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
  state: SelectionState = {
    databaseId: '',
    rowIds: [],
  };

  setSelection = ({ databaseId, rowIds }: SelectionState) => {
    this.state = {
      databaseId,
      rowIds,
    };
  };

  clearSelection = () => {
    this.state = {};
  };

  private _getStyles = () => {
    const { rowIds = [] } = this.state;
    const { startRow, endRow } = getRowsByIds(this.container, {
      startRowId: rowIds[0],
      endRowId: rowIds[rowIds.length - 1],
    });

    if (rowIds.length === 0 || !startRow || !endRow) {
      return {
        left: 0,
        top: 0,
        height: 0,
        display: 'none',
      };
    }

    if (this._selectionCache) {
      const { left, top, height, rowIds: cacheRowIds } = this._selectionCache;
      if (isRowIdsSame(rowIds, cacheRowIds)) {
        return {
          left,
          top,
          height,
        };
      }
    }

    const containerPos = this.container.getBoundingClientRect();
    const { left, top } = startRow.getBoundingClientRect();
    const height = calcSelectionHeight(this.container, rowIds);

    const styles = {
      left: left - containerPos.left,
      top: top - containerPos.top,
      height,
    };

    this._selectionCache = {
      left: styles.left,
      top: styles.top,
      height,
      rowIds,
    };
    return styles;
  };

  override render() {
    const { left, top, height, display } = this._getStyles();

    const styles = styleMap({
      display,
      left: `${left}px`,
      top: `${top}px`,
      height: `${height}px`,
    });

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

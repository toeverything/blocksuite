import { WithDisposable } from '@blocksuite/lit';
import { assertExists } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { DatabaseTableState } from '../../../std.js';

type SelectionState = Pick<DatabaseTableState, 'databaseId' | 'rowIds'>;

@customElement('database-row-level-selection')
export class RowLevelSelection extends WithDisposable(LitElement) {
  static override styles = css`
    .database-row-level-selection {
      position: absolute;
      width: 100%;
      z-index: 1;
      box-sizing: border-box;
      border: 2px solid var(--affine-primary-color);
      border-radius: 2px;
      background: var(--affine-primary-color-04);
    }
  `;

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

    const startIndex = getRowIndex(startRow);
    const endIdex = getRowIndex(endRow);

    const containerPos = this.container.getBoundingClientRect();
    const { left, top, height } = startRow.getBoundingClientRect();

    return {
      left: left - containerPos.left,
      top: top - containerPos.top,
      height:
        startIndex === endIdex ? height : (endIdex - startIndex + 1) * height,
    };
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

function getRowIndex(row: Element) {
  const rowIndex = row?.getAttribute('data-row-index');
  assertExists(rowIndex);
  return Number(rowIndex);
}

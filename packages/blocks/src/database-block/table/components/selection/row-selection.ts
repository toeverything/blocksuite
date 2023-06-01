import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { DatabaseTableViewRowSelect } from '../../../../std.js';

type SelectionState = Pick<DatabaseTableViewRowSelect, 'databaseId' | 'rowIds'>;

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

  private get _zoom() {
    const edgelessPageBlock = document.querySelector('affine-edgeless-page');
    if (!edgelessPageBlock) return 1;
    return edgelessPageBlock.surface.viewport.zoom;
  }

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

    const containerPos = this.container.getBoundingClientRect();
    const { left, top } = startRow.getBoundingClientRect();

    const scale = 1 / this._zoom;
    const scaledHeight = calcSelectionHeight(this.container, rowIds) * scale;
    const scaledLeft = (left - containerPos.left) * scale;
    const scaledTop = (top - containerPos.top) * scale;
    const styles = styleMap({
      left: `${scaledLeft}px`,
      top: `${scaledTop}px`,
      height: `${scaledHeight}px`,
    });

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

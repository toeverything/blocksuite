import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { DatabaseTableViewCellSelect } from '../../../../std.js';
import { getCellSelectionRectByCoords, getRowsContainer } from './utils.js';

type SelectionState = Pick<
  DatabaseTableViewCellSelect,
  'databaseId' | 'coords'
>;

@customElement('database-cell-level-selection')
export class CellLevelSelection extends WithDisposable(LitElement) {
  static override styles = css`
    .database-cell-level-selection {
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
  cell!: HTMLElement;

  @state()
  state: SelectionState | null = null;

  setSelection = (state: SelectionState) => {
    this.state = state;
  };

  clearSelection = () => {
    this.state = null;
  };

  private _getStyles = () => {
    if (this.state === null) {
      // Hide selection.
      return styleMap({
        left: 0,
        top: 0,
        height: 0,
        width: 0,
        display: 'none',
      });
    }

    const { databaseId, coords } = this.state;
    const { left, top, width, height } = getCellSelectionRectByCoords(
      coords,
      databaseId
    );
    const rowsContainer = getRowsContainer(databaseId);
    const containerRect = rowsContainer.getBoundingClientRect();
    return styleMap({
      left: `${left - containerRect.left}px`,
      top: `${top - containerRect.top}px`,
      height: `${height}px`,
      width: `${width}px`,
      display: 'block',
    });
  };

  override render() {
    const styles = this._getStyles();
    return html`<div
      class="database-cell-level-selection"
      style=${styles}
    ></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'database-cell-level-selection': CellLevelSelection;
  }
}

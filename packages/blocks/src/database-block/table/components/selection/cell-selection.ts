import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { CellCoord } from '../../../../std.js';
import { getCellSelectionRectByCoord, getRowsContainer } from './utils.js';

type SelectionState = {
  databaseId: string;
  coords: [CellCoord, CellCoord?];
};

const defaultState: SelectionState = {
  databaseId: '',
  coords: [{ rowIndex: 0, cellIndex: 0 }],
};

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
  state: SelectionState = { ...defaultState };

  setSelection = (state: SelectionState) => {
    this.state = state;
  };

  clearSelection = () => {
    this.state = { ...defaultState };
  };

  private _getStyles = () => {
    const { databaseId, coords } = this.state;
    if (!databaseId || !coords) {
      return {
        left: 0,
        top: 0,
        height: 0,
        width: 0,
        display: 'none',
      };
    }

    const { left, top, width, height } = getCellSelectionRectByCoord(
      coords,
      databaseId
    );
    const rowsContainer = getRowsContainer(databaseId);
    const containerRect = rowsContainer.getBoundingClientRect();
    return {
      left: left - containerRect.left,
      top: top - containerRect.top,
      height,
      width,
    };
  };

  override render() {
    const { left, top, height, width, display } = this._getStyles();

    const styles = styleMap({
      display,
      left: `${left}px`,
      top: `${top}px`,
      height: `${height}px`,
      width: `${width}px`,
    });

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

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { DatabaseBlockService } from '../../../database-service.js';
import type { TableViewManager } from '../../table-view-manager.js';
import { getCellSelectionRectByCoords, getRowsContainer } from './utils.js';

@customElement('database-selection')
export class CellLevelSelection extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .database-cell-level-selection {
      position: absolute;
      width: 100%;
      z-index: 1;
      box-sizing: border-box;
      border: 2px solid var(--affine-primary-color);
      border-radius: 2px;
      pointer-events: none;
    }
  `;

  @property()
  view!: TableViewManager;
  @property()
  service!: DatabaseBlockService;

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.service.slots.databaseSelectionUpdated.on(selection => {
        //
      })
    );
  }

  private get _zoom() {
    const edgelessPageBlock = document.querySelector('affine-edgeless-page');
    if (!edgelessPageBlock) return 1;
    return edgelessPageBlock.surface.viewport.zoom;
  }

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

    const { databaseId, focus } = this.state;
    const { left, top, width, height } = getCellSelectionRectByCoords(
      focus,
      databaseId
    );
    const rowsContainer = getRowsContainer(databaseId);
    const containerRect = rowsContainer.getBoundingClientRect();

    const scale = 1 / this._zoom;
    const scaledLeft = (left - containerRect.left) * scale;
    const scaledTop = (top - containerRect.top) * scale;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    return styleMap({
      left: `${scaledLeft}px`,
      top: `${scaledTop}px`,
      height: `${scaledHeight}px`,
      width: `${scaledWidth}px`,
      display: 'block',
      borderColor: this.state.isEditing ? '#90b19c' : undefined,
    });
  };

  override render() {
    const styles = this._getStyles();
    return html` <div
      class="database-cell-level-selection"
      style=${styles}
    ></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'database-selection': CellLevelSelection;
  }
}

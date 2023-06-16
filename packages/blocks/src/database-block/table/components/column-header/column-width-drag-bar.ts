import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { ColumnManager } from '../../table-view-manager.js';
const dragBarWidth = 16;
@customElement('affine-database-column-width-drag-bar')
export class ColumnWidthDragBar extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .column-width-drag-bar {
      height: 100%;
      position: absolute;
      top: 0;
      cursor: col-resize;
      display: flex;
      justify-content: center;
    }
    .preview-bar {
      width: 2px;
      height: 100%;
      background-color: blue;
      transition: 0.3s opacity;
      opacity: 0;
    }
    .column-width-drag-bar:hover .preview-bar {
      opacity: 1;
    }
  `;
  @property()
  left!: number;
  @property()
  column!: ColumnManager;
  private _startDrag = (evt: MouseEvent) => {
    evt;
  };
  override render() {
    const style = styleMap({
      left: `${this.left - dragBarWidth / 2}px`,
      width: `${dragBarWidth}px`,
    });
    return html`
      <div
        style=${style}
        class="column-width-drag-bar"
        @mousedown=${this._startDrag}
      >
        <div class="preview-bar"></div>
      </div>
    `;
  }
}

import { css } from 'lit';
import { customElement } from 'lit/decorators.js';

import { EdgelessColorPanel } from './color-panel.js';
import { colorContainerStyles } from './color-panel.js';

@customElement('edgeless-one-row-color-panel')
export class EdgelessOneRowColorPanel extends EdgelessColorPanel {
  static override styles = css`
    :host {
      display: flex;
      flex-wrap: nowrap;
      padding: 0 2px;
      gap: 14px;
      box-sizing: border-box;
      background: var(--affine-background-overlay-panel-color);
    }

    ${colorContainerStyles}

    .color-container {
      width: 20px;
      height: 20px;
    }
    .color-container::before {
      content: '';
      position: absolute;
      width: 2px;
      right: calc(100% + 7px);
      height: 100%;
      // FIXME: not working
      scroll-snap-align: start;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-one-row-color-panel': EdgelessOneRowColorPanel;
  }
}

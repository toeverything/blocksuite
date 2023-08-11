import { css } from 'lit';
import { customElement } from 'lit/decorators.js';

import { EdgelessColorPanel } from './color-panel.js';
import { colorContainerStyles } from './color-panel.js';

@customElement('edgeless-one-row-color-panel')
export class EdgelessOneRowColorPanel extends EdgelessColorPanel {
  static override styles = css`
    :host {
      display: flex;
      width: 400px;
      padding: 8px 12px;
      gap: 12px;
      box-sizing: border-box;
      background: var(--affine-popover-background);
    }

    ${colorContainerStyles}
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-one-row-color-panel': EdgelessOneRowColorPanel;
  }
}

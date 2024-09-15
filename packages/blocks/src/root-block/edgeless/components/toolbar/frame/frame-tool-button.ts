import {
  ArrowUpIcon,
  LargeFrameIcon,
} from '@blocksuite/affine-components/icons';
import { css, html, LitElement } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessTool } from '../../../types.js';

import { getTooltipWithShortcut } from '../../../components/utils.js';
import { QuickToolMixin } from '../mixins/quick-tool.mixin.js';

export class EdgelessFrameToolButton extends QuickToolMixin(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }

    .arrow-up-icon {
      position: absolute;
      top: 4px;
      right: 2px;
      font-size: 0;
    }
  `;

  override type: EdgelessTool['type'] = 'frame';

  private _toggleFrameMenu() {
    if (this.tryDisposePopper()) return;

    const menu = this.createPopper('edgeless-frame-menu', this);
    menu.element.edgeless = this.edgeless;
  }

  override render() {
    const type = this.edgelessTool?.type;
    const arrowColor =
      type === 'frame' ? 'currentColor' : 'var(--affine-icon-secondary)';
    return html`
      <edgeless-tool-icon-button
        class="edgeless-frame-button"
        .tooltip=${this.popper ? '' : getTooltipWithShortcut('Frame', 'F')}
        .tooltipOffset=${17}
        .active=${type === 'frame'}
        .iconContainerPadding=${6}
        @click=${() => {
          // don't update tool before toggling menu
          this._toggleFrameMenu();
          this.setEdgelessTool({ type: 'frame' });
        }}
      >
        ${LargeFrameIcon}
        <span class="arrow-up-icon" style=${styleMap({ color: arrowColor })}>
          ${ArrowUpIcon}
        </span>
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frame-tool-button': EdgelessFrameToolButton;
  }
}

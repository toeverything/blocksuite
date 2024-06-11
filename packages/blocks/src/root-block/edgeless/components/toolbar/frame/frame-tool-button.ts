import '../../buttons/tool-icon-button.js';
import './frame-menu.js';

import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ArrowUpIcon,
  LargeFrameIcon,
} from '../../../../../_common/icons/index.js';
import type { EdgelessTool } from '../../../../../_common/utils/index.js';
import { getTooltipWithShortcut } from '../../../components/utils.js';
import { QuickToolMixin } from '../mixins/quick-tool.mixin.js';

@customElement('edgeless-frame-tool-button')
export class EdgelessFrameToolButton extends QuickToolMixin(LitElement) {
  override type: EdgelessTool['type'] = 'frame';

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
          this.setEdgelessTool({
            type: 'frame',
          });
          this._toggleFrameMenu();
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

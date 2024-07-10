import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { FrameNavigatorIcon } from '../../../../../_common/icons/edgeless.js';
import type { EdgelessTool } from '../../../types.js';
import { QuickToolMixin } from '../mixins/quick-tool.mixin.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';

@customElement('edgeless-present-button')
export class EdgelessPresentButton extends QuickToolMixin(
  EdgelessToolbarToolMixin(LitElement)
) {
  static override styles = css`
    :host {
      display: flex;
    }
    .edgeless-note-button {
      display: flex;
      position: relative;
    }
    .arrow-up-icon {
      position: absolute;
      top: 4px;
      right: 2px;
      font-size: 0;
    }
  `;

  override type: EdgelessTool['type'] = 'frameNavigator';

  override render() {
    return html`<edgeless-tool-icon-button
    class="edgeless-frame-navigator-button"
    .tooltip=${'Present'}
    .tooltipOffset=${17}
    .iconContainerPadding=${6}
    @click=${() => {
      this.setEdgelessTool({
        type: 'frameNavigator',
      });
    }}
  >
    ${FrameNavigatorIcon}
    </edgeless-tool-icon-button>
  </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-present-button': EdgelessPresentButton;
  }
}

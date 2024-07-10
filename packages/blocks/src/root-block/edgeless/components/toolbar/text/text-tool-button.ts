import '../../buttons/toolbar-button.js';
import './text-menu.js';

import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EdgelessTextIcon } from '../../../../../_common/icons/index.js';
import type { LastProps } from '../../../../../surface-block/managers/edit-session.js';
import { GET_DEFAULT_TEXT_COLOR } from '../../panel/color-panel.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';

/**
 * @deprecated not used
 */
@customElement('edgeless-text-tool-button')
export class EdgelessTextToolButton extends EdgelessToolbarToolMixin(
  LitElement
) {
  static override styles = css`
    :host {
      display: flex;
    }
    .edgeless-text-button {
      position: relative;
      width: 54px;
      height: 44px;
      overflow-y: hidden;
    }
  `;

  @state()
  accessor states: Partial<LastProps['text']> = {
    color: GET_DEFAULT_TEXT_COLOR(),
  };

  override type = 'text' as const;

  private _toggleTextMenu() {
    if (this.popper) {
      this.requestUpdate();
    } else {
      this.edgeless.tools.setEdgelessTool({
        type: this.type,
      });
    }
  }

  override render() {
    const { active } = this;

    return html`
      <edgeless-toolbar-button
        class="edgeless-text-button"
        .tooltip=${this.popper ? '' : getTooltipWithShortcut('Text', 'T')}
        .tooltipOffset=${15}
        .active=${active}
        .activeMode=${'background'}
        @click=${() => {
          this._toggleTextMenu();
        }}
      >
        <div class="edgeless-text-button">
          <div class=${active ? 'active-mode' : ''}></div>
          <div style=${styleMap({ color: `var(${this.states.color})` })}>
            ${EdgelessTextIcon}
          </div>
        </div>
      </edgeless-toolbar-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-text-tool-button': EdgelessTextToolButton;
  }
}

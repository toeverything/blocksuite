import '../../buttons/toolbar-button.js';
import './text-menu.js';

import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EdgelessTextIcon } from '../../../../../_common/icons/index.js';
import { GET_DEFAULT_TEXT_COLOR } from '../../panel/color-panel.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { createPopper } from '../common/create-popper.js';
import { ToolbarButtonWithMenuMixin } from '../mixins/toolbar-button-with-menu.mixin.js';
import type { EdgelessTextMenu } from './text-menu.js';

@customElement('edgeless-text-tool-button')
export class EdgelessTextToolButton extends ToolbarButtonWithMenuMixin<
  EdgelessTextMenu,
  'text',
  readonly ['color']
>(LitElement) {
  static styles = css`
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
  accessor color = GET_DEFAULT_TEXT_COLOR();

  override type = 'text' as const;

  override _type = 'text' as const;

  protected override _states = ['color'] as const;

  private _toggleTextMenu() {
    if (this._menu) {
      this.requestUpdate();
    } else {
      this.edgeless.tools.setEdgelessTool({
        type: this._type,
      });
      this._menu = createPopper('edgeless-text-menu', this);
      this.updateMenu();
      this._menu.element.edgeless = this.edgeless;
      this._menu.element.onChange = (props: Record<string, unknown>) => {
        this.edgeless.service.editPropsStore.record(this._type, props);
      };
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (this._states.some(key => changedProperties.has(key))) {
      if (this._menu) {
        this.updateMenu();
      }
    }
  }

  override render() {
    const { active } = this;

    return html`
      <edgeless-toolbar-button
        class="edgeless-text-button"
        .tooltip=${this._menu ? '' : getTooltipWithShortcut('Text', 'T')}
        .tooltipOffset=${15}
        .active=${active}
        .activeMode=${'background'}
        @click=${() => {
          this._toggleTextMenu();
        }}
      >
        <div class="edgeless-text-button">
          <div class=${active ? 'active-mode' : ''}></div>
          <div style=${styleMap({ color: `var(${this.color})` })}>
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

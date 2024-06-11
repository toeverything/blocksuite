import '../../buttons/toolbar-button.js';
import './brush-menu.js';

import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  EdgelessPenDarkIcon,
  EdgelessPenLightIcon,
} from '../../../../../_common/icons/edgeless.js';
import { LineWidth } from '../../../../../_common/utils/index.js';
import { DEFAULT_BRUSH_COLOR } from '../../panel/color-panel.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { ToolbarButtonWithMenuMixin } from '../mixins/toolbar-button-with-menu.mixin.js';
import type { EdgelessBrushMenu } from './brush-menu.js';

@customElement('edgeless-brush-tool-button')
export class EdgelessBrushToolButton extends ToolbarButtonWithMenuMixin<
  EdgelessBrushMenu,
  'brush',
  readonly ['color', 'lineWidth']
>(LitElement) {
  override type = 'brush' as const;

  override _type = 'brush' as const;

  override enableActiveBackground = true;

  static styles = css`
    :host {
      display: flex;
      height: 100%;
      overflow-y: hidden;
    }
    .edgeless-brush-button {
      height: 100%;
    }
    .pen-wrapper {
      width: 35px;
      height: 64px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    #edgeless-pen-icon {
      transition: transform 0.3s ease-in-out;
      transform: translateY(8px);
    }
    .edgeless-brush-button:hover #edgeless-pen-icon,
    .pen-wrapper.active #edgeless-pen-icon {
      transform: translateY(0);
    }
  `;

  @state()
  accessor color: string = DEFAULT_BRUSH_COLOR;

  @state()
  accessor lineWidth = LineWidth.Four;

  protected override readonly _states = ['color', 'lineWidth'] as const;

  private _toggleBrushMenu() {
    if (this.tryDisposePopper()) return;
    !this.active && this.setEdgelessTool({ type: this._type });
    const menu = this.createPopper('edgeless-brush-menu', this, {
      onDispose: () => (this._menu = null),
    });
    this._menu = menu;
    Object.assign(menu.element, {
      edgeless: this.edgeless,
      onChange: (props: Record<string, unknown>) => {
        this.edgeless.service.editPropsStore.record(this._type, props);
      },
    });
    this.updateMenu();
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (this._states.some(key => changedProperties.has(key))) {
      if (this._menu) {
        this.updateMenu();
        !this.active && this.setEdgelessTool({ type: this._type });
      }
    }
  }

  override render() {
    const { active, theme } = this;
    const icon = theme === 'dark' ? EdgelessPenDarkIcon : EdgelessPenLightIcon;

    return html`
      <edgeless-toolbar-button
        class="edgeless-brush-button"
        .tooltip=${this._menu ? '' : getTooltipWithShortcut('Pen', 'P')}
        .tooltipOffset=${4}
        .active=${active}
        .withHover=${true}
        @click=${() => {
          this._toggleBrushMenu();
        }}
      >
        <div
          style=${styleMap({ color: `var(${this.color})` })}
          class="pen-wrapper"
        >
          ${icon}
        </div>
      </edgeless-toolbar-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-brush-tool-button': EdgelessBrushToolButton;
  }
}

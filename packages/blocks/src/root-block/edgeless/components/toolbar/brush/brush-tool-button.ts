import '../../buttons/toolbar-button.js';
import './brush-menu.js';

import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EdgelessPenIcon } from '../../../../../_common/icons/index.js';
import { LineWidth } from '../../../../../_common/utils/index.js';
import { DEFAULT_BRUSH_COLOR } from '../../panel/color-panel.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { createPopper } from '../common/create-popper.js';
import { EdgelessToolButton } from '../edgeless-toolbar-button.js';
import type { EdgelessBrushMenu } from './brush-menu.js';

@customElement('edgeless-brush-tool-button')
export class EdgelessBrushToolButton extends EdgelessToolButton<
  EdgelessBrushMenu,
  'brush',
  readonly ['color', 'lineWidth']
> {
  static override styles = css`
    :host {
      display: flex;
    }
    .edgeless-brush-button {
      position: relative;
      height: 66px;
      width: 40px;
      overflow-y: hidden;
    }
    .active-mode {
      position: absolute;
      top: 4px;
      left: 5px;
      width: 30px;
      height: 66px;
      border-top-left-radius: 22px;
      border-top-right-radius: 22px;
      background: var(--affine-hover-color);
    }
    #edgeless-pen-icon {
      position: absolute;
      left: 3px;
      transform: translateY(10px);
      transition: transform 0.3s ease-in-out;
    }
    #edgeless-pen-icon:hover {
      transform: translateY(5px);
    }
  `;
  @state()
  color: string = DEFAULT_BRUSH_COLOR;

  @state()
  lineWidth = LineWidth.Four;

  protected override _type = 'brush' as const;
  protected override readonly _states = ['color', 'lineWidth'] as const;

  private _toggleBrushMenu() {
    if (this._menu) {
      this._disposeMenu();
    } else {
      this.edgeless.tools.setEdgelessTool({
        type: this._type,
      });
      this._menu = createPopper('edgeless-brush-menu', this, {
        x: 110,
        y: -40,
      });
      this._menu.element.edgeless = this.edgeless;
      this.updateMenu();
      this._menu.element.onChange = (props: Record<string, unknown>) => {
        this.edgeless.service.editPropsStore.record(this._type, props);
      };
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (this._states.some(key => changedProperties.has(key))) {
      if (this._menu) {
        this.updateMenu();
        this.edgeless.tools.setEdgelessTool({
          type: this._type,
        });
      }
    }
  }

  override render() {
    const { active } = this;

    return html`
      <edgeless-toolbar-button
        class="edgeless-brush-button"
        .tooltip=${this._menu ? '' : getTooltipWithShortcut('Pen', 'P')}
        .tooltipOffset=${4}
        .active=${active}
        @click=${() => {
          this._toggleBrushMenu();
        }}
      >
        <div class="edgeless-brush-button">
          <div class=${active ? 'active-mode' : ''}></div>
          <div style=${styleMap({ color: `var(${this.color})` })}>
            ${EdgelessPenIcon}
          </div>
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

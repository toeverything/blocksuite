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
import type { LastProps } from '../../../../../surface-block/managers/edit-session.js';
import { DEFAULT_BRUSH_COLOR } from '../../panel/color-panel.js';
import { getTooltipWithShortcut } from '../../utils.js';
import {
  applyLastProps,
  observeLastProps,
} from '../common/observe-last-props.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';

@customElement('edgeless-brush-tool-button')
export class EdgelessBrushToolButton extends EdgelessToolbarToolMixin(
  LitElement
) {
  static override styles = css`
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

  override type = 'brush' as const;

  override enableActiveBackground = true;

  @state()
  accessor states: LastProps['brush'] = {
    color: DEFAULT_BRUSH_COLOR,
    lineWidth: LineWidth.Four,
  };

  get statesKeys() {
    return Object.keys(this.states) as (keyof LastProps['brush'])[];
  }

  private _toggleBrushMenu() {
    if (this.tryDisposePopper()) return;
    !this.active && this.setEdgelessTool({ type: this.type });
    const menu = this.createPopper('edgeless-brush-menu', this);
    Object.assign(menu.element, {
      edgeless: this.edgeless,
      onChange: (props: Record<string, unknown>) => {
        this.edgeless.service.editPropsStore.recordLastProps('brush', props);
        this.setEdgelessTool({ type: 'brush' });
      },
    });
    this.updateMenu();
  }

  updateMenu() {
    const { popper } = this;
    if (!popper) return;
    Object.assign(popper.element, this.states);
  }

  override connectedCallback() {
    super.connectedCallback();
    const { edgeless, states, statesKeys } = this;
    applyLastProps(edgeless.service, 'brush', statesKeys, states);

    this.disposables.add(
      observeLastProps(
        edgeless.service,
        'brush',
        statesKeys,
        states,
        updates => {
          this.states = { ...this.states, ...updates };
        }
      )
    );
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('states') && this.popper) {
      this.updateMenu();
    }
  }

  override render() {
    const { active, theme } = this;
    const icon = theme === 'dark' ? EdgelessPenDarkIcon : EdgelessPenLightIcon;

    return html`
      <edgeless-toolbar-button
        class="edgeless-brush-button"
        .tooltip=${this.popper ? '' : getTooltipWithShortcut('Pen', 'P')}
        .tooltipOffset=${4}
        .active=${active}
        .withHover=${true}
        @click=${() => {
          this._toggleBrushMenu();
        }}
      >
        <div
          style=${styleMap({ color: `var(${this.states.color})` })}
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

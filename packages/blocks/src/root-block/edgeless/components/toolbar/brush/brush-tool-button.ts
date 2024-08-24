import {
  EdgelessPenDarkIcon,
  EdgelessPenLightIcon,
} from '@blocksuite/affine-components/icons';
import { DEFAULT_BRUSH_COLOR, LineWidth } from '@blocksuite/affine-model';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { LastProps } from '../../../../../surface-block/managers/edit-session.js';

import '../../buttons/toolbar-button.js';
import { getTooltipWithShortcut } from '../../utils.js';
import {
  applyLastProps,
  observeLastProps,
} from '../common/observe-last-props.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';
import './brush-menu.js';

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

  override enableActiveBackground = true;

  override type = 'brush' as const;

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

  override render() {
    const { active, theme } = this;
    const icon = theme === 'dark' ? EdgelessPenDarkIcon : EdgelessPenLightIcon;
    const color = ThemeObserver.generateColorProperty(this.states.color);

    return html`
      <edgeless-toolbar-button
        class="edgeless-brush-button"
        .tooltip=${this.popper ? '' : getTooltipWithShortcut('Pen', 'P')}
        .tooltipOffset=${4}
        .active=${active}
        .withHover=${true}
        @click=${() => this._toggleBrushMenu()}
      >
        <div style=${styleMap({ color })} class="pen-wrapper">${icon}</div>
      </edgeless-toolbar-button>
    `;
  }

  updateMenu() {
    const { popper } = this;
    if (!popper) return;
    Object.assign(popper.element, this.states);
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('states') && this.popper) {
      this.updateMenu();
    }
  }

  get statesKeys() {
    return Object.keys(this.states) as (keyof LastProps['brush'])[];
  }

  @state()
  accessor states: LastProps['brush'] = {
    color: DEFAULT_BRUSH_COLOR,
    lineWidth: LineWidth.Four,
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-brush-tool-button': EdgelessBrushToolButton;
  }
}

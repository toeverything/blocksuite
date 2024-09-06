import {
  EdgelessPenDarkIcon,
  EdgelessPenLightIcon,
} from '@blocksuite/affine-components/icons';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { SignalWatcher } from '@blocksuite/block-std';
import { computed } from '@lit-labs/preact-signals';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import '../../buttons/toolbar-button.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';
import './brush-menu.js';

@customElement('edgeless-brush-tool-button')
export class EdgelessBrushToolButton extends EdgelessToolbarToolMixin(
  SignalWatcher(LitElement)
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

  private _color$ = computed(() => {
    return ThemeObserver.generateColorProperty(
      this.edgeless.service.editPropsStore.lastProps$.value.brush.color
    );
  });

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
  }

  override render() {
    const { active, theme } = this;
    const icon = theme === 'dark' ? EdgelessPenDarkIcon : EdgelessPenLightIcon;
    const color = this._color$.value;

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
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-brush-tool-button': EdgelessBrushToolButton;
  }
}

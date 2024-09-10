import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { computed, SignalWatcher } from '@lit-labs/preact-signals';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../types.js';
import type { LineWidthEvent } from '../../panel/line-width-panel.js';

import '../../buttons/tool-icon-button.js';
import {
  type ColorEvent,
  GET_DEFAULT_LINE_COLOR,
} from '../../panel/color-panel.js';
import '../../panel/one-row-color-panel.js';
import '../common/slide-menu.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';

@customElement('edgeless-brush-menu')
export class EdgelessBrushMenu extends EdgelessToolbarToolMixin(
  SignalWatcher(LitElement)
) {
  static override styles = css`
    :host {
      display: flex;
      position: absolute;
      z-index: -1;
    }

    .menu-content {
      display: flex;
      align-items: center;
    }

    menu-divider {
      height: 24px;
      margin: 0 9px;
    }
  `;

  private _props$ = computed(() => {
    const { color, lineWidth } =
      this.edgeless.service.editPropsStore.lastProps$.value.brush;
    return {
      color,
      lineWidth,
    };
  });

  type: EdgelessTool['type'] = 'brush';

  override render() {
    const color = ThemeObserver.getColorValue(
      this._props$.value.color,
      GET_DEFAULT_LINE_COLOR()
    );

    return html`
      <edgeless-slide-menu>
        <div class="menu-content">
          <edgeless-line-width-panel
            .selectedSize=${this._props$.value.lineWidth}
            @select=${(e: LineWidthEvent) =>
              this.onChange({ lineWidth: e.detail })}
          >
          </edgeless-line-width-panel>
          <menu-divider .vertical=${true}></menu-divider>
          <edgeless-one-row-color-panel
            .value=${color}
            .hasTransparent=${!this.edgeless.doc.awarenessStore.getFlag(
              'enable_color_picker'
            )}
            @select=${(e: ColorEvent) => this.onChange({ color: e.detail })}
          ></edgeless-one-row-color-panel>
        </div>
      </edgeless-slide-menu>
    `;
  }

  @property({ attribute: false })
  accessor onChange!: (props: Record<string, unknown>) => void;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-brush-menu': EdgelessBrushMenu;
  }
}

import '../../panel/one-row-color-panel.js';
import '../../buttons/tool-icon-button.js';
import '../common/slide-menu.js';

import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../types.js';
import type { ColorEvent } from '../../panel/color-panel.js';
import type { LineWidthEvent } from '../../panel/line-width-panel.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';

@customElement('edgeless-brush-menu')
export class EdgelessBrushMenu extends EdgelessToolbarToolMixin(LitElement) {
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

  type: EdgelessTool['type'] = 'brush';

  @property({ attribute: false })
  accessor color!: string;

  @property({ attribute: false })
  accessor lineWidth!: number;

  @property({ attribute: false })
  accessor onChange!: (props: Record<string, unknown>) => void;

  override render() {
    const { color, lineWidth } = this;
    return html`
      <edgeless-slide-menu>
        <div class="menu-content">
          <edgeless-line-width-panel
            .selectedSize=${lineWidth}
            @select=${(e: LineWidthEvent) =>
              this.onChange({ lineWidth: e.detail })}
          >
          </edgeless-line-width-panel>
          <menu-divider .vertical=${true}></menu-divider>
          <edgeless-one-row-color-panel
            .value=${color}
            @select=${(e: ColorEvent) => this.onChange({ color: e.detail })}
          ></edgeless-one-row-color-panel>
        </div>
      </edgeless-slide-menu>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-brush-menu': EdgelessBrushMenu;
  }
}

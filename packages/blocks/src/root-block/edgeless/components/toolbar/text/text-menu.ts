import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../types.js';
import type { ColorEvent } from '../../panel/color-panel.js';

import '../../buttons/tool-icon-button.js';
import '../../panel/one-row-color-panel.js';
import '../common/slide-menu.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';

@customElement('edgeless-text-menu')
export class EdgelessTextMenu extends EdgelessToolbarToolMixin(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      position: absolute;
      z-index: -1;
    }
  `;

  override type: EdgelessTool['type'] = 'text';

  override render() {
    if (this.edgelessTool.type !== 'text') return nothing;

    return html`
      <edgeless-slide-menu>
        <div class="menu-content">
          <edgeless-one-row-color-panel
            .value=${this.color}
            @select=${(e: ColorEvent) => this.onChange({ color: e.detail })}
          ></edgeless-one-row-color-panel>
        </div>
      </edgeless-slide-menu>
    `;
  }

  @property({ attribute: false })
  accessor color!: string;

  @property({ attribute: false })
  accessor onChange!: (props: Record<string, unknown>) => void;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-text-menu': EdgelessTextMenu;
  }
}

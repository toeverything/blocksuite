import '../../panel/one-row-color-panel.js';
import '../../buttons/tool-icon-button.js';
import '../common/slide-menu.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import type { ColorEvent } from '../../panel/color-panel.js';

@customElement('edgeless-text-menu')
export class EdgelessTextMenu extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      position: absolute;
      z-index: -1;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  color!: string;

  @property({ attribute: false })
  onChange!: (props: Record<string, unknown>) => void;

  override render() {
    if (this.edgeless.edgelessTool.type !== 'text') return nothing;

    return html`
      <edgeless-slide-menu .menuWidth=${476}>
        <div class="menu-content">
          <edgeless-one-row-color-panel
            .value=${this.color}
            @select=${(e: ColorEvent) => this.onChange({ color: e.detail })}
          ></edgeless-one-row-color-panel>
        </div>
      </edgeless-slide-menu>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-text-menu': EdgelessTextMenu;
  }
}

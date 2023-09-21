import '../../panel/one-row-color-panel.js';
import '../../buttons/tool-icon-button.js';
import '../common/slide-menu.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../../__internal__/index.js';
import type { CssVariableName } from '../../../../../__internal__/theme/css-variables.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
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
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  private _setTextColor = (color: CssVariableName) => {
    if (this.edgelessTool.type !== 'text') return;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'text',
      color: color,
    });
  };

  override render() {
    if (this.edgelessTool.type !== 'text') return nothing;

    const { color } = this.edgelessTool;
    return html`
      <edgeless-slide-menu .menuWidth=${476}>
        <div class="menu-content">
          <edgeless-one-row-color-panel
            .value=${color}
            @select=${(e: ColorEvent) => this._setTextColor(e.detail)}
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

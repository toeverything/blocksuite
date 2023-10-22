import '../../panel/one-row-color-panel.js';
import '../../buttons/tool-icon-button.js';
import '../common/slide-menu.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { CssVariableName } from '../../../../../_common/theme/css-variables.js';
import type {
  EdgelessTool,
  LineWidth,
} from '../../../../../_common/utils/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import type { ColorEvent } from '../../panel/color-panel.js';
import type { LineWidthEvent } from '../../panel/line-width-panel.js';

@customElement('edgeless-brush-menu')
export class EdgelessBrushMenu extends WithDisposable(LitElement) {
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

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  private _setBrushColor = (color: CssVariableName) => {
    if (this.edgelessTool.type !== 'brush') return;

    const { lineWidth } = this.edgelessTool;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'brush',
      color,
      lineWidth,
    });
  };

  private _setLineWidth = (lineWidth: LineWidth) => {
    if (this.edgelessTool.type !== 'brush') return;

    const { color } = this.edgelessTool;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'brush',
      color,
      lineWidth,
    });
  };

  override render() {
    if (this.edgelessTool.type !== 'brush') return nothing;

    const { color, lineWidth } = this.edgelessTool;

    return html`
      <edgeless-slide-menu>
        <div class="menu-content">
          <edgeless-line-width-panel
            .selectedSize=${lineWidth}
            @select=${(e: LineWidthEvent) => this._setLineWidth(e.detail)}
          >
          </edgeless-line-width-panel>
          <menu-divider .vertical=${true}></menu-divider>
          <edgeless-one-row-color-panel
            .value=${color}
            @select=${(e: ColorEvent) => this._setBrushColor(e.detail)}
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

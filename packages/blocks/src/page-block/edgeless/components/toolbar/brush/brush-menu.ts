import '../../panel/one-row-color-panel.js';
import '../../buttons/tool-icon-button.js';
import '../common/slide-menu.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  BrushSize,
  type EdgelessTool,
} from '../../../../../__internal__/index.js';
import type { CssVariableName } from '../../../../../__internal__/theme/css-variables.js';
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

    .container {
      display: flex;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px 8px 0 0;
      position: relative;
      cursor: default;
    }

    .menu-content {
      display: flex;
      align-items: center;
    }

    menu-divider {
      height: 24px;
    }
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  selectedSize: BrushSize = BrushSize.LINE_WIDTH_FOUR;

  private _setBrushColor = (color: CssVariableName) => {
    if (this.edgelessTool.type !== 'brush') return;

    const { lineWidth } = this.edgelessTool;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'brush',
      color,
      lineWidth,
    });
  };

  private _setBrushSize = (lineWidth: BrushSize) => {
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

    const { color } = this.edgelessTool;

    return html`
      <div class="container">
        <edgeless-slide-menu>
          <div class="menu-content">
            <edgeless-line-width-panel
              .selectedSize=${this.selectedSize}
              .hasTooltip=${false}
              @select=${(e: LineWidthEvent) => this._setBrushSize(e.detail)}
            >
            </edgeless-line-width-panel>
            <menu-divider .vertical=${true}></menu-divider>
            <edgeless-one-row-color-panel
              .value=${color}
              @select=${(e: ColorEvent) => this._setBrushColor(e.detail)}
            ></edgeless-one-row-color-panel>
          </div>
        </edgeless-slide-menu>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-brush-menu': EdgelessBrushMenu;
  }
}

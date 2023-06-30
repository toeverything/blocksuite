import '../../panel/color-panel.js';
import '../../buttons/tool-icon-button.js';

import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../../__internal__/index.js';
import { BrushSize } from '../../../../../__internal__/index.js';
import type { CssVariableName } from '../../../../../__internal__/theme/css-variables.js';
import { tooltipStyle } from '../../../../../components/tooltip/tooltip.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import type { ColorEvent } from '../../panel/color-panel.js';

function BrushSizeButtonGroup(
  edgelessTool: EdgelessTool,
  setBrushWidth: (size: BrushSize) => void
) {
  if (edgelessTool.type !== 'brush') return nothing;

  const { lineWidth } = edgelessTool;
  /**
   * There is little hacky on rendering tooltip.
   * We don't want either tooltip overlap the top button or tooltip on left.
   * So we put the lower button's tooltip as the first element of the button group container
   */
  return html`
    <div class="brush-size-button-group has-tool-tip">
      <!-- This tooltip is for the last button(Thick) -->
      <tool-tip inert role="tooltip" tip-position="top" arrow>Thick</tool-tip>

      <div
        class="brush-size-button has-tool-tip"
        ?active=${lineWidth === BrushSize.Thin}
        @click=${() => setBrushWidth(BrushSize.Thin)}
      >
        <div class="thin"></div>
        <tool-tip inert role="tooltip" tip-position="top" arrow>
          Thin
        </tool-tip>
      </div>

      <div
        class="brush-size-button"
        ?active=${lineWidth === BrushSize.Thick}
        @click=${() => setBrushWidth(BrushSize.Thick)}
      >
        <div class="thick"></div>
      </div>
    </div>
  `;
}

@customElement('edgeless-brush-menu')
export class EdgelessBrushMenu extends LitElement {
  static override styles = css`
    :host {
      position: absolute;
      height: 76px;
      width: 260px;
      z-index: 1;
    }
    .container {
      display: flex;
      padding: 4px;
      justify-content: center;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
    }

    .brush-size-button-group {
      display: flex;
      flex-direction: column;
    }

    .brush-size-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 32px;
      height: 32px;
      box-sizing: border-box;
      border-radius: 4px;
      cursor: pointer;
    }

    .brush-size-button[active],
    .brush-size-button:hover {
      background-color: var(--affine-hover-color);
    }

    .brush-size-button div {
      border-radius: 50%;
      background-color: var(--affine-icon-color);
    }

    .brush-size-button .thin {
      width: 4px;
      height: 4px;
    }

    .brush-size-button .thick {
      width: 10px;
      height: 10px;
    }

    menu-divider {
      height: 62px;
    }

    ${tooltipStyle}
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

  private _setBrushWidth = (lineWidth: BrushSize) => {
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
    const brushSizeButtonGroup = BrushSizeButtonGroup(
      this.edgelessTool,
      this._setBrushWidth
    );

    return html`
      <div class="container">
        ${brushSizeButtonGroup}
        <menu-divider .vertical=${true}></menu-divider>
        <edgeless-color-panel
          .value=${color}
          @select=${(e: ColorEvent) => this._setBrushColor(e.detail)}
        ></edgeless-color-panel>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-brush-menu': EdgelessBrushMenu;
  }
}

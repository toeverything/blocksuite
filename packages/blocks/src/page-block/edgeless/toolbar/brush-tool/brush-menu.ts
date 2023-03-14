import './color-panel.js';
import '../../components/tool-icon-button.js';

import type { Color } from '@blocksuite/phasor';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { MouseMode } from '../../../../__internal__/index.js';
import { BrushSize } from '../../../../__internal__/index.js';
import { tooltipStyle } from '../../../../components/tooltip/tooltip.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import type { ColorEvent } from './color-panel.js';

function BrushSizeButtonGroup(
  mouseMode: MouseMode,
  setBrushWidth: (size: BrushSize) => void
) {
  if (mouseMode.type !== 'brush') return nothing;

  const { lineWidth } = mouseMode;
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
  static styles = css`
    :host {
      width: 260px;
      z-index: 1;
    }
    .container {
      display: flex;
      padding: 4px;
      justify-content: center;
      align-items: center;
      background: var(--affine-page-background);
      box-shadow: 0 0 12px rgba(66, 65, 73, 0.14);
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
      background-color: var(--affine-hover-background);
    }

    .brush-size-button div {
      border-radius: 50%;
      background-color: #888a9e;
    }

    .brush-size-button .thin {
      width: 4px;
      height: 4px;
    }

    .brush-size-button .thick {
      width: 16px;
      height: 15px;
    }

    common-divider {
      height: 62px;
    }

    ${tooltipStyle}
  `;

  @property()
  mouseMode!: MouseMode;

  @property()
  edgeless!: EdgelessPageBlockComponent;

  private _setBrushColor = (color: Color) => {
    if (this.mouseMode.type !== 'brush') return;

    const { lineWidth } = this.mouseMode;
    this.edgeless.slots.mouseModeUpdated.emit({
      type: 'brush',
      color,
      lineWidth,
    });
  };

  private _setBrushWidth = (lineWidth: BrushSize) => {
    if (this.mouseMode.type !== 'brush') return;

    const { color } = this.mouseMode;
    this.edgeless.slots.mouseModeUpdated.emit({
      type: 'brush',
      color,
      lineWidth,
    });
  };

  render() {
    if (this.mouseMode.type !== 'brush') return nothing;

    const { color } = this.mouseMode;
    const brushSizeButtonGroup = BrushSizeButtonGroup(
      this.mouseMode,
      this._setBrushWidth
    );

    return html`
      <div class="container">
        ${brushSizeButtonGroup}
        <common-divider .vertical=${true}></common-divider>
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

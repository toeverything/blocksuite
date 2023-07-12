import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { BrushSize } from '../../../../__internal__/utils/types.js';
import { tooltipStyle } from '../../../../components/tooltip/tooltip.js';

export class LineWidthEvent extends Event {
  detail: BrushSize;

  constructor(
    type: string,
    {
      detail,
      composed,
      bubbles,
    }: { detail: BrushSize; composed: boolean; bubbles: boolean }
  ) {
    super(type, { bubbles, composed });
    this.detail = detail;
  }
}

@customElement('edgeless-line-width-panel')
export class EdgelessLineWidthPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      padding: 8px 8px;
      box-sizing: border-box;
      background: var(--affine-popover-background);
    }

    .line-width-panel {
      display: flex;
      flex-direction: row-reverse;
      align-items: center;
      justify-content: space-between;
      position: relative;
      width: 100px;
      margin: 4px;
    }

    .line-width-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      cursor: pointer;
      z-index: 2;
    }

    .line-width-button:hover {
      cursor: pointer;
      background-color: var(--affine-hover-color);
    }

    .line-width-icon {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: var(--affine-border-color);
    }

    .line-width-button[active] .line-width-icon,
    .line-width-button[active] ~ .line-width-button .line-width-icon {
      background-color: var(--affine-icon-color);
    }

    .line-width-button:nth-child(1) {
      margin-right: 0;
    }

    .line-width-button:nth-child(6) {
      margin-left: 0;
    }

    .line-width-button:nth-child(1)[active] .line-width-icon {
      width: 14px;
      height: 14px;
    }

    .line-width-button:nth-child(2)[active] .line-width-icon {
      width: 12px;
      height: 12px;
    }

    .line-width-button:nth-child(3)[active] .line-width-icon {
      width: 10px;
      height: 10px;
    }

    .line-width-button:nth-child(4)[active] .line-width-icon {
      width: 8px;
      height: 8px;
    }

    .line-width-button:nth-child(5)[active] .line-width-icon {
      width: 6px;
      height: 6px;
    }

    .bottom-line,
    .line-width-overlay {
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      height: 1px;
      background-color: var(--affine-border-color);
      position: absolute;
    }

    .bottom-line {
      width: calc(100% - 16px);
      background-color: var(--affine-border-color);
    }

    .line-width-overlay {
      width: 0;
      background-color: var(--affine-icon-color);
      z-index: 1;
    }

    ${tooltipStyle}

    tool-tip {
      z-index: 12;
    }
  `;

  @property({ attribute: false })
  selectedSize: BrushSize = BrushSize.LINE_WIDTH_TWO;

  @query('.line-width-overlay')
  private _lineWidthOverlay!: HTMLElement;

  private _updateLineOverlayWidth(selectedSize: BrushSize) {
    if (!this._lineWidthOverlay) return;
    let width = 0;
    switch (selectedSize) {
      case BrushSize.LINE_WIDTH_TWO:
        width = 0;
        break;
      case BrushSize.LINE_WIDTH_FOUR:
        width = 16;
        break;
      case BrushSize.LINE_WIDTH_SIX:
        width = 32;
        break;
      case BrushSize.LINE_WIDTH_EIGHT:
        width = 48;
        break;
      case BrushSize.LINE_WIDTH_TEN:
        width = 64;
        break;
      default:
        width = 80;
    }
    this._lineWidthOverlay.style.width = `${width}%`;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const observer = new MutationObserver(() => {
      this._updateLineOverlayWidth(this.selectedSize);
      observer.disconnect();
    });

    if (!this.shadowRoot) return;
    observer.observe(this.shadowRoot, { childList: true });
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('selectedSize')) {
      this._updateLineOverlayWidth(this.selectedSize);
    }
  }

  private _onSelect(lineWidth: BrushSize) {
    this.dispatchEvent(
      new LineWidthEvent('select', {
        detail: lineWidth,
        composed: true,
        bubbles: true,
      })
    );
    this.selectedSize = lineWidth;
  }

  override render() {
    return html`<div class="line-width-panel has-tool-tip">
      <div
        class="line-width-button"
        ?active=${this.selectedSize === BrushSize.LINE_WIDTH_TWELVE}
        @click=${() => this._onSelect(BrushSize.LINE_WIDTH_TWELVE)}
      >
        <div class="line-width-icon"></div>
      </div>
      <div
        class="line-width-button"
        ?active=${this.selectedSize === BrushSize.LINE_WIDTH_TEN}
        @click=${() => this._onSelect(BrushSize.LINE_WIDTH_TEN)}
      >
        <div class="line-width-icon"></div>
      </div>
      <div
        class="line-width-button"
        ?active=${this.selectedSize === BrushSize.LINE_WIDTH_EIGHT}
        @click=${() => this._onSelect(BrushSize.LINE_WIDTH_EIGHT)}
      >
        <div class="line-width-icon"></div>
      </div>
      <div
        class="line-width-button"
        ?active=${this.selectedSize === BrushSize.LINE_WIDTH_SIX}
        @click=${() => this._onSelect(BrushSize.LINE_WIDTH_SIX)}
      >
        <div class="line-width-icon"></div>
      </div>
      <div
        class="line-width-button"
        ?active=${this.selectedSize === BrushSize.LINE_WIDTH_FOUR}
        @click=${() => this._onSelect(BrushSize.LINE_WIDTH_FOUR)}
      >
        <div class="line-width-icon"></div>
      </div>
      <div
        class="line-width-button"
        ?active=${this.selectedSize === BrushSize.LINE_WIDTH_TWO}
        @click=${() => this._onSelect(BrushSize.LINE_WIDTH_TWO)}
      >
        <div class="line-width-icon"></div>
      </div>
      <div class="bottom-line"></div>
      <div class="line-width-overlay"></div>
      <tool-tip inert role="tooltip" tip-position="top" arrow>
        Thickness
      </tool-tip>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-line-width-panel': EdgelessLineWidthPanel;
  }
}

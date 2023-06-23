import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { BrushSize } from '../../../__internal__/utils/types.js';

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

@customElement('edgeless-line-weight-panel')
export class EdgelessLineWeightPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      padding: 8px 8px;
      margin-left: 8px;
      box-sizing: border-box;
      background: var(--affine-popover-background);
    }

    .line-weight-panel {
      display: flex;
      flex-direction: row-reverse;
      align-items: center;
      justify-content: space-between;
      position: relative;
      width: 108px;
      margin: 0 2px;
    }

    .brush-size-button {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background-color: var(--affine-border-color);
      cursor: pointer;
      z-index: 2;
    }

    .brush-size-button[active],
    .brush-size-button[active] ~ .brush-size-button {
      background-color: var(--affine-icon-color);
    }

    .brush-size-button:nth-child(1) {
      margin-right: 0;
    }

    .brush-size-button:nth-child(6) {
      margin-left: 0;
    }

    .brush-size-button:nth-child(1)[active] {
      width: 13px;
      height: 13px;
    }

    .brush-size-button:nth-child(2)[active] {
      width: 11px;
      height: 11px;
    }

    .brush-size-button:nth-child(3)[active] {
      width: 9px;
      height: 9px;
    }

    .brush-size-button:nth-child(4)[active] {
      width: 7px;
      height: 7px;
    }

    .brush-size-button:nth-child(5)[active] {
      width: 5px;
      height: 5px;
    }

    .line-weight-scroll,
    .line-weight-overlay {
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 100%;
      height: 1px;
      background-color: var(--affine-border-color);
      position: absolute;
    }

    .line-weight-scroll {
      width: 100%;
      background-color: var(--affine-border-color);
    }

    .line-weight-overlay {
      width: 0;
      background-color: var(--affine-icon-color);
      z-index: 1;
    }
  `;

  @property({ attribute: false })
  selectedSize: BrushSize = BrushSize.LINE_WEIGHT_FOUR;

  @query('.line-weight-overlay')
  private _lineWeightOverlay!: HTMLElement;

  private _updateLineOverlayWidth(selectedSize: BrushSize) {
    if (!this._lineWeightOverlay) return;
    let width = 0;
    switch (selectedSize) {
      case BrushSize.LINE_WEIGHT_FOUR:
        width = 0;
        break;
      case BrushSize.LINE_WEIGHT_SIX:
        width = 20;
        break;
      case BrushSize.LINE_WEIGHT_EIGHT:
        width = 40;
        break;
      case BrushSize.LINE_WEIGHT_TEN:
        width = 60;
        break;
      case BrushSize.LINE_WEIGHT_TWELVE:
        width = 80;
        break;
      default:
        width = 100;
    }
    this._lineWeightOverlay.style.width = `${width}%`;
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
    return html` <div class="line-weight-panel">
      <div
        class="brush-size-button"
        ?active=${this.selectedSize === BrushSize.LINE_WEIGHT_FOURTEEN}
        @click=${() => this._onSelect(BrushSize.LINE_WEIGHT_FOURTEEN)}
      ></div>
      <div
        class="brush-size-button"
        ?active=${this.selectedSize === BrushSize.LINE_WEIGHT_TWELVE}
        @click=${() => this._onSelect(BrushSize.LINE_WEIGHT_TWELVE)}
      ></div>
      <div
        class="brush-size-button"
        ?active=${this.selectedSize === BrushSize.LINE_WEIGHT_TEN}
        @click=${() => this._onSelect(BrushSize.LINE_WEIGHT_TEN)}
      ></div>
      <div
        class="brush-size-button"
        ?active=${this.selectedSize === BrushSize.LINE_WEIGHT_EIGHT}
        @click=${() => this._onSelect(BrushSize.LINE_WEIGHT_EIGHT)}
      ></div>
      <div
        class="brush-size-button"
        ?active=${this.selectedSize === BrushSize.LINE_WEIGHT_SIX}
        @click=${() => this._onSelect(BrushSize.LINE_WEIGHT_SIX)}
      ></div>
      <div
        class="brush-size-button"
        ?active=${this.selectedSize === BrushSize.LINE_WEIGHT_FOUR}
        @click=${() => this._onSelect(BrushSize.LINE_WEIGHT_FOUR)}
      ></div>
      <div class="line-weight-scroll"></div>
      <div class="line-weight-overlay"></div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-line-weight-panel': EdgelessLineWeightPanel;
  }
}

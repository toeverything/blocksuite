import { LineWidth } from '@blocksuite/affine-model';
import { requestConnectedFrame } from '@blocksuite/affine-shared/utils';
import { WithDisposable } from '@blocksuite/global/utils';
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, query, queryAll } from 'lit/decorators.js';

type DragConfig = {
  stepWidth: number;
  boundLeft: number;
  containerWidth: number;
  bottomLineWidth: number;
};

export class LineWidthEvent extends Event {
  detail: LineWidth;

  constructor(
    type: string,
    {
      detail,
      composed,
      bubbles,
    }: { detail: LineWidth; composed: boolean; bubbles: boolean }
  ) {
    super(type, { bubbles, composed });
    this.detail = detail;
  }
}

export class EdgelessLineWidthPanel extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      align-self: stretch;
    }

    .line-width-panel {
      width: 108px;
      height: 24px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      position: relative;
      cursor: default;
    }

    .line-width-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      z-index: 2;
    }

    .line-width-icon {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: var(--affine-border-color);
    }

    .line-width-button:nth-child(1) {
      margin-right: 0;
    }

    .line-width-button:nth-child(6) {
      margin-left: 0;
    }

    .drag-handle {
      position: absolute;
      left: 0;
      top: 50%;
      width: 8px;
      height: 8px;
      transform: translateY(-50%) translateX(4px);
      border-radius: 50%;
      background-color: var(--affine-icon-color);
      z-index: 3;
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
  `;

  private _dragConfig: DragConfig | null = null;

  private _getDragHandlePosition = (e: PointerEvent, config: DragConfig) => {
    const x = e.clientX;
    const { boundLeft, bottomLineWidth, stepWidth, containerWidth } = config;

    let steps: number;
    if (x <= boundLeft) {
      steps = 0;
    } else if (x - boundLeft >= containerWidth) {
      steps = 100;
    } else {
      steps = Math.floor((x - boundLeft) / stepWidth);
    }

    // The drag handle should not be dragged to the left of the first icon or right of the last icon.
    // Calculate the drag handle position based on the steps.
    const bottomLineOffsetX = 4;
    const bottomLineStepWidth = (bottomLineWidth - bottomLineOffsetX) / 100;
    const dragHandlerPosition = steps * bottomLineStepWidth;
    return dragHandlerPosition;
  };

  private _onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    if (this.disable) return;
    const { left, width } = this._lineWidthPanel.getBoundingClientRect();
    const bottomLineWidth = this._bottomLine.getBoundingClientRect().width;
    this._dragConfig = {
      stepWidth: width / 100,
      boundLeft: left,
      containerWidth: width,
      bottomLineWidth,
    };
    this._onPointerMove(e);
  };

  private _onPointerMove = (e: PointerEvent) => {
    e.preventDefault();
    if (!this._dragConfig) return;
    const dragHandlerPosition = this._getDragHandlePosition(
      e,
      this._dragConfig
    );
    this._dragHandle.style.left = `${dragHandlerPosition}%`;
    this._lineWidthOverlay.style.width = `${dragHandlerPosition}%`;
    this._updateIconsColor();
  };

  private _onPointerOut = (e: PointerEvent) => {
    // If the pointer is out of the line width panel
    // Stop dragging and update the selected size by nearest size.
    e.preventDefault();
    if (!this._dragConfig) return;
    const dragHandlerPosition = this._getDragHandlePosition(
      e,
      this._dragConfig
    );
    this._updateLineWidthPanelByDragHandlePosition(dragHandlerPosition);
    this._dragConfig = null;
  };

  private _onPointerUp = (e: PointerEvent) => {
    e.preventDefault();
    if (!this._dragConfig) return;
    const dragHandlerPosition = this._getDragHandlePosition(
      e,
      this._dragConfig
    );
    this._updateLineWidthPanelByDragHandlePosition(dragHandlerPosition);
    this._dragConfig = null;
  };

  private _updateIconsColor = () => {
    if (!this._dragHandle.offsetParent) {
      requestConnectedFrame(() => this._updateIconsColor(), this);
      return;
    }

    const dragHandleRect = this._dragHandle.getBoundingClientRect();
    const dragHandleCenterX = dragHandleRect.left + dragHandleRect.width / 2;
    // All the icons located at the left of the drag handle should be filled with the icon color.
    const leftIcons = [];
    // All the icons located at the right of the drag handle should be filled with the border color.
    const rightIcons = [];

    for (const icon of this._lineWidthIcons) {
      const { left, width } = icon.getBoundingClientRect();
      const centerX = left + width / 2;
      if (centerX < dragHandleCenterX) {
        leftIcons.push(icon);
      } else {
        rightIcons.push(icon);
      }
    }

    leftIcons.forEach(
      icon => (icon.style.backgroundColor = 'var(--affine-icon-color)')
    );
    rightIcons.forEach(
      icon => (icon.style.backgroundColor = 'var(--affine-border-color)')
    );
  };

  private _onSelect(lineWidth: LineWidth) {
    // If the selected size is the same as the previous one, do nothing.
    if (lineWidth === this.selectedSize) return;
    this.dispatchEvent(
      new LineWidthEvent('select', {
        detail: lineWidth,
        composed: true,
        bubbles: true,
      })
    );
    this.selectedSize = lineWidth;
  }

  private _updateLineWidthPanel(selectedSize: LineWidth) {
    if (!this._lineWidthOverlay) return;
    let width = 0;
    let dragHandleOffsetX = 0;
    switch (selectedSize) {
      case LineWidth.Two:
        width = 0;
        break;
      case LineWidth.Four:
        width = 16;
        dragHandleOffsetX = 1;
        break;
      case LineWidth.Six:
        width = 32;
        dragHandleOffsetX = 2;
        break;
      case LineWidth.Eight:
        width = 48;
        dragHandleOffsetX = 3;
        break;
      case LineWidth.Ten:
        width = 64;
        dragHandleOffsetX = 4;
        break;
      default:
        width = 80;
        dragHandleOffsetX = 4;
    }

    dragHandleOffsetX += 4;
    this._lineWidthOverlay.style.width = `${width}%`;
    this._dragHandle.style.left = `${width}%`;
    this._dragHandle.style.transform = `translateY(-50%) translateX(${dragHandleOffsetX}px)`;
    this._updateIconsColor();
  }

  private _updateLineWidthPanelByDragHandlePosition(
    dragHandlerPosition: number
  ) {
    // Calculate the selected size based on the drag handle position.
    // Need to select the nearest size.
    let selectedSize = this.selectedSize;
    if (dragHandlerPosition <= 12) {
      selectedSize = LineWidth.Two;
    } else if (dragHandlerPosition > 12 && dragHandlerPosition <= 26) {
      selectedSize = LineWidth.Four;
    } else if (dragHandlerPosition > 26 && dragHandlerPosition <= 40) {
      selectedSize = LineWidth.Six;
    } else if (dragHandlerPosition > 40 && dragHandlerPosition <= 54) {
      selectedSize = LineWidth.Eight;
    } else if (dragHandlerPosition > 54 && dragHandlerPosition <= 68) {
      selectedSize = LineWidth.Ten;
    } else {
      selectedSize = LineWidth.Twelve;
    }
    this._updateLineWidthPanel(selectedSize);
    this._onSelect(selectedSize);
  }

  override disconnectedCallback(): void {
    this._disposables.dispose();
  }

  override firstUpdated(): void {
    this._updateLineWidthPanel(this.selectedSize);
    this._disposables.addFromEvent(this, 'pointerdown', this._onPointerDown);
    this._disposables.addFromEvent(this, 'pointermove', this._onPointerMove);
    this._disposables.addFromEvent(this, 'pointerup', this._onPointerUp);
    this._disposables.addFromEvent(this, 'pointerout', this._onPointerOut);
  }

  override render() {
    return html`<style>
        .line-width-panel {
          opacity: ${this.disable ? '0.5' : '1'};
        }
      </style>
      <div
        class="line-width-panel"
        @mousedown="${(e: Event) => e.preventDefault()}"
      >
        <div class="line-width-button">
          <div class="line-width-icon"></div>
        </div>
        <div class="line-width-button">
          <div class="line-width-icon"></div>
        </div>
        <div class="line-width-button">
          <div class="line-width-icon"></div>
        </div>
        <div class="line-width-button">
          <div class="line-width-icon"></div>
        </div>
        <div class="line-width-button">
          <div class="line-width-icon"></div>
        </div>
        <div class="line-width-button">
          <div class="line-width-icon"></div>
        </div>
        <div class="drag-handle"></div>
        <div class="bottom-line"></div>
        <div class="line-width-overlay"></div>
        ${this.hasTooltip
          ? html`<affine-tooltip .offset=${8}>Thickness</affine-tooltip>`
          : nothing}
      </div>`;
  }

  override willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('selectedSize')) {
      this._updateLineWidthPanel(this.selectedSize);
    }
  }

  @query('.bottom-line')
  private accessor _bottomLine!: HTMLElement;

  @query('.drag-handle')
  private accessor _dragHandle!: HTMLElement;

  @queryAll('.line-width-icon')
  private accessor _lineWidthIcons!: NodeListOf<HTMLElement>;

  @query('.line-width-overlay')
  private accessor _lineWidthOverlay!: HTMLElement;

  @query('.line-width-panel')
  private accessor _lineWidthPanel!: HTMLElement;

  @property({ attribute: false })
  accessor disable = false;

  @property({ attribute: false })
  accessor hasTooltip = true;

  @property({ attribute: false })
  accessor selectedSize: LineWidth = LineWidth.Two;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-line-width-panel': EdgelessLineWidthPanel;
  }
}

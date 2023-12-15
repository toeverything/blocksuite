import './frame-card-title.js';

import {
  type EdgelessPageBlockComponent,
  type FrameBlockModel,
  on,
  once,
} from '@blocksuite/blocks';
import { DisposableGroup } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { css, html, nothing, type PropertyValues } from 'lit';
import { property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

export type ReorderEvent = CustomEvent<{
  currentNumber: number;
  targetNumber: number;
  realIndex: number;
}>;

export type SelectEvent = CustomEvent<{
  id: string;
  selected: boolean;
  index: number;
  multiselect: boolean;
}>;

export type DragEvent = CustomEvent<{
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
}>;

export type FitViewEvent = CustomEvent<{
  block: FrameBlockModel;
}>;

const styles = css`
  :host {
    display: block;
  }

  .frame-card-container {
    display: flex;
    flex-direction: column;
    width: 284px;
    height: 198px;
    gap: 8px;

    position: relative;
  }

  .frame-card-body {
    display: flex;
    width: 100%;
    height: 170px;
    box-sizing: border-box;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    border: 1px solid var(--affine-border-color);
    background: var(--affine-background-primary-color);
    box-shadow: 0px 0px 12px 0px rgba(66, 65, 73, 0.18);
    cursor: pointer;
    position: relative;
  }

  .frame-card-container.selected .frame-card-body {
    border: 2px solid var(--light-brand-color, #1e96eb);
  }

  .frame-card-container.dragging {
    pointer-events: none;
    transform-origin: 16px 8px;
    position: fixed;
    top: 0;
    left: 0;
    z-index: calc(var(--affine-z-index-popover, 0) + 3);
  }

  .frame-card-container.dragging frame-card-title {
    display: none;
  }

  .frame-card-container.dragging .dragging-card-number {
    position: absolute;
    bottom: 0;
    left: 0;
    transform: translate(-30%, 30%);

    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--affine-black);
    color: var(--affine-white);
    font-size: 15px;
    line-height: 24px;
    text-align: center;
    font-weight: 400;
  }

  .frame-card-container.placeholder {
    opacity: 0.5;
  }
`;

export class FrameCard extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  edgeless: EdgelessPageBlockComponent | null = null;

  @property({ attribute: false })
  frame!: FrameBlockModel;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  cardIndex!: number;

  @property({ attribute: false })
  frameIndex!: string;

  @property({ attribute: false })
  status: 'selected' | 'dragging' | 'placeholder' | 'none' = 'none';

  @property({ attribute: false })
  stackOrder!: number;

  @property({ attribute: false })
  pos!: { x: number; y: number };

  @property({ attribute: false })
  width?: number;

  @property({ attribute: false })
  draggingCardNumber?: number;

  @query('.frame-card-container')
  containerElement!: HTMLElement;

  private _frameDisposables: DisposableGroup | null = null;

  private _dispatchSelectEvent(e: MouseEvent) {
    e.stopPropagation();
    const event = new CustomEvent('select', {
      detail: {
        id: this.frame.id,
        selected: this.status !== 'selected',
        index: this.cardIndex,
        multiselect: e.shiftKey,
      },
    }) as SelectEvent;

    this.dispatchEvent(event);
  }

  private _dispatchFitViewEvent(e: MouseEvent) {
    e.stopPropagation();

    const event = new CustomEvent('fitview', {
      detail: {
        block: this.frame,
      },
    });

    this.dispatchEvent(event);
  }

  private _dispatchDragEvent(e: MouseEvent) {
    e.preventDefault();
    if (e.button !== 0) return;

    const { clientX: startX, clientY: startY } = e;
    const disposeDragStart = on(this.ownerDocument, 'mousemove', e => {
      if (
        Math.abs(startX - e.clientX) < 5 &&
        Math.abs(startY - e.clientY) < 5
      ) {
        return;
      }
      if (this.status !== 'selected') {
        this._dispatchSelectEvent(e);
      }

      const event = new CustomEvent('drag', {
        detail: {
          clientX: e.clientX,
          clientY: e.clientY,
          pageX: e.pageX,
          pageY: e.pageY,
        },
      });

      this.dispatchEvent(event);
      disposeDragStart();
    });

    once(this.ownerDocument, 'mouseup', () => {
      disposeDragStart();
    });
  }

  private _DraggingCardNumber() {
    if (this.draggingCardNumber === undefined) return nothing;

    return html`<div class="dragging-card-number">
      ${this.draggingCardNumber}
    </div>`;
  }

  private _updateElement = () => {
    this.requestUpdate();
  };

  private _clearFrameDisposables = () => {
    this._frameDisposables?.dispose();
    this._frameDisposables = null;
  };

  private _setFrameDisposables(frame: FrameBlockModel) {
    this._clearFrameDisposables();
    this._frameDisposables = new DisposableGroup();
    this._frameDisposables.add(frame.propsUpdated.on(this._updateElement));
  }

  override updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has('frame')) {
      this._setFrameDisposables(this.frame);
    }
  }

  override connectedCallback() {
    super.connectedCallback();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearFrameDisposables();
  }

  override render() {
    const { pos, stackOrder, width } = this;
    const containerStyle =
      this.status === 'dragging'
        ? styleMap({
            transform: `${
              stackOrder === 0
                ? `translate(${pos.x - 16}px, ${pos.y - 8}px)`
                : `translate(${pos.x - 10}px, ${pos.y - 16}px) scale(0.96)`
            }`,
            width: width ? `${width}px` : undefined,
          })
        : {};

    return html`<div
      class="frame-card-container ${this.status ?? ''}"
      style=${containerStyle}
    >
      ${this.status === 'dragging'
        ? nothing
        : html`<frame-card-title
            .cardIndex=${this.cardIndex}
            .frame=${this.frame}
          ></frame-card-title>`}
      <div
        class="frame-card-body"
        @click=${this._dispatchSelectEvent}
        @dblclick=${this._dispatchFitViewEvent}
        @mousedown=${this._dispatchDragEvent}
      >
        ${this.status === 'dragging' && stackOrder !== 0
          ? nothing
          : html`<frame-preview
              .edgeless=${this.edgeless}
              .host=${this.host}
              .page=${this.page}
              .frame=${this.frame}
            ></frame-preview>`}
        ${this._DraggingCardNumber()}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'frame-card': FrameCard;
  }
}

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { on, once } from '../../../../../_common/utils/event.js';
import type { FrameBlockModel } from '../../../../../frame-block/frame-model.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { FrameCardTitleEditor } from './frame-card-title-editor.js';

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

  .frame-card-title {
    display: flex;
    width: 100%;
    height: 20px;
    box-sizing: border-box;
    gap: 6px;
    font-size: 12px;
    font-family: Inter;
    cursor: default;
  }

  .frame-card-title .card-index {
    display: flex;
    align-self: center;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 16px;
    box-sizing: border-box;
    border-radius: 2px;
    background: var(--affine-black);
    margin-left: 2px;

    color: var(--affine-white);
    text-align: center;
    font-weight: 500;
    line-height: 16px;
  }

  .frame-card-title .card-content {
    flex: 1 0 0;
    height: 20px;
    color: var(--affine-text-primary-color);
    font-weight: 400;
    line-height: 20px;
    position: relative;
  }

  .frame-card-body {
    display: flex;
    width: 100%;
    height: 170px;
    box-sizing: border-box;
    padding: 8px;
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

  .frame-card-container.dragging .frame-card-title {
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
    /* pointer-events: none; */
    opacity: 0.5;
  }
`;

export class FrameCard extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  frame!: FrameBlockModel;

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

  @query('.frame-card-title')
  titleContainer!: HTMLElement;

  @query('.frame-card-title .card-index')
  titleIndexElement!: HTMLElement;

  @query('.frame-card-title .card-content')
  titleContentElement!: HTMLElement;

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

  private _renderDraggingCardNumber() {
    if (this.draggingCardNumber === undefined) return nothing;

    return html`<div class="dragging-card-number">
      ${this.draggingCardNumber}
    </div>`;
  }

  override connectedCallback() {
    super.connectedCallback();
    const { disposables } = this;

    disposables.add(
      this.frame.propsUpdated.on(({ key }) => {
        console.log('frame updated! Key is : ', key);
      })
    );
  }

  override firstUpdated() {
    this.disposables.addFromEvent(this.titleContentElement, 'dblclick', () => {
      const titleEditor = new FrameCardTitleEditor();
      titleEditor.edgeless = this.edgeless;
      titleEditor.frameModel = this.frame;
      titleEditor.titleContentElement = this.titleContentElement;
      const left = this.titleIndexElement.offsetWidth + 6;
      titleEditor.left = left;
      titleEditor.maxWidth = this.titleContainer.offsetWidth - left - 6;
      this.titleContainer.appendChild(titleEditor);
    });
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
      <div class="frame-card-title">
        <div class="card-index">${this.cardIndex + 1}</div>
        <div class="card-content">${this.frame.title}</div>
      </div>
      <div
        class="frame-card-body"
        @click=${this._dispatchSelectEvent}
        @dblclick=${this._dispatchFitViewEvent}
        @mousedown=${this._dispatchDragEvent}
      >
        ${this._renderDraggingCardNumber()}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'frame-card': FrameCard;
  }
}

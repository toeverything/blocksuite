import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { FrameBlockModel } from '../../../../../frame-block/index.js';
import { generateKeyBetween } from '../../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';

@customElement('edgeless-frame-order-menu')
export class EdgelessFrameOrderMenu extends WithDisposable(LitElement) {
  static override styles = css`
    .edgeelss-frame-order-items-container {
      max-height: 281px;
      border-radius: 8px;
      padding: 8px 0px 8px 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-menu-shadow);
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .item {
      width: 256px;
      border-radius: 4px;
      padding: 4px;
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .draggable:hover {
      background-color: var(--affine-hover-color);
    }

    .item:hover .drag-indicator {
      opacity: 1;
    }

    .drag-indicator {
      cursor: pointer;
      width: 4px;
      height: 12px;
      border-radius: 1px;
      opacity: 0.2;
      background: var(--affine-placeholder-color);
      margin-right: 2px;
    }

    .index {
      width: 20px;
      min-width: 20px;
      height: 24px;
      text-align: center;
      font-weight: 400;
      font-size: 15px;
      line-height: 24px;
      color: var(--affine-text-secondary-color);
      margin-right: 4px;
    }

    .image {
      width: 70px;
      min-width: 70px;
      height: 45px;
      border-radius: 4px;
      box-shadow: 0px 1px 6px 0px rgba(0, 0, 0, 0.16);
      margin-right: 8px;
    }

    .title {
      font-size: 14px;
      font-weight: 400;
      height: 22px;
      line-height: 22px;
      color: var(--affine-text-primary-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .clone {
      visibility: hidden;
      position: absolute;
      z-index: 1;
      left: 8px;
      height: 53px;
      border: 1px solid var(--affine-border-color);
      box-shadow: var(--affine-menu-shadow);
      background-color: var(--affine-white);
      pointer-events: none;
    }

    .indicator-line {
      visibility: hidden;
      position: absolute;
      z-index: 1;
      left: 8px;
      background-color: var(--affine-primary-color);
      height: 1px;
      width: 90%;
    }
  `;
  @state()
  canvas: HTMLCanvasElement[] = [];

  @state()
  private _curIndex = -1;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  frames!: FrameBlockModel[];

  @property({ attribute: false })
  updateFrames!: () => void;

  @query('.edgeelss-frame-order-items-container')
  private _container!: HTMLDivElement;

  @query('.indicator-line')
  private _indicatorLine!: HTMLDivElement;

  @query('.clone')
  private _clone!: HTMLDivElement;

  override firstUpdated() {
    this._bindEvent();

    Promise.all(
      this.frames.map(frame =>
        this.edgeless.clipboardController.toCanvas([frame], [])
      )
    ).then(canvas => {
      this.canvas = canvas.map(canva =>
        this._createScaledCanva(
          canva ? canva : document.createElement('canvas')
        )
      );
    });
  }

  private _createScaledCanva(canva: HTMLCanvasElement) {
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = 70;
    scaledCanvas.height = 45;

    const ctx = scaledCanvas.getContext('2d');
    assertExists(ctx);
    ctx.drawImage(canva, 0, 0, scaledCanvas.width, scaledCanvas.height);
    return scaledCanvas;
  }

  private _bindEvent() {
    const { _disposables } = this;

    _disposables.addFromEvent(this._container, 'wheel', e => {
      e.stopPropagation();
    });

    _disposables.addFromEvent(this._container, 'pointerdown', e => {
      const ele = e.target as HTMLElement;
      const draggable = ele.closest('.draggable');
      if (!draggable) return;
      const clone = this._clone;
      const indicatorLine = this._indicatorLine;
      clone.style.visibility = 'visible';

      const rect = draggable.getBoundingClientRect();

      const index = Number(draggable.getAttribute('index'));
      this._curIndex = index;
      let newIndex = -1;

      const containerRect = this._container.getBoundingClientRect();
      const start = containerRect.top + 8;
      const end = containerRect.bottom;

      const shiftX = e.clientX - rect.left;
      const shiftY = e.clientY - rect.top;
      function moveAt(x: number, y: number) {
        clone.style.left = x - containerRect.left - shiftX + 'px';
        clone.style.top = y - containerRect.top - shiftY + 'px';
      }

      function isInsideContainer(e: PointerEvent) {
        return e.clientY >= start && e.clientY <= end;
      }
      moveAt(e.clientX, e.clientY);

      this._disposables.addFromEvent(document, 'pointermove', e => {
        indicatorLine.style.visibility = 'visible';
        moveAt(e.clientX, e.clientY);
        if (isInsideContainer(e)) {
          const relativeY = e.pageY + this._container.scrollTop - start;
          let top = 0;
          if (relativeY < rect.height / 2) {
            newIndex = 0;
            top = 4;
          } else {
            newIndex = Math.ceil(
              (relativeY - rect.height / 2) / (rect.height + 10)
            );
            top = 8 + newIndex * rect.height + (newIndex - 0.5) * 10;
          }

          indicatorLine.style.top = top - this._container.scrollTop + 'px';
          return;
        }
        newIndex = -1;
      });

      this._disposables.addFromEvent(document, 'pointerup', () => {
        clone.style.visibility = 'hidden';
        indicatorLine.style.visibility = 'hidden';
        if (
          newIndex >= 0 &&
          newIndex <= this.frames.length &&
          newIndex !== index &&
          newIndex !== index + 1
        ) {
          const before = this.frames[newIndex - 1]?.index || null;
          const after = this.frames[newIndex]?.index || null;

          const frame = this.frames[index];

          this.edgeless.surface.updateElement(frame.id, {
            index: generateKeyBetween(before, after),
          });
          this.edgeless.page.captureSync();

          const canvas = this.canvas;
          const canva = canvas.splice(index, 1);
          canvas.splice(newIndex, 0, canva[0]);
          this.canvas = canvas;
          this.updateFrames();
          this.requestUpdate();
        }
        this._disposables.dispose();
        this._disposables = new DisposableGroup();
        this._bindEvent();
      });
    });
  }

  override render() {
    const frame = this.frames[this._curIndex];
    const canva = frame
      ? this._createScaledCanva(this.canvas[this._curIndex])
      : nothing;

    return html`
      <div
        class="edgeelss-frame-order-items-container"
        @click=${(e: MouseEvent) => e.stopPropagation()}
      >
        ${repeat(
          this.frames,
          frame => frame.id,
          (frame, index) => html`
            <div class="item draggable" id=${frame.id} index=${index}>
              <div class="drag-indicator"></div>
              <div class="index">${index + 1}</div>
              <div class="image">${this.canvas[index]}</div>
              <div class="title">${frame.title.toString()}</div>
            </div>
          `
        )}
        <div class="indicator-line"></div>
        <div class="clone item">
          ${frame
            ? html`<div class="drag-indicator"></div>
                <div class="index">${this._curIndex + 1}</div>
                <div class="image">${canva}</div>
                <div class="title">${frame.title.toString()}</div>`
            : nothing}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frame-order-menu': EdgelessFrameOrderMenu;
  }
}

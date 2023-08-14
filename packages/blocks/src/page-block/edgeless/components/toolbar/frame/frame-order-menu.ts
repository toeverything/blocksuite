import { WithDisposable } from '@blocksuite/lit';
import { type FrameElement, generateKeyBetween } from '@blocksuite/phasor';
import { DisposableGroup } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';

@customElement('edgeless-frame-order-menu')
export class EdgelessFrameOrderMenu extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
      z-index: 1;
    }
    .container {
      width: 237px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
      padding: 8px;
    }

    .edgeless-frame-order-title {
      color: #8e8d91;
      border-bottom: 1px solid var(--affine-divider-color);
      font-size: 12px;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }

    .edgeelss-frame-order-items-container {
      display: flex;
      flex-direction: column;
    }

    .draggable {
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: baseline;
      padding: 5px 8px;
    }

    .draggable:hover {
      background: #f5f5f5;
      .draggable-bar {
        background: #c0bfc1;
      }
    }

    .draggable-bar {
      width: 4px;
      height: 12px;
      background: rgba(192, 191, 193, 0.2);
      margin-right: 8px;
    }
    .draggable-title {
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .draggable-index {
      color: #8e8d91;
      width: 26px;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  frames!: FrameElement[];

  @property({ attribute: false })
  updateFrames!: () => void;

  @query('.edgeelss-frame-order-items-container')
  private _container!: HTMLDivElement;

  override firstUpdated() {
    this._bindEvent();
  }

  private _bindEvent() {
    this._disposables.addFromEvent(this._container, 'pointerdown', e => {
      const ele = e.target as HTMLElement;
      const draggable = ele.closest('.draggable');
      if (!draggable) return;
      const clone = draggable
        .querySelector('.draggable-title')
        ?.cloneNode(true) as HTMLDivElement;
      clone.style.fontFamily = 'sans-serif';
      clone.style.position = 'absolute';
      clone.style.zIndex = '1000';
      clone.style.fontFamily = 'sans-serif';
      document.body.appendChild(clone);
      const rect = draggable.getBoundingClientRect();
      const indicator = document.createElement('div');
      indicator.style.position = 'absolute';
      indicator.style.zIndex = '1000';
      indicator.style.width = rect.width + 'px';
      indicator.style.height = '1px';
      indicator.style.backgroundColor = 'blue';
      indicator.hidden = true;

      document.body.appendChild(indicator);
      const shiftX = e.clientX - rect.left;
      const shiftY = e.clientY - rect.top;
      moveAt(e.clientX, e.clientY);

      function moveAt(x: number, y: number) {
        clone.style.left = x - shiftX + 'px';
        clone.style.top = y - shiftY + 'px';
      }

      const index = Number(draggable.getAttribute('index'));
      let newIndex = -1;
      const start = rect.top - rect.height * index - rect.height / 2;
      const end = start + rect.height * this.frames.length;

      function isInsideContainer(e: PointerEvent) {
        return e.clientY >= start && e.clientY <= end;
      }

      this._disposables.addFromEvent(document, 'pointermove', e => {
        moveAt(e.clientX, e.clientY);
        if (isInsideContainer(e)) {
          newIndex = parseInt((e.pageY - start) / rect.height + '');
          if (newIndex !== index && newIndex !== index + 1) {
            indicator.hidden = false;
            indicator.style.left = rect.left + 'px';
            indicator.style.top =
              start + rect.height / 2 + newIndex * rect.height + 'px';
            return;
          }
        }
        newIndex = -1;
        indicator.hidden = true;
      });

      this._disposables.addFromEvent(document, 'pointerup', e => {
        if (
          newIndex !== -1 &&
          newIndex >= 0 &&
          newIndex <= this.frames.length - 1
        ) {
          const before = this.frames[newIndex - 1]?.index || null;
          const after = this.frames[newIndex].index || null;
          const frame = this.frames[index];
          this.edgeless.surface.updateIndexes(
            [generateKeyBetween(before, after)],
            [frame]
          );
          this.edgeless.page.captureSync();
          this.updateFrames();
          this.requestUpdate();
        }
        clone.remove();
        indicator.remove();
        this._disposables.dispose();
        this._disposables = new DisposableGroup();
        this._bindEvent();
      });
    });
  }

  override render() {
    const items = repeat(
      this.frames,
      frame => frame.id,
      (frame, index) => html` <div
        class="draggable"
        id=${frame.id}
        index=${index}
      >
        <div class="draggable-bar"></div>
        <div class="draggable-title">${frame.title}</div>
        <div class="draggable-index">${index + 1}</div>
        <div></div>
      </div>`
    );
    return html`
      <div class="container">
        <div class="edgeless-frame-order-title">Frame Order</div>
        <div class="edgeelss-frame-order-items-container">${items}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frame-order-menu': EdgelessFrameOrderMenu;
  }
}

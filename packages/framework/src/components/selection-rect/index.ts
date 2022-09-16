import { Point, pointsToRect, Rect } from '../../utils/rect';
import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { Mouse } from '../../managers';

@customElement('selection-rect')
export class SelectionRect extends LitElement {
  @state()
  rect?: Rect;

  @state()
  startPoint?: Point;

  @state()
  endPoint?: Point;

  @state()
  isShow = false;

  @property({ type: Mouse })
  mouse!: Mouse;

  protected firstUpdated(): void {
    if (this.mouse) {
      this.mouse.onMouseDown(e => {
        this._handlerEditorMousedown(e);
      });
      this.mouse.onMouseMove(e => {
        this._handlerMouseMove(e);
      });
    }
  }

  private _handlerEditorMousedown(e: MouseEvent) {
    this.startPoint = new Point(e.clientX, e.clientY);
    this.isShow = true;
    this.mouse.onDocumentMouseUpOnce(() => {
      this._handlerEditorMouseup();
    });
  }

  private _handlerMouseMove(e: MouseEvent) {
    if (this.startPoint) {
      this.endPoint = new Point(e.clientX, e.clientY);
      this.rect = pointsToRect(this.startPoint, this.endPoint);
    }
  }

  private _handlerEditorMouseup() {
    this.isShow = false;
    this.startPoint = undefined;
    this.rect = undefined;
  }

  protected render() {
    const rectStyle =
      this.isShow && this.rect
        ? {
            display: 'block',
            left: `${this.rect.left}px`,
            top: ` ${this.rect.top}px`,
            height: `${this.rect.height}px`,
            width: `${this.rect.width}px`,
          }
        : {
            display: 'none',
          };
    return html`
      <style>
        .selection-rect {
          background-color: rgba(62, 111, 219, 0.1);
          position: absolute;
          z-index: 99;
        }
      </style>
      <div class="selection-rect" style=${styleMap(rectStyle)}></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'selection-rect': SelectionRect;
  }
}

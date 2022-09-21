import { Point, Rect } from './rect';
import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { PageBlockModel } from '../../../../blocks'
import { PaperContainer } from '../paper-container/paper-container';
import { SelectionManager } from '../../managers';
import { BLOCK_ID_ATTR } from '../../const';

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

  // @property({ type: MouseManager })
  // mouse!: MouseManager;

  @property()
  pageModel!: PageBlockModel;

  @property({ type: PaperContainer })
  page!: PaperContainer;

  @property()
  selectionManager!: SelectionManager;

  protected firstUpdated(): void {
    if (this.page.mouse) {
      this.page.mouse.onMouseDown(e => {
        this._handlerEditorMousedown(e);
      });
      this.page.mouse.onMouseMove(e => {
        this._handlerMouseMove(e);
      });
    }
  }

  private _handlerEditorMousedown(e: MouseEvent) {
    this.selectionManager.selectedBlockIds = [];
    const closestBlock = (e.target as HTMLDivElement)?.closest(
      `[${BLOCK_ID_ATTR}]`
    );
    // if closest block is not page root , do nothing
    if (
      !closestBlock ||
      closestBlock.attributes.getNamedItem(BLOCK_ID_ATTR)?.value ===
        this.pageModel.id
    ) {
      this.startPoint = new Point(e.clientX, e.clientY);
      this.isShow = true;
      this.page.mouse.onDocumentMouseUpOnce(() => {
        this._handlerEditorMouseup();
      });
      e.preventDefault();
    }
  }

  private _handlerMouseMove(e: MouseEvent) {
    if (this.startPoint) {
      this.endPoint = new Point(e.clientX, e.clientY);
      this.rect = Rect.fromPoints(this.startPoint, this.endPoint);
      this.page.selection.calcIntersectBlocks(this.rect, this.pageModel);
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
            top: `${this.rect.top}px`,
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

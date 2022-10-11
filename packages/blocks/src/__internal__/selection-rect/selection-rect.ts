import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { BLOCK_ID_ATTR, Point, Rect } from '@blocksuite/shared';
import type { BaseBlockModel, Store } from '@blocksuite/store';
import { DefaultMouseManager } from '../mouse/mouse-manager';
import { SelectionManager } from '../selection/selection-manager';

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

  @property()
  store!: Store;

  @property()
  mouse!: DefaultMouseManager;

  @property()
  selection!: SelectionManager;

  private _handleEditorMousedown(e: MouseEvent) {
    // this.selectionManager.selectedBlockIds = [];

    // ensure page title can be focused
    if (e.target instanceof HTMLInputElement) {
      return;
    }

    const closestBlock = (e.target as HTMLDivElement)?.closest(
      `[${BLOCK_ID_ATTR}]`
    );
    // if closest block is not page root, do nothing
    if (
      !closestBlock ||
      closestBlock.attributes.getNamedItem(BLOCK_ID_ATTR)?.value ===
        this.store.root?.id
    ) {
      this.startPoint = new Point(e.clientX, e.clientY);
      this.isShow = true;
      this.mouse.onDocumentMouseUpOnce(() => {
        this._handleEditorMouseup();
      });
      e.preventDefault();
    }
  }

  private _handleMouseMove(e: MouseEvent) {
    if (this.startPoint) {
      this.endPoint = new Point(e.clientX, e.clientY);
      this.rect = Rect.fromPoints(this.startPoint, this.endPoint);
      this.selection.calcIntersectBlocks(
        this.rect,
        this.store.root as BaseBlockModel
      );
    }
  }

  private _handleEditorMouseup() {
    this.isShow = false;
    this.startPoint = undefined;
    this.rect = undefined;
  }

  firstUpdated() {
    if (!this.mouse) return;

    this.mouse.onMouseDown(e => {
      this._handleEditorMousedown(e);
    });
    this.mouse.onMouseMove(e => {
      if (!this.store.root) return;
      this._handleMouseMove(e);
    });
  }

  render() {
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
        .affine-selection-rect {
          background-color: rgba(62, 111, 219, 0.1);
          position: absolute;
          z-index: 99;
        }
      </style>
      <div class="affine-selection-rect" style=${styleMap(rectStyle)}></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'selection-rect': SelectionRect;
  }
}

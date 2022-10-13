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
  rect: Rect | null = null;

  @state()
  startPoint: Point | null = null;

  @state()
  endPoint: Point | null = null;

  @state()
  isShow = false;

  @property()
  store!: Store;

  @property()
  mouse!: DefaultMouseManager;

  @property()
  selection!: SelectionManager;

  private _handleEditorMousedown(e: MouseEvent) {
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
      this.mouse.addDocumentMouseUpOnceListener(() => {
        this._handleMouseUp();
      });
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
      e.preventDefault();
    }
  }

  private _handleMouseUp() {
    this.isShow = false;
    this.startPoint = null;
    this.rect = null;
  }

  firstUpdated() {
    if (!this.mouse) return;

    this.mouse.addMouseDownListener(e => {
      this._handleEditorMousedown(e);
    });
    this.mouse.addMouseMoveListener(e => {
      if (!this.store.root) return;
      this._handleMouseMove(e);
    });
  }

  render() {
    const container = this.closest(`.affine-editor-container`);
    const scrollerTop = container?.scrollTop || 0;
    const containerTop = container?.getBoundingClientRect().top || 0;
    const containerLeft = container?.getBoundingClientRect().left || 0;
    const rectStyle =
      this.isShow && this.rect
        ? {
            display: 'block',
            left: `${this.rect.left - containerLeft}px`,
            top: `${this.rect.top + scrollerTop - containerTop}px`,
            height: `${this.rect.height}px`,
            width: `${this.rect.width}px`,
          }
        : {
            display: 'none',
          };
    return html`
      <style>
        .affine-selection-rect {
          background-color: rgba(104, 128, 255, 0.1);
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

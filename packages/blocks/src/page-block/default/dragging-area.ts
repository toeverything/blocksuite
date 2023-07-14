import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import { WidgetElement } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { isBlankArea } from '../../__internal__/index.js';
import type { DefaultPageBlockComponent } from './default-page-block.js';

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function rectIntersects(a: Rect, b: Rect) {
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

function rectIncludes(a: Rect, b: Rect) {
  return (
    a.left <= b.left &&
    a.left + a.width >= b.left + b.width &&
    a.top <= b.top &&
    a.top + a.height >= b.top + b.height
  );
}

@customElement('affine-dragging-area-widget')
export class DraggingAreaWidget extends WidgetElement {
  @state()
  rect: Rect | null = null;

  static excludeFlavours: string[] = ['affine:note'];

  private _dragging = false;

  private _addEvent = (name: EventName, handler: UIEventHandler) =>
    this._disposables.add(this.root.uiEventDispatcher.add(name, handler));

  private get _allBlocksRect() {
    return [...this.root.blockViewMap.entries()]
      .filter(([id]) => {
        const model = this.page.getBlockById(id);
        if (!model) {
          return false;
        }
        return (
          model.role !== 'root' &&
          !DraggingAreaWidget.excludeFlavours.includes(model.flavour)
        );
      })
      .map(([id, element]) => {
        return {
          id,
          rect: element.getBoundingClientRect(),
        };
      });
  }

  private _selectBlocksByRect(userRect: Rect) {
    const selections = this._allBlocksRect
      .filter(
        ({ rect }) =>
          rectIntersects(rect, userRect) && !rectIncludes(rect, userRect)
      )
      .map(rectWithId => rectWithId.id)
      .map(blockId => {
        return this.root.selectionManager.getInstance('block', blockId);
      });

    this.root.selectionManager.set(selections);
  }

  override connectedCallback() {
    super.connectedCallback();
    this._addEvent('dragStart', ctx => {
      const state = ctx.get('pointerState');
      if (isBlankArea(state)) {
        this._dragging = true;
        return true;
      }
      return;
    });

    this._addEvent('dragMove', ctx => {
      if (this._dragging) {
        const pageBlock = this.root.blockViewMap.get(this.model.id) as
          | DefaultPageBlockComponent
          | undefined;
        if (!pageBlock) {
          return;
        }

        const state = ctx.get('pointerState');
        const { x, y } = state;
        const { x: startX, y: startY } = state.start;
        const userRect = {
          left: pageBlock.viewportElement.scrollLeft + Math.min(x, startX),
          top: pageBlock.viewportElement.scrollTop + Math.min(y, startY),
          width: Math.abs(x - startX),
          height: Math.abs(y - startY),
        };
        this.rect = userRect;
        this._selectBlocksByRect(userRect);

        return true;
      }

      return;
    });

    this._addEvent('dragEnd', () => {
      if (this._dragging) {
        this._dragging = false;
        this.rect = null;
        return true;
      }

      return;
    });
  }

  override render() {
    const rect = this.rect;
    if (!rect) return nothing;

    const style = {
      left: rect.left + 'px',
      top: rect.top + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
    };
    return html`
      <style>
        .affine-page-dragging-area {
          position: absolute;
          background: var(--affine-hover-color);
          z-index: 1;
          pointer-events: none;
        }
      </style>
      <div class="affine-page-dragging-area" style=${styleMap(style)}></div>
    `;
  }
}

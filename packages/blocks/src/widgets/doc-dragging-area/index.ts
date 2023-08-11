import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { WidgetElement } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { DocPageBlockComponent } from '../../page-block/index.js';
import { autoScroll } from '../../page-block/text-selection/utils.js';

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

function isBlankArea(e: PointerEventState) {
  const { cursor } = window.getComputedStyle(e.raw.target as Element);
  return cursor !== 'text';
}

@customElement('affine-doc-dragging-area-widget')
export class DocDraggingAreaWidget extends WidgetElement {
  @state()
  rect: Rect | null = null;

  private _rafID = 0;

  static excludeFlavours: string[] = ['affine:note', 'affine:surface'];

  private _dragging = false;

  private _offset: {
    top: number;
    left: number;
  } = {
    top: 0,
    left: 0,
  };

  private get _allBlocksRect() {
    const viewportElement = this._viewportElement;

    const getAllNodeFromTree = (): BlockElement[] => {
      const blockElement: BlockElement[] = [];
      this.root.viewStore.walkThrough(node => {
        const view = node.view;
        if (!(view instanceof BlockElement)) {
          return true;
        }
        if (
          view.model.role !== 'root' &&
          !DocDraggingAreaWidget.excludeFlavours.includes(view.model.flavour)
        ) {
          blockElement.push(view);
        }
        return;
      });
      return blockElement;
    };

    const elements = getAllNodeFromTree();

    const rootRect = this.root.getBoundingClientRect();
    return elements.map(element => {
      const bounding = element.getBoundingClientRect();
      return {
        id: element.model.id,
        path: element.path,
        rect: {
          left: bounding.left + viewportElement.scrollLeft - rootRect.left,
          top: bounding.top + viewportElement.scrollTop - rootRect.top,
          width: bounding.width,
          height: bounding.height,
        },
      };
    });
  }

  private get _viewportElement() {
    const pageBlock = this.pageElement as DocPageBlockComponent;

    assertExists(pageBlock);

    return pageBlock.viewportElement;
  }

  private _selectBlocksByRect(userRect: Rect) {
    const selections = this._allBlocksRect
      .filter(
        ({ rect }) =>
          rectIntersects(rect, userRect) && !rectIncludes(rect, userRect)
      )
      .map(rectWithId => {
        return this.root.selectionManager.getInstance('block', {
          path: rectWithId.path,
        });
      });

    this.root.selectionManager.set(selections);
  }

  private _clearRaf() {
    if (this._rafID) {
      cancelAnimationFrame(this._rafID);
      this._rafID = 0;
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent(
      'dragStart',
      ctx => {
        const state = ctx.get('pointerState');
        if (isBlankArea(state)) {
          this._dragging = true;
          const viewportElement = this._viewportElement;
          this._offset = {
            left: viewportElement.scrollLeft,
            top: viewportElement.scrollTop,
          };
          return true;
        }
        return;
      },
      { global: true }
    );

    this.handleEvent(
      'dragMove',
      ctx => {
        this._clearRaf();
        if (!this._dragging) {
          return;
        }
        ctx.get('defaultState').event.preventDefault();

        const runner = () => {
          const state = ctx.get('pointerState');
          const { x, y } = state;

          const { scrollTop, scrollLeft } = this._viewportElement;
          const { x: startX, y: startY } = state.start;
          const left = Math.min(this._offset.left + startX, scrollLeft + x);
          const top = Math.min(this._offset.top + startY, scrollTop + y);
          const right = Math.max(this._offset.left + startX, scrollLeft + x);
          const bottom = Math.max(this._offset.top + startY, scrollTop + y);
          const userRect = {
            left,
            top,
            width: right - left,
            height: bottom - top,
          };
          this.rect = userRect;
          this._selectBlocksByRect(userRect);

          const result = autoScroll(this._viewportElement, y);
          if (!result) {
            this._clearRaf();
            return;
          }
          this._rafID = requestAnimationFrame(runner);
        };

        this._rafID = requestAnimationFrame(runner);

        return true;
      },
      { global: true }
    );

    this.handleEvent(
      'dragEnd',
      () => {
        this._clearRaf();
        this._dragging = false;
        this.rect = null;
        this._offset = {
          top: 0,
          left: 0,
        };
      },
      {
        global: true,
      }
    );

    this.handleEvent(
      'pointerMove',
      ctx => {
        if (this._dragging) {
          const state = ctx.get('pointerState');
          state.raw.preventDefault();
        }
      },
      {
        global: true,
      }
    );
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

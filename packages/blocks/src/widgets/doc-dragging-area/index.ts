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

type BlockInfo = {
  element: BlockElement;
  rect: Rect;
};

function rectIntersects(a: Rect, b: Rect) {
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

function rectIncludesTopAndBottom(a: Rect, b: Rect) {
  return a.top <= b.top && a.top + a.height >= b.top + b.height;
}

function filterBlockInfos(blockInfos: BlockInfo[], userRect: Rect) {
  const results: BlockInfo[] = [];
  for (const blockInfo of blockInfos) {
    const rect = blockInfo.rect;
    if (userRect.top + userRect.height < rect.top) break;

    results.push(blockInfo);
  }

  return results;
}

function filterBlockInfosByParent(
  parentInfos: BlockInfo,
  userRect: Rect,
  filteredBlockInfos: BlockInfo[]
) {
  const targetBlock = parentInfos.element;
  let results = [parentInfos];
  if (targetBlock.childElementCount > 0) {
    const childBlockInfos = targetBlock.childBlockElements
      .map(el =>
        filteredBlockInfos.find(
          blockInfo => blockInfo.element.model.id === el.model.id
        )
      )
      .filter(block => block) as BlockInfo[];
    const firstIndex = childBlockInfos.findIndex(
      bl => rectIntersects(bl.rect, userRect) && bl.rect.top < userRect.top
    );
    const lastIndex = childBlockInfos.findIndex(
      bl =>
        rectIntersects(bl.rect, userRect) &&
        bl.rect.top + bl.rect.height > userRect.top + userRect.height
    );

    if (firstIndex !== -1 && lastIndex !== -1) {
      results = childBlockInfos.slice(firstIndex, lastIndex + 1);
    }
  }

  return results;
}

function getSelectingBlockPaths(blockInfos: BlockInfo[], userRect: Rect) {
  const filteredBlockInfos = filterBlockInfos(blockInfos, userRect);
  const len = filteredBlockInfos.length;
  const blockPaths: string[][] = [];
  let singleTargetParentBlock: BlockInfo | null = null;
  let blocks: BlockInfo[] = [];
  if (len === 0) return blockPaths;

  // To get the single target parent block info
  for (const block of filteredBlockInfos) {
    const rect = block.rect;

    if (
      rectIntersects(userRect, rect) &&
      rectIncludesTopAndBottom(rect, userRect)
    ) {
      singleTargetParentBlock = block;
    }
  }

  if (singleTargetParentBlock) {
    blocks = filterBlockInfosByParent(
      singleTargetParentBlock,
      userRect,
      filteredBlockInfos
    );
  } else {
    // If there is no block contains the top and bottom of the userRect
    // Then get all the blocks that intersect with the userRect
    for (const block of filteredBlockInfos) {
      if (rectIntersects(userRect, block.rect)) {
        blocks.push(block);
      }
    }
  }

  // Filter out the blocks which parent is in the blocks
  for (let i = 0; i < blocks.length; i++) {
    const parent = blocks[i].element.parentPath.join('|');
    const isParentInBlocks = blocks.some(
      block => block.element.path.join('|') === parent
    );
    if (!isParentInBlocks) {
      blockPaths.push(blocks[i].element.path);
    }
  }

  return blockPaths;
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

  private _lastPointerState: PointerEventState | null = null;

  private _dragging = false;

  private _offset: {
    top: number;
    left: number;
  } = {
    top: 0,
    left: 0,
  };

  private get _allBlocksWithRect(): BlockInfo[] {
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
        element,
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
    const selections = getSelectingBlockPaths(
      this._allBlocksWithRect,
      userRect
    ).map(blockPath => {
      return this.root.selectionManager.getInstance('block', {
        path: blockPath,
      });
    });

    this.root.selectionManager.setGroup('note', selections);
  }

  private _clearRaf() {
    if (this._rafID) {
      cancelAnimationFrame(this._rafID);
      this._rafID = 0;
    }
  }

  private _runner = (state: PointerEventState, shouldAutoScroll: boolean) => {
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
    this._lastPointerState = state;

    if (shouldAutoScroll) {
      const result = autoScroll(this._viewportElement, y);
      if (!result) {
        this._clearRaf();
        return;
      }
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent(
      'dragStart',
      ctx => {
        const state = ctx.get('pointerState');
        const { button } = state.raw;
        if (button !== 0) return;

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
        const state = ctx.get('pointerState');
        this._rafID = requestAnimationFrame(() => {
          this._runner(state, true);
        });

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
        this._lastPointerState = null;
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

    this.handleEvent('wheel', () => {
      if (!this._dragging || !this._lastPointerState) {
        return;
      }

      this._clearRaf();
      const state = this._lastPointerState;
      this._rafID = requestAnimationFrame(() => {
        this._runner(state, true);
      });

      return true;
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

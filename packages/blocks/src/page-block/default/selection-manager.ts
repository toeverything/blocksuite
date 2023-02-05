import type { Page } from '@blocksuite/store';
import type { EmbedBlockComponent } from '../../embed-block/index.js';
import { showFormatQuickBar } from '../../components/format-quick-bar/index.js';
import '../../components/drag-handle.js';
import {
  handleNativeRangeClick,
  handleNativeRangeDblClick,
  handleNativeRangeDragMove,
  initMouseEventHandlers,
  isBlankArea,
  isEmbed,
  resetNativeSelection,
  SelectionEvent,
  getBlockElementByModel,
  getAllBlocks,
  getDefaultPageBlock,
  IPoint,
  getCurrentRange,
  isTitleElement,
  isDatabaseInput,
  isDatabase,
} from '../../__internal__/index.js';
import type { RichText } from '../../__internal__/rich-text/rich-text.js';
import {
  getNativeSelectionMouseDragInfo,
  repairContextMenuRange,
} from '../utils/position.js';
import type { DefaultPageSignals } from './default-page-block.js';
import {
  getBlockEditingStateByPosition,
  getAllowSelectedBlocks,
} from './utils.js';
import type { BaseBlockModel } from '@blocksuite/store';
import type { DefaultPageBlockComponent } from './default-page-block.js';
import { EmbedResizeManager } from './embed-resize-manager.js';
import {
  assertExists,
  caretRangeFromPoint,
  matchFlavours,
} from '@blocksuite/global/utils';
import { DisposableGroup } from '@blocksuite/store';
import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '@blocksuite/global/config';

function calcDepth(left: number, containerLeft: number) {
  return Math.ceil(
    (left - containerLeft) / BLOCK_CHILDREN_CONTAINER_PADDING_LEFT
  );
}

function calcContainerLeft(left: number) {
  return left + BLOCK_CHILDREN_CONTAINER_PADDING_LEFT;
}

function intersects(a: DOMRect, b: DOMRect, offset: IPoint) {
  return (
    a.left + offset.x <= b.right &&
    a.right + offset.x >= b.left &&
    a.top + offset.y <= b.bottom &&
    a.bottom + offset.y >= b.top
  );
}

function contains(bound: DOMRect, a: DOMRect, offset: IPoint) {
  return (
    a.left >= bound.left + offset.x &&
    a.right <= bound.right + offset.x &&
    a.top >= bound.top + offset.y &&
    a.bottom <= bound.bottom + offset.y
  );
}

// See https://github.com/toeverything/blocksuite/pull/904 and
// https://github.com/toeverything/blocksuite/issues/839#issuecomment-1411742112
// for more context.
function filterSelectedBlockWithoutSubtree(
  blockCache: Map<Element, DOMRect>,
  selectionRect: DOMRect,
  offset: IPoint
) {
  const entries = Array.from(blockCache.entries());
  const len = entries.length;
  const results: { block: Element; index: number }[] = [];

  // empty
  if (len === 0) return results;

  const containerLeft = calcContainerLeft(entries[0][1].left);
  let depth = 1;
  let parentIndex: number | undefined;
  let once = true;

  for (let i = 0; i < len; i++) {
    const [block, rect] = entries[i];
    if (intersects(rect, selectionRect, offset)) {
      const currentDepth = calcDepth(rect.left, containerLeft);
      if (once) {
        depth = currentDepth;
        once = false;
      } else {
        if (currentDepth > depth) {
          // not continuous block
          if (results.length > 1) {
            continue;
          }

          depth = currentDepth;
          results.shift();
        } else if (currentDepth < depth) {
          // backward search parent block and remove its subtree
          let n = i;
          while (n--) {
            if (calcDepth(entries[n][1].left, containerLeft) === currentDepth) {
              parentIndex = n;
              break;
            } else {
              results.pop();
            }
          }

          assertExists(parentIndex);

          depth = currentDepth;
          results.push({ block: entries[parentIndex][0], index: parentIndex });
        }
      }
      results.push({ block, index: i });
    }
  }

  return results;
}

// find the current focused block and its substree
function filterSelectedBlockByIndex(
  blockCache: Map<Element, DOMRect>,
  focusedBlockIndex: number,
  selectionRect: DOMRect,
  offset: IPoint
): Element[] {
  // SELECT_ALL
  if (focusedBlockIndex === -1) {
    return Array.from(blockCache.keys());
  }

  const entries = Array.from(blockCache.entries());
  const len = entries.length;
  const results = [];
  let once = true;
  let boundRect: DOMRect | null = null;

  for (let i = focusedBlockIndex; i < len; i++) {
    const [block, rect] = entries[i];
    if (once) {
      const richText = block.querySelector('rich-text');
      assertExists(richText);
      const richTextRect = richText.getBoundingClientRect();
      if (intersects(richTextRect, selectionRect, offset)) {
        boundRect = rect;
        results.push(block);
        once = false;
      }
    } else {
      if (boundRect) {
        // sometimes: rect.bottom = 467.2372016906738, boundRect.bottom = 467.23719024658203
        if (contains(boundRect, rect, { x: 0, y: 1 })) {
          results.push(block);
        } else {
          break;
        }
      }
    }
  }

  return results;
}

// clear subtree in block for drawing rect
function clearSubtree(selectedBlocks: Element[], left: number) {
  return selectedBlocks.filter((block, index) => {
    if (index === 0) return true;
    const currentLeft = block.getBoundingClientRect().left;
    if (currentLeft > left) {
      return false;
    } else if (currentLeft < left) {
      left = currentLeft;
      return true;
    } else {
      return true;
    }
  });
}

// find blocks and its subtree
function findBlocksWithSubtree(
  blockCache: Map<Element, DOMRect>,
  selectedBlocksWithoutSubtree: { block: Element; index: number }[] = []
) {
  const results = [];
  const len = selectedBlocksWithoutSubtree.length;

  for (let i = 0; i < len; i++) {
    const { block, index } = selectedBlocksWithoutSubtree[i];
    // find block's subtree
    results.push(
      ...filterSelectedBlockByIndex(
        blockCache,
        index,
        blockCache.get(block) as DOMRect,
        { x: 0, y: 0 }
      )
    );
  }

  return results;
}

// TODO
// function filterSelectedEmbed(
//   embedCache: Map<EmbedBlockComponent, DOMRect>,
//   selectionRect: DOMRect
// ): EmbedBlockComponent[] {
//   const embeds = Array.from(embedCache.keys());
//   return embeds.filter(embed => {
//     const rect = embed.getBoundingClientRect();
//     return intersects(rect, selectionRect);
//   });
// }

function createSelectionRect(
  current: { x: number; y: number },
  start: { x: number; y: number }
) {
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  const left = Math.min(current.x, start.x);
  const top = Math.min(current.y, start.y);
  return new DOMRect(left, top, width, height);
}

type PageSelectionType = 'native' | 'block' | 'none' | 'embed' | 'database';

export class PageSelectionState {
  type: PageSelectionType;
  selectEmbeds: EmbedBlockComponent[] = [];
  selectedBlocks: Element[] = [];
  // -1: SELECT_ALL
  // >=0: only current focused-block
  focusedBlockIndex = -1;
  private _startRange: Range | null = null;
  private _startPoint: { x: number; y: number } | null = null;
  private _endPoint: { x: number; y: number } | null = null;
  private _richTextCache = new Map<RichText, DOMRect>();
  private _blockCache = new Map<Element, DOMRect>();
  private _embedCache = new Map<EmbedBlockComponent, DOMRect>();
  private _activeComponent: HTMLElement | null = null;

  constructor(type: PageSelectionType) {
    this.type = type;
  }

  get activeComponent() {
    return this._activeComponent;
  }

  set activeComponent(component: HTMLElement | null) {
    this._activeComponent = component;
  }

  get startRange() {
    return this._startRange;
  }

  get startPoint() {
    return this._startPoint;
  }

  get endPoint() {
    return this._endPoint;
  }

  get richTextCache() {
    return this._richTextCache;
  }

  get blockCache() {
    return this._blockCache;
  }

  get embedCache() {
    return this._embedCache;
  }

  resetStartRange(
    e: SelectionEvent,
    offset: { x: number; y: number } = { x: 0, y: 0 }
  ) {
    const x = offset.x + e.x;
    const y = offset.y + e.y;
    this._startRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
    this._startPoint = { x, y };
    this._endPoint = { x, y };
  }

  setEndPoint(point: { x: number; y: number }) {
    this._endPoint = point;
  }

  refreshBlockRectCache() {
    this._blockCache.clear();
    const allBlocks = getAllBlocks();
    for (const block of allBlocks) {
      const rect = block.getBoundingClientRect();
      this._blockCache.set(block, rect);
    }
  }

  clear() {
    this.type = 'none';
    this._richTextCache.clear();
    this._startRange = null;
    this._startPoint = null;
    this._endPoint = null;
    this.focusedBlockIndex = -1;
    this.selectedBlocks = [];
  }
}

export class DefaultSelectionManager {
  readonly page: Page;
  readonly state = new PageSelectionState('none');
  private readonly _mouseRoot: HTMLElement;
  private readonly _container: DefaultPageBlockComponent;
  private readonly _disposables = new DisposableGroup();
  private readonly _signals: DefaultPageSignals;
  private readonly _embedResizeManager: EmbedResizeManager;

  constructor({
    page,
    mouseRoot,
    signals,
    container,
  }: {
    page: Page;
    mouseRoot: HTMLElement;
    signals: DefaultPageSignals;
    container: DefaultPageBlockComponent;
  }) {
    this.page = page;
    this._signals = signals;
    this._mouseRoot = mouseRoot;
    this._container = container;

    this._embedResizeManager = new EmbedResizeManager(this.state, signals);
    this._disposables.add(
      initMouseEventHandlers(
        this._mouseRoot,
        this._onContainerDragStart,
        this._onContainerDragMove,
        this._onContainerDragEnd,
        this._onContainerClick,
        this._onContainerDblClick,
        this._onContainerMouseMove,
        this._onContainerMouseOut,
        this._onContainerContextMenu,
        this._onSelectionChange
      )
    );
  }

  /**
   * This array contains the blocks allowed to be selected by selection manager.
   *  Blocks like `affine:frame`, blocks inside `affine:database` will be discharged.
   * @private
   */
  private get _allowSelectedBlocks(): BaseBlockModel[] {
    return this.page.root ? getAllowSelectedBlocks(this.page.root) : [];
  }

  private get _containerOffset() {
    const containerRect = this._mouseRoot.getBoundingClientRect();
    const containerOffset = {
      x: containerRect.left,
      y: containerRect.top,
    };
    return containerOffset;
  }

  private _setSelectedBlocks = (
    selectedBlocks: Element[],
    rects: DOMRect[] = []
  ) => {
    this.state.selectedBlocks = selectedBlocks;
    this._signals.updateSelectedRects.emit(rects);
  };

  private _onBlockSelectionDragStart(e: SelectionEvent) {
    this.state.type = 'block';
    const viewport = this._container.defaultViewportElement;
    this.state.resetStartRange(e, {
      x: viewport.scrollLeft,
      y: viewport.scrollTop,
    });
    this.state.refreshBlockRectCache();
    resetNativeSelection(null);
    // deactivate quill keyboard event handler
    (document.activeElement as HTMLDivElement).blur();
  }

  private _onBlockSelectionDragMove(e: SelectionEvent) {
    assertExists(this.state.startPoint);
    const current = { x: e.x, y: e.y };
    const viewport = this._container.defaultViewportElement;
    const { scrollHeight, clientHeight, scrollTop } = viewport;
    const max = scrollHeight - clientHeight;
    const top = e.y < 50;
    const bottom = clientHeight - e.y;
    if (bottom <= 50) {
      const d = scrollTop + 10 <= max ? 10 : max - scrollTop;
      viewport.scrollTop += d;
      current.y = viewport.scrollTop + e.y;
    } else if (top) {
      const d = scrollTop - 10 <= 0 ? scrollTop : 10;
      viewport.scrollTop -= d;
      current.y = viewport.scrollTop + e.y;
    } else {
      current.y = viewport.scrollTop + e.y;
    }

    this.state.setEndPoint(current);

    const { blockCache, startPoint: start, endPoint: end } = this.state;
    const selectionRect = createSelectionRect(end, start);
    const selectedBlocksWithoutSubtrees = filterSelectedBlockWithoutSubtree(
      blockCache,
      selectionRect,
      {
        y: viewport.scrollTop,
        x: viewport.scrollLeft,
      }
    );
    const rects = selectedBlocksWithoutSubtrees.map(
      ({ block }) => blockCache.get(block) as DOMRect
    );

    this._setSelectedBlocks(
      findBlocksWithSubtree(blockCache, selectedBlocksWithoutSubtrees),
      rects
    );
    this._signals.updateFrameSelectionRect.emit(selectionRect);
  }

  private _onBlockSelectionDragEnd(e: SelectionEvent) {
    this.state.type = 'block';
    this._signals.updateFrameSelectionRect.emit(null);
    // do not clear selected rects here
  }

  private _onNativeSelectionDragStart(e: SelectionEvent) {
    this._signals.nativeSelection.emit(false);
    this.state.type = 'native';
  }

  private _onNativeSelectionDragMove(e: SelectionEvent) {
    handleNativeRangeDragMove(this.state.startRange, e);
  }

  private _onNativeSelectionDragEnd(e: SelectionEvent) {
    this._signals.nativeSelection.emit(true);
  }

  private _onContainerDragStart = (e: SelectionEvent) => {
    const viewport = this._container.defaultViewportElement;
    this.state.resetStartRange(e, {
      x: viewport.scrollLeft,
      y: viewport.scrollTop,
    });
    if (isTitleElement(e.raw.target) || isDatabaseInput(e.raw.target)) {
      this.state.type = 'none';
      return;
    }
    if (isEmbed(e)) {
      this.state.type = 'embed';
      this._embedResizeManager.onStart(e);
      return;
    }
    if (isDatabase(e)) {
      this.state.type = 'database';
      // todo: add manager
      return;
    }

    // disable dragHandle button
    this._container.components.dragHandle?.setPointerEvents('none');

    if (isBlankArea(e)) {
      this._onBlockSelectionDragStart(e);
    } else {
      this._onNativeSelectionDragStart(e);
    }
  };

  private _onContainerDragMove = (e: SelectionEvent) => {
    if (this.state.type === 'native') {
      return this._onNativeSelectionDragMove(e);
    }

    if (this._container.readonly) {
      return;
    }

    if (this.state.type === 'block') {
      return this._onBlockSelectionDragMove(e);
    }
    if (this.state.type === 'embed') {
      return this._embedResizeManager.onMove(e);
    }
  };

  private _onContainerDragEnd = (e: SelectionEvent) => {
    this._container.components.dragHandle?.setPointerEvents('auto');

    if (this.state.type === 'native') {
      this._onNativeSelectionDragEnd(e);
    } else if (this.state.type === 'block') {
      this._onBlockSelectionDragEnd(e);
    } else if (this.state.type === 'embed') {
      this._embedResizeManager.onEnd();
    }
    if (this._container.readonly) {
      return;
    }
    this._showFormatQuickBar(e);
  };

  private _showFormatQuickBar(e: SelectionEvent) {
    if (this.state.type === 'native') {
      const { direction, selectedType } = getNativeSelectionMouseDragInfo(e);
      if (selectedType === 'Caret') {
        // If nothing is selected, then we should not show the format bar
        return;
      }

      showFormatQuickBar({ direction });
    } else if (this.state.type === 'block') {
      // TODO handle block selection
      // const direction = getDragDirection(e);
      // const { selectedRichTexts } = this._getSelectedBlockInfo(e);
      // if (selectedRichTexts.length === 0) {
      //   // Selecting nothing
      //   return;
      // }
      // const selectedBlocks = selectedRichTexts.map(richText => {
      //   return getBlockById(richText.model.id) as unknown as HTMLElement;
      // });
      // const selectedType: SelectedBlockType = selectedBlocks.every(block => {
      //   return /paragraph-block/i.test(block.tagName);
      // })
      //   ? 'text'
      //   : 'other';
      // console.log(`selectedType: ${selectedType}`, this.state.type);
      // const anchor = ['rightDown', 'leftDown'].includes(direction)
      //   ? selectedBlocks[selectedBlocks.length - 1]
      //   : selectedBlocks[0];
      // showFormatQuickBar({ anchorEl: anchor });
    }
  }

  private _onContainerClick = (e: SelectionEvent) => {
    this.state.clear();
    this._signals.updateSelectedRects.emit([]);
    this._signals.updateEmbedRects.emit([]);

    // mouseRoot click will blur all captions
    const allCaptions = Array.from(
      document.querySelectorAll('.affine-embed-wrapper-caption')
    );
    allCaptions.forEach(el => {
      if (el !== e.raw.target) {
        (el as HTMLInputElement).blur();
      }
    });

    const clickBlockInfo = getBlockEditingStateByPosition(
      this._allowSelectedBlocks,
      e.raw.pageX,
      e.raw.pageY
    );

    if (clickBlockInfo && clickBlockInfo.model) {
      const { model, index } = clickBlockInfo;
      const page = getDefaultPageBlock(model);
      page.lastSelectionPosition = 'start';
      this.state.focusedBlockIndex = index;
    }

    if (
      clickBlockInfo &&
      matchFlavours(clickBlockInfo.model, ['affine:embed', 'affine:divider'])
    ) {
      this.state.type = 'block';
      window.getSelection()?.removeAllRanges();

      this.state.activeComponent = getBlockElementByModel(clickBlockInfo.model);

      assertExists(this.state.activeComponent);
      if (clickBlockInfo.model.type === 'image') {
        this._signals.updateEmbedRects.emit([clickBlockInfo.position]);
      } else {
        this._signals.updateSelectedRects.emit([clickBlockInfo.position]);
      }
      this.state.selectedBlocks.push(this.state.activeComponent);
      return;
    }
    const target = e.raw.target;
    if (isTitleElement(target) || isDatabaseInput(target)) {
      return;
    }
    if (e.keys.shift) return;
    handleNativeRangeClick(this.page, e);
  };

  private _onContainerDblClick = (e: SelectionEvent) => {
    this.state.clear();
    this._signals.updateSelectedRects.emit([]);
    if (e.raw.target instanceof HTMLTextAreaElement) return;
    const range = handleNativeRangeDblClick(this.page, e);
    if (!range || range.collapsed) {
      return;
    }
    if (this._container.readonly) {
      return;
    }
    showFormatQuickBar({ direction: 'center-bottom' });
  };

  private _onContainerContextMenu = (e: SelectionEvent) => {
    repairContextMenuRange(e);
  };

  private _onContainerMouseMove = (e: SelectionEvent) => {
    this.state.refreshBlockRectCache();
    const hoverEditingState = getBlockEditingStateByPosition(
      this._allowSelectedBlocks,
      e.raw.pageX,
      e.raw.pageY
    );
    if ((e.raw.target as HTMLElement).closest('.embed-editing-state')) return;

    if (hoverEditingState?.model.type === 'image') {
      const { position } = hoverEditingState;
      // when image size is too large, the option popup should show inside
      if (position.width > 680) {
        hoverEditingState.position.x = hoverEditingState.position.right - 50;
      } else {
        hoverEditingState.position.x = hoverEditingState.position.right + 10;
      }
      this._signals.updateEmbedEditingState.emit(hoverEditingState);
    } else if (hoverEditingState?.model.flavour === 'affine:code') {
      hoverEditingState.position.x = hoverEditingState.position.right + 12;
      this._signals.updateCodeBlockOption.emit(hoverEditingState);
    } else {
      if (this._container.components.dragHandle) {
        this._container.components.dragHandle.showBySelectionEvent(e);
      }
      this._signals.updateEmbedEditingState.emit(null);
      this._signals.updateCodeBlockOption.emit(null);
    }
  };

  private _onContainerMouseOut = (e: SelectionEvent) => {
    // console.log('mouseout', e);
  };

  private _onSelectionChange = (e: Event) => {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    // Exclude selection change outside the editor
    if (!selection.containsNode(this._container, true)) {
      return;
    }

    const range = getCurrentRange(selection);
    if (range.collapsed) {
      return;
    }
    if (this._container.readonly) {
      return;
    }

    // Fix selection direction after support multi-line selection by keyboard
    // FIXME: if selection produced by mouse, it always be `left-right`
    const offsetDelta = selection.anchorOffset - selection.focusOffset;
    let direction: 'left-right' | 'right-left' | 'none' = 'none';

    if (offsetDelta > 0) {
      direction = 'right-left';
    } else if (offsetDelta < 0) {
      direction = 'left-right';
    }
    showFormatQuickBar({
      direction: direction === 'left-right' ? 'right-bottom' : 'left-top',
    });
  };

  clearRects() {
    this._signals.updateSelectedRects.emit([]);
    this._signals.updateFrameSelectionRect.emit(null);
    this._signals.updateEmbedEditingState.emit(null);
    this._signals.updateEmbedRects.emit([]);
  }

  dispose() {
    this._signals.updateSelectedRects.dispose();
    this._signals.updateFrameSelectionRect.dispose();
    this._signals.updateEmbedEditingState.dispose();
    this._signals.updateEmbedRects.dispose();
    this._disposables.dispose();
  }

  // Click on drag-handle button
  selectBlocksByIndexAndBounding(index: number, boundRect: DOMRect) {
    this.state.focusedBlockIndex = index;

    const { blockCache, focusedBlockIndex } = this.state;

    if (focusedBlockIndex === -1) {
      return;
    }

    this.state.type = 'block';
    this.state.refreshBlockRectCache();

    const selectedBlocks = filterSelectedBlockByIndex(
      blockCache,
      focusedBlockIndex,
      boundRect,
      this._containerOffset
    );

    // only current focused-block
    this._setSelectedBlocks(selectedBlocks, [boundRect]);
  }

  // Click on the prefix icon of list block
  resetSelectedBlockByRect(
    blockElement: Element,
    pageSelectionType: PageSelectionType = 'block'
  ) {
    this.setFocusedBlockIndexByElement(blockElement);

    const { blockCache, focusedBlockIndex } = this.state;

    if (focusedBlockIndex === -1) {
      return;
    }

    this.state.type = pageSelectionType;
    this.state.refreshBlockRectCache();

    const boundRect = blockCache.get(blockElement) as DOMRect;
    const selectedBlocks = filterSelectedBlockByIndex(
      blockCache,
      focusedBlockIndex,
      boundRect,
      this._containerOffset
    );

    // only current focused-block
    this._setSelectedBlocks(selectedBlocks, [boundRect]);
  }

  // `CMD-A`
  selectBlocksByRect(hitRect: DOMRect) {
    this.state.refreshBlockRectCache();
    const { blockCache, focusedBlockIndex } = this.state;
    const selectedBlocks = filterSelectedBlockByIndex(
      blockCache,
      focusedBlockIndex,
      hitRect,
      {
        x: 0,
        y: 0,
      }
    );

    if (this.state.blockCache.size === this.state.selectedBlocks.length) {
      this._signals.updateSelectedRects.emit([]);
      this._signals.updateEmbedRects.emit([]);
      return;
    }
    this.state.clear();
    this.state.type = 'block';

    this._signals.updateEmbedRects.emit([]);

    if (focusedBlockIndex === -1) {
      // SELECT_ALL
      const containerLeft = (blockCache.get(selectedBlocks[0]) as DOMRect).left;
      const rects = clearSubtree(selectedBlocks, containerLeft).map(
        block => blockCache.get(block) as DOMRect
      );
      this._setSelectedBlocks(selectedBlocks, rects);
    } else {
      // only current focused-block
      const rects = selectedBlocks
        .slice(0, 1)
        .map(block => blockCache.get(block) as DOMRect);
      this._setSelectedBlocks(selectedBlocks, rects);
    }

    return;
  }

  setFocusedBlockIndexByElement(blockElement: Element) {
    const result = this.getBlockWithIndexByElement(blockElement);
    if (result) {
      this.state.focusedBlockIndex = result.index;
    } else {
      this.state.focusedBlockIndex = -1;
    }
  }

  getBlockWithIndexByElement(blockElement: Element) {
    const entries = Array.from(this.state.blockCache.entries());
    const len = entries.length;
    const boundRect = blockElement.getBoundingClientRect();
    const top = boundRect.top;

    if (!boundRect) return null;

    // fake a small rectangle: { top: top, bottom: top + h }
    const h = 5;
    let start = 0;
    let end = len - 1;

    // binary search block
    while (start <= end) {
      const mid = start + Math.floor((end - start) / 2);
      const [block, rect] = entries[mid];
      if (top <= rect.top + h) {
        if (mid === 0 || top >= rect.top) {
          return { block, index: mid };
        }
      }

      if (rect.top > top) {
        end = mid - 1;
      } else if (rect.top + h < top) {
        start = mid + 1;
      }
    }

    return null;
  }
}

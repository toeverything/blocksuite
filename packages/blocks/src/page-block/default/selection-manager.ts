import '../../components/drag-handle.js';

import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '@blocksuite/global/config';
import {
  assertExists,
  caretRangeFromPoint,
  matchFlavours,
} from '@blocksuite/global/utils';
import type { Page, UserRange } from '@blocksuite/store';
import { BaseBlockModel, DisposableGroup } from '@blocksuite/store';

import {
  BlockComponentElement,
  getAllBlocks,
  getBlockElementByModel,
  getCurrentNativeRange,
  getDefaultPageBlock,
  getModelByElement,
  handleNativeRangeClick,
  handleNativeRangeDblClick,
  handleNativeRangeDragMove,
  initMouseEventHandlers,
  IPoint,
  isBlankArea,
  isDatabase,
  isDatabaseInput,
  isEmbed,
  isTitleElement,
  resetNativeSelection,
  SelectionEvent,
} from '../../__internal__/index.js';
import type { RichText } from '../../__internal__/rich-text/rich-text.js';
import { getCurrentBlockRange } from '../../__internal__/utils/block-range.js';
import { showFormatQuickBar } from '../../components/format-quick-bar/index.js';
import type {
  EmbedBlockComponent,
  ImageBlockComponent,
} from '../../embed-block/index.js';
import {
  getNativeSelectionMouseDragInfo,
  repairContextMenuRange,
} from '../utils/position.js';
import type {
  DefaultPageBlockComponent,
  DefaultPageSignals,
  EmbedEditingState,
  ViewportState,
} from './default-page-block.js';
import { EmbedResizeManager } from './embed-resize-manager.js';
import {
  getAllowSelectedBlocks,
  getBlockEditingStateByPosition,
} from './utils.js';

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
//
// The `selectionRect` is a rect of drag-and-drop selection.
//
// TODO: checks the parent by `contains` method
function filterSelectedBlockWithoutSubtree(
  blockCache: Map<BlockComponentElement, DOMRect>,
  selectionRect: DOMRect,
  offset: IPoint
) {
  const entries = Array.from(blockCache.entries());
  const len = entries.length;
  const results: { block: BlockComponentElement; index: number }[] = [];

  // empty
  if (len === 0) return results;

  const containerLeft = calcContainerLeft(entries[0][1].left);
  let depth = 1;
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
            const [b, r] = entries[n];
            if (calcDepth(r.left, containerLeft) === currentDepth) {
              results.push({ block: b, index: n });
              break;
            } else {
              results.pop();
            }
          }

          depth = currentDepth;
        }
      }
      results.push({ block, index: i });
    }
  }

  return results;
}

// Find the current focused block and its substree.
// The `selectionRect` is a rect of block element.
function filterSelectedBlockByIndex(
  blockCache: Map<BlockComponentElement, DOMRect>,
  focusedBlockIndex: number,
  selectionRect: DOMRect,
  offset: IPoint = {
    x: 0,
    y: 0,
  }
): BlockComponentElement[] {
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
      const nextRect = richText?.getBoundingClientRect() || rect;

      if (nextRect && intersects(rect, selectionRect, offset)) {
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
function clearSubtree(selectedBlocks: BlockComponentElement[], left: number) {
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
  blockCache: Map<BlockComponentElement, DOMRect>,
  selectedBlocksWithoutSubtree: {
    block: BlockComponentElement;
    index: number;
  }[] = []
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
        blockCache.get(block) as DOMRect
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
  selectedEmbeds: EmbedBlockComponent[] = [];
  selectedBlocks: BlockComponentElement[] = [];
  // -1: SELECT_ALL
  // >=0: only current focused-block
  focusedBlockIndex = -1;
  rafID?: number;
  private _startRange: Range | null = null;
  private _rangePoint: { x: number; y: number } | null = null;
  private _startPoint: { x: number; y: number } | null = null;
  private _endPoint: { x: number; y: number } | null = null;
  private _richTextCache = new Map<RichText, DOMRect>();
  private _blockCache = new Map<BlockComponentElement, DOMRect>();
  private _embedCache = new Map<EmbedBlockComponent, DOMRect>();
  private _activeComponent: BlockComponentElement | null = null;

  constructor(type: PageSelectionType) {
    this.type = type;
  }

  get activeComponent() {
    return this._activeComponent;
  }

  set activeComponent(component: BlockComponentElement | null) {
    this._activeComponent = component;
  }

  get startRange() {
    return this._startRange;
  }

  get rangePoint() {
    return this._rangePoint;
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

  resetStartRange(e: SelectionEvent) {
    const { clientX, clientY } = e.raw;
    this._startRange = caretRangeFromPoint(clientX, clientY);
    // Save the last coordinates so that we can send them when scrolling through the wheel
    this.updateRangePoint(clientX, clientY);
  }

  updateRangePoint(x: number, y: number) {
    this._rangePoint = { x, y };
  }

  resetStartPoint(
    e: SelectionEvent,
    offset: { scrollLeft: number; scrollTop: number } = {
      scrollLeft: 0,
      scrollTop: 0,
    }
  ) {
    const { scrollLeft, scrollTop } = offset;
    let { x, y } = e;
    x += scrollLeft;
    y += scrollTop;
    this._startPoint = { x, y };
    this._endPoint = { x, y };
  }

  setStartPoint(point: { x: number; y: number } | null) {
    this._startPoint = point;
  }

  setEndPoint(point: { x: number; y: number } | null) {
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

  clearRaf() {
    if (this.rafID) {
      this.rafID = void cancelAnimationFrame(this.rafID);
    }
  }

  clearNative() {
    this.type = 'none';
    this._richTextCache.clear();
    this._startRange = null;
    this._rangePoint = null;
    resetNativeSelection(null);
  }

  clearBlockSelectionRect() {
    this.clearRaf();
    this._startPoint = null;
    this._endPoint = null;
  }

  clearBlock() {
    this.type = 'none';
    this._activeComponent = null;
    this.focusedBlockIndex = -1;
    this.selectedBlocks = [];
    this.clearBlockSelectionRect();
  }

  clearEmbed() {
    this.type = 'none';
    this.selectedEmbeds = [];
    this._activeComponent = null;
  }

  clear() {
    this.clearBlock();
    this.clearEmbed();
    this.clearNative();
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
  private readonly _threshold: number; // distance to the upper and lower boundaries of the viewport

  constructor({
    page,
    mouseRoot,
    signals,
    container,
    threshold,
  }: {
    page: Page;
    mouseRoot: HTMLElement;
    signals: DefaultPageSignals;
    container: DefaultPageBlockComponent;
    threshold: number;
  }) {
    this.page = page;
    this._signals = signals;
    this._mouseRoot = mouseRoot;
    this._container = container;
    this._threshold = threshold;

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
        this._onSelectionChangeWithDebounce,
        this._onSelectionChangeWithoutDebounce
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

  private _computeSelectionType(
    selectedBlocks: Element[],
    selectionType?: PageSelectionType
  ): PageSelectionType {
    let newSelectionType: PageSelectionType = selectionType ?? 'native';
    const isOnlyBlock = selectedBlocks.length === 1;
    for (const block of selectedBlocks) {
      if (selectionType) continue;
      if (!('model' in block)) continue;

      // Calculate selection type
      const model = getModelByElement(block);
      newSelectionType = 'block';

      // Other selection types are possible if only one block is selected
      if (!isOnlyBlock) continue;

      const flavour = model.flavour;
      switch (flavour) {
        case 'affine:embed': {
          newSelectionType = 'embed';
          break;
        }
        case 'affine:database': {
          newSelectionType = 'database';
          break;
        }
      }
    }
    return newSelectionType;
  }

  setSelectedBlocks(
    selectedBlocks: BlockComponentElement[],
    rects?: DOMRect[],
    selectionType?: PageSelectionType
  ) {
    this.state.selectedBlocks = selectedBlocks;
    this.state.type = selectionType ?? this.state.type;

    if (rects) {
      this._signals.updateSelectedRects.emit(rects);
      return;
    }

    const calculatedRects = [] as DOMRect[];
    for (const block of selectedBlocks) {
      calculatedRects.push(block.getBoundingClientRect());
    }

    const newSelectionType = this._computeSelectionType(
      selectedBlocks,
      selectionType
    );
    this.state.type = newSelectionType;
    this._signals.updateSelectedRects.emit(calculatedRects);
  }

  private _onBlockSelectionDragStart(e: SelectionEvent) {
    this.state.type = 'block';
    this._container.updateViewportState();
    const { scrollLeft, scrollTop } = this._container.viewportState;
    this.state.resetStartPoint(e, {
      scrollTop,
      scrollLeft,
    });
    this.state.refreshBlockRectCache();
    // deactivate quill keyboard event handler
    (document.activeElement as HTMLDivElement).blur();
  }

  private _onBlockSelectionDragMove(e: SelectionEvent) {
    const { x, y } = e;

    const { defaultViewportElement: viewport, viewportState } = this._container;
    const { scrollHeight, clientHeight, scrollLeft } = viewportState;
    let { scrollTop } = viewportState;
    const max = scrollHeight - clientHeight;

    this.state.setEndPoint({ x: x + scrollLeft, y: y + scrollTop });

    const { startPoint, endPoint } = this.state;

    assertExists(startPoint);
    assertExists(endPoint);

    let auto = true;
    const autoScroll = () => {
      if (!auto) {
        this.state.clearRaf();
        return;
      } else {
        this.state.rafID = requestAnimationFrame(autoScroll);
      }

      // TODO: for the behavior of scrolling, see the native selection
      // speed easeOutQuad + easeInQuad
      if (Math.ceil(scrollTop) < max && clientHeight - y < this._threshold) {
        // ↓
        const d = (this._threshold - (clientHeight - y)) * 0.25;
        scrollTop += d;
        endPoint.y += d;
        auto = Math.ceil(scrollTop) < max;
        viewport.scrollTop = scrollTop;
        this.updateSelectionRect(startPoint, endPoint);
      } else if (scrollTop > 0 && y < this._threshold) {
        // ↑
        const d = (y - this._threshold) * 0.25;
        scrollTop += d;
        endPoint.y += d;
        auto = scrollTop > 0;
        viewport.scrollTop = scrollTop;
        this.updateSelectionRect(startPoint, endPoint);
      } else {
        auto = false;
        const selectionRect = this.updateSelectionRect(startPoint, endPoint);
        this.selecting(this.state.blockCache, selectionRect, viewportState);
      }
    };

    this.state.clearRaf();
    this.state.rafID = requestAnimationFrame(autoScroll);
  }

  private _onBlockSelectionDragEnd(_: SelectionEvent) {
    this.state.type = 'block';
    this.state.clearBlockSelectionRect();
    this._signals.updateFrameSelectionRect.emit(null);
    // do not clear selected rects here
  }

  private _onNativeSelectionDragStart(e: SelectionEvent) {
    this.state.resetStartRange(e);
    this.state.type = 'native';
    this._signals.nativeSelection.emit(false);
  }

  private _onNativeSelectionDragMove(e: SelectionEvent) {
    this.state.updateRangePoint(e.raw.clientX, e.raw.clientY);
    handleNativeRangeDragMove(this.state.startRange, e);
  }

  private _onNativeSelectionDragEnd(_: SelectionEvent) {
    this._signals.nativeSelection.emit(true);
  }

  private _onContainerDragStart = (e: SelectionEvent) => {
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

    // clear selection first
    this.clear();

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

    if (this.state.type === 'native') {
      const { direction, selectedType } = getNativeSelectionMouseDragInfo(e);
      if (selectedType === 'Caret') {
        // If nothing is selected, then we should not show the format bar
        return;
      }
      showFormatQuickBar({ page: this.page, direction });
    } else if (this.state.type === 'block') {
      if (
        !this.page.awarenessStore.getFlag('enable_block_selection_format_bar')
      ) {
        return;
      }

      const direction = e.start.y < e.y ? 'center-bottom' : 'center-top';
      showFormatQuickBar({
        page: this.page,
        direction,
        anchorEl: {
          // After update block type, the block selection will be cleared and refreshed.
          // So we need to get the targe block's rect dynamic.
          getBoundingClientRect: () => {
            const blocks = this.state.selectedBlocks;
            if (!blocks.length) {
              throw new Error("Failed to get format bar's anchor element");
            }
            const firstBlock = blocks[0];
            const lastBlock = blocks[blocks.length - 1];
            const targetBlock =
              direction === 'center-bottom' ? lastBlock : firstBlock;
            return targetBlock.getBoundingClientRect();
          },
        },
      });
    }
  };

  private _onContainerClick = (e: SelectionEvent) => {
    // do nothing when clicking on scrollbar
    if (
      e.raw.pageX >=
      this._container.viewportState.clientWidth +
        this._container.viewportState.left
    ) {
      return;
    }

    // clear selection first
    this.clear();

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
      window.getSelection()?.removeAllRanges();

      this.state.activeComponent = getBlockElementByModel(clickBlockInfo.model);

      assertExists(this.state.activeComponent);
      if (clickBlockInfo.model.type === 'image') {
        this.state.type = 'embed';
        this.state.selectedEmbeds.push(
          this.state.activeComponent as EmbedBlockComponent
        );
        this._signals.updateEmbedRects.emit([clickBlockInfo.position]);
      } else {
        this.state.type = 'block';
        this.state.selectedBlocks.push(this.state.activeComponent);
        this._signals.updateSelectedRects.emit([clickBlockInfo.position]);
      }
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
    // clear selection first
    this.clear();

    if (e.raw.target instanceof HTMLTextAreaElement) return;
    const range = handleNativeRangeDblClick(this.page, e);
    if (!range || range.collapsed) {
      return;
    }
    if (this._container.readonly) {
      return;
    }
    showFormatQuickBar({ page: this.page, direction: 'center-bottom' });
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

    if (this._container.components.dragHandle) {
      this._container.components.dragHandle.showBySelectionEvent(e);
    }
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
      this._signals.updateEmbedEditingState.emit(null);
      this._signals.updateCodeBlockOption.emit(null);
    }
  };

  // TODO: Keep selecting blocks?
  private _onContainerMouseOut = (_: SelectionEvent) => {
    // console.log('mouseout', e);
  };

  private _onSelectionChangeWithDebounce = (_: Event) => {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    // Exclude selection change outside the editor
    if (!selection.containsNode(this._container, true)) {
      return;
    }

    const range = getCurrentNativeRange(selection);
    if (range.collapsed) {
      return;
    }
    if (this._container.readonly) {
      return;
    }

    const offsetDelta = selection.anchorOffset - selection.focusOffset;
    let direction: 'left-right' | 'right-left' | 'none' = 'none';

    if (offsetDelta > 0) {
      direction = 'right-left';
    } else if (offsetDelta < 0) {
      direction = 'left-right';
    }
    // Show quick bar when user select text by keyboard(Shift + Arrow)
    showFormatQuickBar({
      page: this.page,
      direction: direction === 'left-right' ? 'right-bottom' : 'left-top',
    });
  };

  private _onSelectionChangeWithoutDebounce = (_: Event) => {
    this.updateLocalSelection();
  };

  // clear selection: `block`, `embed`, `native`
  clear() {
    const { state, _signals } = this;
    const { type } = state;
    if (type === 'block') {
      state.clearBlock();
      _signals.updateSelectedRects.emit([]);
      _signals.updateFrameSelectionRect.emit(null);
    } else if (type === 'embed') {
      state.clearEmbed();
      _signals.updateEmbedRects.emit([]);
      _signals.updateEmbedEditingState.emit(null);
    } else if (type === 'native') {
      state.clearNative();
    }
  }

  dispose() {
    this._signals.updateSelectedRects.dispose();
    this._signals.updateFrameSelectionRect.dispose();
    this._signals.updateEmbedEditingState.dispose();
    this._signals.updateEmbedRects.dispose();
    this._disposables.dispose();
  }

  updateSelectionRect(
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number }
  ): DOMRect {
    if (this.state.focusedBlockIndex !== -1) {
      this.state.focusedBlockIndex = -1;
    }
    const selectionRect = createSelectionRect(endPoint, startPoint);
    this._signals.updateFrameSelectionRect.emit(selectionRect);
    return selectionRect;
  }

  selecting(
    blockCache: Map<BlockComponentElement, DOMRect>,
    selectionRect: DOMRect,
    viewportState: ViewportState
  ) {
    const { scrollLeft, scrollTop, left, top } = viewportState;
    const selectedBlocksWithoutSubtrees = filterSelectedBlockWithoutSubtree(
      blockCache,
      selectionRect,
      // subtracting the left/top of the container is required.
      {
        y: scrollTop - top,
        x: scrollLeft - left,
      }
    );
    const rects = selectedBlocksWithoutSubtrees.map(
      ({ block }) => blockCache.get(block) as DOMRect
    );

    this.setSelectedBlocks(
      findBlocksWithSubtree(blockCache, selectedBlocksWithoutSubtrees),
      rects
    );
  }

  refresh() {
    const { type } = this.state;
    if (type === 'block') {
      this.refreshSelectedBlocksRects();
    } else if (type === 'embed') {
      this.refreshEmbedRects();
    }
  }

  refreshSelectionRectAndSelecting(viewportState: ViewportState) {
    const { blockCache, startPoint, endPoint } = this.state;

    if (startPoint && endPoint) {
      this.state.refreshBlockRectCache();
      const selectionRect = createSelectionRect(endPoint, startPoint);
      this.selecting(blockCache, selectionRect, viewportState);
    } else {
      this.state.setStartPoint(null);
      this.state.setEndPoint(null);
      this._signals.updateFrameSelectionRect.emit(null);
      this.refreshSelectedBlocksRects();
    }
  }

  refreshSelectedBlocksRects() {
    this.state.refreshBlockRectCache();

    const { blockCache, focusedBlockIndex, selectedBlocks } = this.state;

    if (selectedBlocks.length === 0) return;

    const firstBlockRect = blockCache.get(selectedBlocks[0]) as DOMRect;

    // just refresh selected blocks
    if (focusedBlockIndex === -1) {
      const rects = clearSubtree(selectedBlocks, firstBlockRect.left).map(
        block => blockCache.get(block) as DOMRect
      );
      this._signals.updateSelectedRects.emit(rects);
    } else {
      // only current focused-block
      this._signals.updateSelectedRects.emit([firstBlockRect]);
    }
  }

  refreshEmbedRects(hoverEditingState: EmbedEditingState | null = null) {
    const { activeComponent, selectedEmbeds } = this.state;
    if (activeComponent && selectedEmbeds.length) {
      const image = activeComponent as ImageBlockComponent;
      if (image.model.type === 'image') {
        const rect = image.resizeImg.getBoundingClientRect();

        // updates editing
        if (hoverEditingState) {
          const { model, position } = hoverEditingState;
          if (model === image.model) {
            position.y = rect.y;
          }
        }

        this._signals.updateEmbedRects.emit([rect]);
      }
    }
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
      boundRect
    );

    // only current focused-block
    this.setSelectedBlocks(selectedBlocks, [boundRect]);
  }

  // Click on the prefix icon of list block
  resetSelectedBlockByRect(
    blockElement: BlockComponentElement,
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
      boundRect
    );

    // only current focused-block
    this.setSelectedBlocks(selectedBlocks, [boundRect]);
  }

  // `CMD-A`
  selectBlocksByRect(hitRect: DOMRect) {
    this.state.refreshBlockRectCache();
    const {
      blockCache,
      focusedBlockIndex,
      selectedBlocks: prevSelectedBlocks,
    } = this.state;
    const selectedBlocks = filterSelectedBlockByIndex(
      blockCache,
      focusedBlockIndex,
      hitRect
    );

    if (blockCache.size === prevSelectedBlocks.length) {
      return;
    }

    if (selectedBlocks.length === 0) {
      return;
    }

    // clear selection first
    this.clear();
    this.state.type = 'block';

    const firstBlockRect = blockCache.get(selectedBlocks[0]) as DOMRect;

    if (focusedBlockIndex === -1) {
      // SELECT_ALL
      const rects = clearSubtree(selectedBlocks, firstBlockRect.left).map(
        block => blockCache.get(block) as DOMRect
      );
      this.setSelectedBlocks(selectedBlocks, rects);
    } else {
      // only current focused-block
      this.setSelectedBlocks(selectedBlocks, [firstBlockRect]);
    }
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

  updateLocalSelection() {
    const page = this.page;
    const blockRange = getCurrentBlockRange(page);
    if (blockRange && blockRange.type === 'Native') {
      const userRange: UserRange = {
        startOffset: blockRange.startOffset,
        endOffset: blockRange.endOffset,
        startBlockId: blockRange.startModel.id,
        endBlockId: blockRange.endModel.id,
        betweenBlockIds: blockRange.betweenModels.map(m => m.id),
      };
      page.awarenessStore.setLocalRange(page, userRange);
    }
  }
}

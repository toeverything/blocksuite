import '../../../components/drag-handle.js';

import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';
import { BaseBlockModel, DisposableGroup } from '@blocksuite/store';

import {
  BlockComponentElement,
  getBlockElementByModel,
  getCurrentNativeRange,
  getDefaultPageBlock,
  handleNativeRangeClick,
  handleNativeRangeDblClick,
  handleNativeRangeDragMove,
  initMouseEventHandlers,
  isBlankArea,
  isDatabase,
  isDatabaseInput,
  isEmbed,
  isInsidePageTitle,
  SelectionEvent,
} from '../../../__internal__/index.js';
import { showFormatQuickBar } from '../../../components/format-quick-bar/index.js';
import type {
  EmbedBlockComponent,
  ImageBlockComponent,
} from '../../../embed-block/index.js';
import {
  calcCurrentSelectionPosition,
  getNativeSelectionMouseDragInfo,
  repairContextMenuRange,
} from '../../utils/position.js';
import type {
  DefaulSelectionSlots,
  DefaultPageBlockComponent,
  EmbedEditingState,
  ViewportState,
} from '../default-page-block.js';
import {
  getAllowSelectedBlocks,
  getBlockEditingStateByPosition,
} from '../utils.js';
import { EmbedResizeManager } from './embed-resize-manager.js';
import { PageSelectionState } from './selection-state.js';
import {
  clearSubtree,
  createDraggingArea,
  filterSelectedBlockByIndex,
  filterSelectedBlockByIndexAndBound,
  filterSelectedBlockWithoutSubtree,
  findBlocksWithSubtree,
  getBlockWithIndexByElement,
  setSelectedBlocks,
  updateLocalSelectionRange,
} from './utils.js';

/**
 * The selection manager used in default mode.
 */
export class DefaultSelectionManager {
  readonly page: Page;
  readonly state = new PageSelectionState('none');
  readonly slots: DefaulSelectionSlots;
  private readonly _mouseRoot: HTMLElement;
  private readonly _container: DefaultPageBlockComponent;
  private readonly _disposables = new DisposableGroup();
  private readonly _embedResizeManager: EmbedResizeManager;
  private readonly _threshold: number; // distance to the upper and lower boundaries of the viewport

  constructor({
    page,
    mouseRoot,
    slots,
    container,
    threshold,
  }: {
    page: Page;
    mouseRoot: HTMLElement;
    slots: DefaulSelectionSlots;
    container: DefaultPageBlockComponent;
    threshold: number;
  }) {
    this.page = page;
    this.slots = slots;
    this._mouseRoot = mouseRoot;
    this._container = container;
    this._threshold = threshold;

    this._embedResizeManager = new EmbedResizeManager(this.state, slots);
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
        // TODO merge these two functions
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

  private _onBlockSelectionDragStart(e: SelectionEvent) {
    // rich-text should be unfocused
    this.state.blur();
    this.state.type = 'block';
    this._container.updateViewportState();
    const { scrollLeft, scrollTop } = this._container.viewportState;
    this.state.resetStartPoint(e, {
      scrollTop,
      scrollLeft,
    });
    this.state.refreshBlockRectCache();
  }

  private _onBlockSelectionDragMove(e: SelectionEvent) {
    const { x, y } = e;

    const { defaultViewportElement: viewport, viewportState } = this._container;
    const { scrollHeight, clientHeight, scrollLeft } = viewportState;
    let { scrollTop } = viewportState;
    const max = scrollHeight - clientHeight;

    this.state.updateEndPoint({ x: x + scrollLeft, y: y + scrollTop });

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
        this.updateDraggingArea(startPoint, endPoint);
      } else if (scrollTop > 0 && y < this._threshold) {
        // ↑
        const d = (y - this._threshold) * 0.25;
        scrollTop += d;
        endPoint.y += d;
        auto = scrollTop > 0;
        viewport.scrollTop = scrollTop;
        this.updateDraggingArea(startPoint, endPoint);
      } else {
        auto = false;
        const draggingArea = this.updateDraggingArea(startPoint, endPoint);
        this._selectBlocksByDraggingArea(
          this.state.blockCache,
          draggingArea,
          viewportState
        );
      }
    };

    this.state.clearRaf();
    this.state.rafID = requestAnimationFrame(autoScroll);
  }

  private _onBlockSelectionDragEnd(_: SelectionEvent) {
    this.state.type = 'block';
    this.state.clearDraggingArea();
    this.slots.draggingAreaUpdated.emit(null);
    // do not clear selected rects here
  }

  private _onNativeSelectionDragStart(e: SelectionEvent) {
    this.state.resetStartRange(e);
    this.state.type = 'native';
    this.slots.nativeSelectionToggled.emit(false);
  }

  private _onNativeSelectionDragMove(e: SelectionEvent) {
    this.state.updateRangePoint(e.raw.clientX, e.raw.clientY);
    handleNativeRangeDragMove(this.state.startRange, e);
  }

  private _onNativeSelectionDragEnd(_: SelectionEvent) {
    this.slots.nativeSelectionToggled.emit(true);
  }

  private _onContainerDragStart = (e: SelectionEvent) => {
    this.state.resetStartRange(e);
    if (isInsidePageTitle(e.raw.target) || isDatabaseInput(e.raw.target)) {
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
      showFormatQuickBar({
        page: this.page,
        direction,
        anchorEl: {
          getBoundingClientRect: () => {
            return calcCurrentSelectionPosition(direction, this.state);
          },
        },
      });
    } else if (this.state.type === 'block') {
      if (
        !this.page.awarenessStore.getFlag('enable_block_selection_format_bar')
      ) {
        return;
      }
      if (!this.state.selectedBlocks.length) {
        return;
      }
      // TODO Check if there are valid blocks in the selection before showing the format bar
      // If all the selected blocks are images, the format bar should not be displayed.

      const direction = e.start.y < e.y ? 'center-bottom' : 'center-top';
      showFormatQuickBar({
        page: this.page,
        direction,
        anchorEl: {
          // After update block type, the block selection will be cleared and refreshed.
          // So we need to get the targe block's rect dynamic.
          getBoundingClientRect: () => {
            return calcCurrentSelectionPosition(direction, this.state);
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
      matchFlavours(clickBlockInfo.model, [
        'affine:embed',
        'affine:divider',
      ] as const)
    ) {
      window.getSelection()?.removeAllRanges();

      this.state.activeComponent = getBlockElementByModel(clickBlockInfo.model);

      assertExists(this.state.activeComponent);
      if (clickBlockInfo.model.type === 'image') {
        this.state.type = 'embed';
        this.state.selectedEmbeds.push(
          this.state.activeComponent as EmbedBlockComponent
        );
        this.slots.embedRectsUpdated.emit([clickBlockInfo.position]);
      } else {
        this.state.type = 'block';
        this.state.selectedBlocks.push(this.state.activeComponent);
        this.slots.selectedRectsUpdated.emit([clickBlockInfo.position]);
      }
      return;
    }
    const target = e.raw.target;
    if (isInsidePageTitle(target) || isDatabaseInput(target)) {
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
    const direction = 'center-bottom';

    // Show format quick bar when double click on text
    showFormatQuickBar({
      page: this.page,
      direction,
      anchorEl: {
        getBoundingClientRect: () => {
          return calcCurrentSelectionPosition(direction, this.state);
        },
      },
    });
  };

  private _onContainerContextMenu = (e: SelectionEvent) => {
    repairContextMenuRange(e);
  };

  private _onContainerMouseMove = (e: SelectionEvent) => {
    this.state.refreshBlockRectCache();
    const hoverEditingState = getBlockEditingStateByPosition(
      this._allowSelectedBlocks,
      e.raw.clientX,
      e.raw.clientY
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
      this.slots.embedEditingStateUpdated.emit(hoverEditingState);
    } else if (hoverEditingState?.model.flavour === 'affine:code') {
      hoverEditingState.position.x = hoverEditingState.position.right + 12;
      this.slots.codeBlockOptionUpdated.emit(hoverEditingState);
    } else {
      this.slots.embedEditingStateUpdated.emit(null);
      this.slots.codeBlockOptionUpdated.emit(null);
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

    // filter out selection change event from title
    if (
      isInsidePageTitle(selection.anchorNode) ||
      isInsidePageTitle(selection.focusNode)
    ) {
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
    let selectionDirection: 'left-right' | 'right-left' | 'none' = 'none';

    if (offsetDelta > 0) {
      selectionDirection = 'right-left';
    } else if (offsetDelta < 0) {
      selectionDirection = 'left-right';
    }
    const direction =
      selectionDirection === 'left-right' ? 'right-bottom' : 'left-top';
    // Show quick bar when user select text by keyboard(Shift + Arrow)
    showFormatQuickBar({
      page: this.page,
      direction,
      anchorEl: {
        getBoundingClientRect: () => {
          return calcCurrentSelectionPosition(direction, this.state);
        },
      },
    });
  };

  private _onSelectionChangeWithoutDebounce = (_: Event) => {
    updateLocalSelectionRange(this.page);
  };

  private _selectBlocksByDraggingArea(
    blockCache: Map<BlockComponentElement, DOMRect>,
    draggingArea: DOMRect,
    viewportState: ViewportState
  ) {
    const { scrollLeft, scrollTop, left, top } = viewportState;
    const selectedBlocksWithoutSubtrees = filterSelectedBlockWithoutSubtree(
      blockCache,
      draggingArea,
      // subtracting the left/top of the container is required.
      {
        y: scrollTop - top,
        x: scrollLeft - left,
      }
    );
    const rects = selectedBlocksWithoutSubtrees.map(
      ({ block }) => blockCache.get(block) as DOMRect
    );

    setSelectedBlocks(
      this.state,
      this.slots,
      findBlocksWithSubtree(blockCache, selectedBlocksWithoutSubtrees),
      rects
    );
  }

  // clear selection: `block`, `embed`, `native`
  clear() {
    const { state, slots } = this;
    const { type } = state;
    if (type === 'block') {
      state.clearBlockSelection();
      slots.selectedRectsUpdated.emit([]);
      slots.draggingAreaUpdated.emit(null);
    } else if (type === 'embed') {
      state.clearEmbedSelection();
      slots.embedRectsUpdated.emit([]);
      slots.embedEditingStateUpdated.emit(null);
    } else if (type === 'native') {
      state.clearNativeSelection();
    }
  }

  updateDraggingArea(
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number }
  ): DOMRect {
    if (this.state.focusedBlockIndex !== -1) {
      this.state.focusedBlockIndex = -1;
    }
    const draggingArea = createDraggingArea(endPoint, startPoint);
    this.slots.draggingAreaUpdated.emit(draggingArea);
    return draggingArea;
  }

  refresh() {
    const { type } = this.state;
    if (type === 'block') {
      this.refreshSelectedBlocksRects();
    } else if (type === 'embed') {
      this.refreshEmbedRects();
    }
  }

  refreshDragingArea(viewportState: ViewportState) {
    const { blockCache, startPoint, endPoint } = this.state;

    if (startPoint && endPoint) {
      this.state.refreshBlockRectCache();
      const draggingArea = createDraggingArea(endPoint, startPoint);
      this._selectBlocksByDraggingArea(blockCache, draggingArea, viewportState);
    } else {
      this.state.updateStartPoint(null);
      this.state.updateEndPoint(null);
      this.slots.draggingAreaUpdated.emit(null);
      this.refreshSelectedBlocksRects();
    }
  }

  refreshSelectedBlocksRects() {
    this.state.refreshBlockRectCache();

    const { blockCache, focusedBlockIndex, selectedBlocks } = this.state;

    if (selectedBlocks.length === 0) return;

    const firstBlock = selectedBlocks[0];

    // just refresh selected blocks
    if (focusedBlockIndex === -1) {
      const rects = clearSubtree(selectedBlocks, firstBlock).map(
        block => blockCache.get(block) as DOMRect
      );
      this.slots.selectedRectsUpdated.emit(rects);
    } else {
      // only current focused-block
      this.slots.selectedRectsUpdated.emit([
        blockCache.get(firstBlock) as DOMRect,
      ]);
    }
  }

  refreshSelectedBlocksRectsByModels(models: BaseBlockModel[]) {
    this.state.selectedBlocks = models
      .map(model => getBlockElementByModel(model))
      .filter((block): block is BlockComponentElement => block !== null);
    this.refreshSelectedBlocksRects();
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

        this.slots.embedRectsUpdated.emit([rect]);
      }
    }
  }

  // Called on clicking on drag-handle button
  selectBlocksByIndexAndBound(index: number, boundRect: DOMRect) {
    // rich-text should be unfocused
    this.state.blur();

    this.state.focusedBlockIndex = index;

    const { blockCache, focusedBlockIndex } = this.state;

    if (focusedBlockIndex === -1) {
      return;
    }

    this.state.type = 'block';
    this.state.refreshBlockRectCache();

    const selectedBlocks = filterSelectedBlockByIndex(
      blockCache,
      focusedBlockIndex
    );

    // only current focused-block
    setSelectedBlocks(this.state, this.slots, selectedBlocks, [boundRect]);
  }

  setSelectedBlocks(selectedBlocks: BlockComponentElement[]) {
    setSelectedBlocks(this.state, this.slots, selectedBlocks);
  }

  // Called on `CMD-A`
  selectBlocksByRect(hitRect: DOMRect) {
    this.state.refreshBlockRectCache();
    const {
      blockCache,
      focusedBlockIndex,
      selectedBlocks: prevSelectedBlocks,
    } = this.state;
    const selectedBlocks = filterSelectedBlockByIndexAndBound(
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

    const firstBlock = selectedBlocks[0];

    if (focusedBlockIndex === -1) {
      // SELECT_ALL
      const rects = clearSubtree(selectedBlocks, firstBlock).map(
        block => blockCache.get(block) as DOMRect
      );
      setSelectedBlocks(this.state, this.slots, selectedBlocks, rects);
    } else {
      const rects = [blockCache.get(firstBlock) as DOMRect];
      // only current focused-block
      setSelectedBlocks(this.state, this.slots, selectedBlocks, rects);
    }
  }

  setFocusedBlockIndexByElement(blockElement: Element) {
    const result = getBlockWithIndexByElement(this.state, blockElement);
    if (result) {
      this.state.focusedBlockIndex = result.index;
    } else {
      this.state.focusedBlockIndex = -1;
    }
  }

  dispose() {
    this.slots.selectedRectsUpdated.dispose();
    this.slots.draggingAreaUpdated.dispose();
    this.slots.embedEditingStateUpdated.dispose();
    this.slots.embedRectsUpdated.dispose();
    this.slots.codeBlockOptionUpdated.dispose();
    this.slots.nativeSelectionToggled.dispose();
    this._disposables.dispose();
  }
}

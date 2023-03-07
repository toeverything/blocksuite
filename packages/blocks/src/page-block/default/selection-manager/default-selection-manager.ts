import '../../../components/drag-handle.js';

import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';

import {
  type BlockComponentElement,
  getBlockElementByModel,
  getClosestBlockElementByPoint,
  getCurrentNativeRange,
  getDefaultPageBlock,
  getModelByBlockElement,
  handleNativeRangeClick,
  handleNativeRangeDblClick,
  initMouseEventHandlers,
  isBlankArea,
  isDatabase,
  isDatabaseInput,
  isEmbed,
  isInsidePageTitle,
  type Point,
  Rect,
  type SelectionEvent,
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
  DefaultPageBlockComponent,
  DefaultSelectionSlots,
  EmbedEditingState,
} from '../default-page-block.js';
import {
  type EditingState,
  getAllowSelectedBlocks,
  getBlockEditingStateByPosition,
} from '../utils.js';
import { BlockDragHandlers } from './block-drag-handlers.js';
import { EmbedResizeManager } from './embed-resize-manager.js';
import { NativeDragHandlers } from './native-drag-handlers.js';
import { PageSelectionState, type PageViewport } from './selection-state.js';
import {
  clearSubtree,
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
  readonly slots: DefaultSelectionSlots;
  private readonly _container: DefaultPageBlockComponent;
  private readonly _disposables = new DisposableGroup();
  private readonly _embedResizeManager: EmbedResizeManager;

  constructor({
    page,
    mouseRoot,
    slots,
    container,
  }: {
    page: Page;
    mouseRoot: HTMLElement;
    slots: DefaultSelectionSlots;
    container: DefaultPageBlockComponent;
  }) {
    this.page = page;
    this.slots = slots;
    this._container = container;

    this._embedResizeManager = new EmbedResizeManager(this.state, slots);
    this._disposables.add(
      initMouseEventHandlers(
        mouseRoot,
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
   * Non-content blocks like `affine:frame` and blocks inside `affine:database` will be discarded.
   */
  private get _selectableBlocks(): BaseBlockModel[] {
    return this.page.root ? getAllowSelectedBlocks(this.page.root) : [];
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
      BlockDragHandlers.onStart(this, e);
    } else {
      NativeDragHandlers.onStart(this, e);
    }
  };

  private _onContainerDragMove = (e: SelectionEvent) => {
    if (this.state.type === 'native') {
      NativeDragHandlers.onMove(this, e);
      return;
    }

    if (this.page.readonly) return;

    if (this.state.type === 'block') {
      BlockDragHandlers.onMove(this, e);
      return;
    }
    if (this.state.type === 'embed') {
      return this._embedResizeManager.onMove(e);
    }
  };

  private _onContainerDragEnd = (e: SelectionEvent) => {
    this._container.components.dragHandle?.setPointerEvents('auto');

    if (this.state.type === 'native') {
      NativeDragHandlers.onEnd(this, e);
    } else if (this.state.type === 'block') {
      BlockDragHandlers.onEnd(this, e);
    } else if (this.state.type === 'embed') {
      this._embedResizeManager.onEnd();
    }
    if (this.page.readonly) return;

    if (this.state.type === 'native') {
      const { direction, selectedType } = getNativeSelectionMouseDragInfo(e);
      // If nothing is selected, we should not show the format bar
      if (selectedType === 'Caret') return;
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
    const { viewport } = this.state;

    if (e.raw.pageX >= viewport.clientWidth + viewport.left) return;

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
      this._selectableBlocks,
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
    if (isInsidePageTitle(target) || isDatabaseInput(target)) return;
    if (e.keys.shift) return;
    handleNativeRangeClick(this.page, e);
  };

  private _onContainerDblClick = (e: SelectionEvent) => {
    // clear selection first
    this.clear();

    const range = handleNativeRangeDblClick(this.page, e);
    const direction = 'center-bottom';
    if (e.raw.target instanceof HTMLTextAreaElement) return;
    if (!range || range.collapsed) return;
    if (this.page.readonly) return;

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

    let hoverEditingState: EditingState | null = null;

    const blockElement = getClosestBlockElementByPoint(
      new Point(e.raw.clientX, e.raw.clientY),
      this._container.getInnerRect()
    );

    if (blockElement) {
      hoverEditingState = {
        model: getModelByBlockElement(blockElement),
        position: blockElement.getBoundingClientRect(),
        element: blockElement as BlockComponentElement,
        index: 0,
      };
    }

    if ((e.raw.target as HTMLElement).closest('.embed-editing-state')) return;

    this._container.components.dragHandle?.onContainerMouseMove(
      e,
      hoverEditingState
    );

    if (hoverEditingState?.model.type === 'image') {
      const { position } = hoverEditingState;
      // when image size is too large, the option popup should show inside
      if (position.width > 680) {
        hoverEditingState.position.x = hoverEditingState.position.right - 50;
      } else {
        hoverEditingState.position.x = hoverEditingState.position.right + 10;
      }
      this.slots.embedEditingStateUpdated.emit(hoverEditingState);
    } else {
      this.slots.embedEditingStateUpdated.emit(null);
    }
  };

  // TODO: Keep selecting blocks?
  private _onContainerMouseOut = (_: SelectionEvent) => {
    // console.log('mouseout', e);
  };

  private _onSelectionChangeWithDebounce = (_: Event) => {
    const selection = window.getSelection();
    if (!selection) return;

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
    if (range.collapsed) return;
    if (this.page.readonly) return;

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

  get viewportElement() {
    return this._container.viewportElement;
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

  updateDraggingArea(draggingArea: { start: Point; end: Point }): DOMRect {
    if (this.state.focusedBlockIndex !== -1) {
      this.state.focusedBlockIndex = -1;
    }
    const rect = Rect.fromPoints(
      draggingArea.start,
      draggingArea.end
    ).toDOMRect();
    this.slots.draggingAreaUpdated.emit(rect);
    return rect;
  }

  updateViewport() {
    const { viewportElement } = this._container;
    const { clientHeight, clientWidth, scrollHeight, scrollLeft, scrollTop } =
      viewportElement;
    const { top, left } = viewportElement.getBoundingClientRect();
    this.state.viewport = {
      top,
      left,
      clientHeight,
      clientWidth,
      scrollHeight,
      scrollLeft,
      scrollTop,
    };
  }

  updateRects() {
    const { type } = this.state;
    if (type === 'block') {
      this.refreshSelectedBlocksRects();
    } else if (type === 'embed') {
      this.refreshEmbedRects();
    }
  }

  refreshDraggingArea(viewport: PageViewport) {
    const { blockCache, draggingArea } = this.state;
    if (draggingArea) {
      this.selectBlocksByDraggingArea(
        blockCache,
        Rect.fromPoints(draggingArea.start, draggingArea.end).toDOMRect(),
        viewport,
        true
      );
    } else {
      this.state.draggingArea = null;
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

  selectBlocksByDraggingArea(
    blockCache: Map<BlockComponentElement, DOMRect>,
    draggingArea: DOMRect,
    viewport: PageViewport,
    isScrolling = false
  ) {
    if (isScrolling) {
      this.state.refreshBlockRectCache();
    }
    const { scrollLeft, scrollTop, left, top } = viewport;
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

  setSelectedBlocks(selectedBlocks: BlockComponentElement[]) {
    setSelectedBlocks(this.state, this.slots, selectedBlocks);
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
    this.slots.nativeSelectionToggled.dispose();
    this._disposables.dispose();
  }
}

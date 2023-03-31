import '../../../components/drag-handle.js';

import {
  type BlockComponentElement,
  type EditingState,
  getBlockElementByModel,
  getBlockElementsByElement,
  getBlockElementsExcludeSubtrees,
  getBlockElementsIncludeSubtrees,
  getClosestBlockElementByPoint,
  getCurrentNativeRange,
  getDefaultPageBlock,
  getModelByBlockElement,
  getRectByBlockElement,
  getSelectedStateRectByBlockElement,
  handleNativeRangeClick,
  handleNativeRangeDblClick,
  initMouseEventHandlers,
  isBlankArea,
  isDatabase,
  isDatabaseInput,
  isEmbed,
  isImage,
  isInsidePageTitle,
  Point,
  Rect,
  type SelectionEvent,
} from '@blocksuite/blocks/std';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import {
  type BaseBlockModel,
  DisposableGroup,
  type Page,
} from '@blocksuite/store';

import { showFormatQuickBar } from '../../../components/format-quick-bar/index.js';
import type { EmbedBlockComponent } from '../../../embed-block/index.js';
import {
  calcCurrentSelectionPosition,
  getNativeSelectionMouseDragInfo,
  repairContextMenuRange,
} from '../../utils/position.js';
import type {
  DefaultPageBlockComponent,
  DefaultSelectionSlots,
} from '../default-page-block.js';
import { BlockDragHandlers } from './block-drag-handlers.js';
import { EmbedResizeManager } from './embed-resize-manager.js';
import { NativeDragHandlers } from './native-drag-handlers.js';
import { PageSelectionState, type PageViewport } from './selection-state.js';
import {
  filterBlocksExcludeSubtrees,
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
        container: this._container,
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
        container: this._container,
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

    let clickBlockInfo = null;

    const element = getClosestBlockElementByPoint(
      new Point(e.raw.clientX, e.raw.clientY),
      {
        rect: this._container.innerRect,
      }
    );

    if (element) {
      clickBlockInfo = {
        model: getModelByBlockElement(element),
        rect: getSelectedStateRectByBlockElement(element),
        element: element as BlockComponentElement,
      };
    }

    if (clickBlockInfo && clickBlockInfo.model) {
      const { model, element } = clickBlockInfo;
      const page = getDefaultPageBlock(model);
      page.lastSelectionPosition = 'start';
      this.state.focusedBlock = element;
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
        this.slots.embedRectsUpdated.emit([clickBlockInfo.rect]);
      } else {
        this.state.type = 'block';
        this.state.selectedBlocks.push(this.state.activeComponent);
        this.slots.selectedRectsUpdated.emit([clickBlockInfo.rect]);
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

    if (this.page.readonly) return;

    const range = handleNativeRangeDblClick(this.page, e);
    const direction = 'center-bottom';
    if (e.raw.target instanceof HTMLTextAreaElement) return;
    if (!range || range.collapsed) return;

    // Show format quick bar when double click on text
    showFormatQuickBar({
      page: this.page,
      container: this._container,
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
    if ((e.raw.target as HTMLElement).closest('.embed-editing-state')) return;

    const point = new Point(e.raw.clientX, e.raw.clientY);
    let hoverEditingState = null;

    const element = getClosestBlockElementByPoint(point.clone(), {
      rect: this._container.innerRect,
    });

    // dont show option menu of image on selecting
    if (!e.dragging && element) {
      hoverEditingState = {
        element: element as BlockComponentElement,
        model: getModelByBlockElement(element),
        rect: getSelectedStateRectByBlockElement(element),
      };
    }

    this._container.components.dragHandle?.onContainerMouseMove(
      e,
      hoverEditingState
    );

    if (hoverEditingState) {
      const { model, rect } = hoverEditingState;

      if (model.type === 'image') {
        const tempRect = Rect.fromDOMRect(rect);
        const isLarge = rect.width > 680;
        tempRect.right += isLarge ? 0 : 60;

        if (tempRect.isPointIn(point)) {
          // when image size is too large, the option popup should show inside
          rect.x = rect.right + (isLarge ? -50 : 10);
        } else {
          hoverEditingState = null;
        }
      } else {
        hoverEditingState = null;
      }
    }

    this.slots.embedEditingStateUpdated.emit(hoverEditingState);
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
      container: this._container,
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
    if (this.state.focusedBlock !== null) {
      this.state.focusedBlock = null;
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
    const { focusedBlock, selectedBlocks } = this.state;

    if (selectedBlocks.length === 0) return;

    // just refresh selected blocks
    if (focusedBlock === null) {
      const rects = getBlockElementsExcludeSubtrees(selectedBlocks).map(
        getRectByBlockElement
      );
      this.slots.selectedRectsUpdated.emit(rects);
    } else {
      // only current focused block element
      this.slots.selectedRectsUpdated.emit([
        getRectByBlockElement(focusedBlock),
      ]);
    }
  }

  refreshSelectedBlocksRectsByModels(models: BaseBlockModel[]) {
    this.state.selectedBlocks = models
      .map(model => getBlockElementByModel(model))
      .filter((block): block is BlockComponentElement => block !== null);
    this.refreshSelectedBlocksRects();
  }

  refreshEmbedRects(hoverEditingState: EditingState | null = null) {
    const { activeComponent, selectedEmbeds } = this.state;
    if (activeComponent && selectedEmbeds.length) {
      const rect = getSelectedStateRectByBlockElement(activeComponent);
      const embedRects = [
        new DOMRect(rect.left, rect.top, rect.width, rect.height),
      ];

      // updates editing
      if (hoverEditingState && isImage(activeComponent)) {
        // when image size is too large, the option popup should show inside
        rect.x = rect.right + (rect.width > 680 ? -50 : 10);
        hoverEditingState.rect = rect;
      }

      this.slots.embedRectsUpdated.emit(embedRects);
    }
  }

  refreshRemoteSelection() {
    const element = document.querySelector('remote-selection');
    if (element) {
      element.requestUpdate();
    }
  }

  selectOneBlock(element: Element | null, rect?: DOMRect) {
    // clear selection first
    this.clear();
    // rich-text should be unfocused
    this.state.blur();
    this.state.type = 'block';
    this.state.focusedBlock = element as BlockComponentElement;

    if (!element) return;

    if (!rect) {
      rect = getRectByBlockElement(this.state.focusedBlock);
    }

    // find subtrees of focused block ement
    const selectedBlocks = getBlockElementsIncludeSubtrees([element]);

    // only current focused block element
    setSelectedBlocks(
      this.state,
      this.slots,
      selectedBlocks as BlockComponentElement[],
      [rect]
    );
  }

  selectAllBlocks() {
    // clear selection first
    this.clear();
    this.state.type = 'block';
    this.state.focusedBlock = null;

    const selectedBlocks = getBlockElementsByElement(this._container);

    // clear subtrees
    const rects = getBlockElementsExcludeSubtrees(selectedBlocks).map(
      getRectByBlockElement
    );

    setSelectedBlocks(
      this.state,
      this.slots,
      selectedBlocks as BlockComponentElement[],
      rects
    );
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
    const blocks = filterBlocksExcludeSubtrees(
      blockCache,
      draggingArea,
      // subtracting the left/top of the container is required.
      {
        y: scrollTop - top,
        x: scrollLeft - left,
      }
    );
    const [selectedBlocks, rects] = blocks.reduce<[Element[], DOMRect[]]>(
      (data, { block }) => {
        data[0].push(...getBlockElementsIncludeSubtrees([block as Element]));
        data[1].push(getRectByBlockElement(block as Element));
        return data;
      },
      [[], []]
    );

    setSelectedBlocks(
      this.state,
      this.slots,
      selectedBlocks as BlockComponentElement[],
      rects
    );
  }

  setSelectedBlocks(selectedBlocks: BlockComponentElement[]) {
    setSelectedBlocks(this.state, this.slots, selectedBlocks);
  }

  setFocusedBlock(blockElement: Element) {
    this.state.focusedBlock = blockElement as BlockComponentElement;
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

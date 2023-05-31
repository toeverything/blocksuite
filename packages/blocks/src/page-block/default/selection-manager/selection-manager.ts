import '../../../components/drag-handle.js';

import { PAGE_BLOCK_CHILD_PADDING } from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type {
  EventName,
  UIEventDispatcher,
  UIEventHandler,
  UIEventStateContext,
} from '@blocksuite/lit';
import { type BaseBlockModel, type Page } from '@blocksuite/store';

import {
  AbstractSelectionManager,
  type BlockComponentElement,
  debounce,
  type EditingState,
  type EmbedBlockDoubleClickData,
  getBlockElementByModel,
  getBlockElementsByElement,
  getBlockElementsExcludeSubtrees,
  getBlockElementsIncludeSubtrees,
  getClosestBlockElementByPoint,
  getCurrentNativeRange,
  getEditorContainerByElement,
  getModelByBlockElement,
  getRectByBlockElement,
  getSelectedStateRectByBlockElement,
  handleNativeRangeClick,
  handleNativeRangeDragMove,
  type IPoint,
  isBlankArea,
  isDatabaseInput,
  isDragHandle,
  isElement,
  isEmbed,
  isImage,
  isInsidePageTitle,
  isInTitleBlock,
  isSelectedBlocks,
  Point,
  Rect,
} from '../../../__internal__/index.js';
import { activeEditorManager } from '../../../__internal__/utils/active-editor-manager.js';
import { showFormatQuickBar } from '../../../components/format-quick-bar/index.js';
import type {
  EmbedBlockComponent,
  EmbedBlockModel,
} from '../../../embed-block/index.js';
import { showFormatQuickBarByClicks } from '../../index.js';
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
import { PreviewDragHandlers } from './preview-drag-handlers.js';
import { PageSelectionState } from './selection-state.js';
import {
  filterBlocksExcludeSubtrees,
  setSelectedBlocks,
  updateLocalSelectionRange,
} from './utils.js';

function shouldFilterMouseEvent(event: Event): boolean {
  const target = event.target;
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }
  if (target.tagName === 'INPUT') {
    return true;
  }
  if (target.tagName === 'FORMAT-QUICK-BAR') {
    return true;
  }
  return false;
}

/**
 * The selection manager used in default mode.
 */
export class DefaultSelectionManager extends AbstractSelectionManager<DefaultPageBlockComponent> {
  readonly state = new PageSelectionState('none');
  readonly slots: DefaultSelectionSlots;
  private readonly _embedResizeManager: EmbedResizeManager;

  constructor({
    container,
    dispatcher,
    page,
    mouseRoot,
    slots,
  }: {
    container: DefaultPageBlockComponent;
    dispatcher: UIEventDispatcher;
    page: Page;
    mouseRoot: HTMLElement;
    slots: DefaultSelectionSlots;
  }) {
    super(container, dispatcher);

    this.slots = slots;

    this._embedResizeManager = new EmbedResizeManager(this.state, slots);

    let isDragging = false;
    this._add('dragStart', ctx => {
      const event = ctx.get('pointerState');
      if (shouldFilterMouseEvent(event.raw)) return;
      if (
        !isInsidePageTitle(event.raw.target) &&
        !isDatabaseInput(event.raw.target)
      ) {
        event.raw.preventDefault();
      }
      isDragging = true;
      this._onContainerDragStart(ctx);
    });
    this._add('dragMove', ctx => {
      const event = ctx.get('pointerState');
      if (shouldFilterMouseEvent(event.raw)) return;
      if (
        !isInsidePageTitle(event.raw.target) &&
        !isDatabaseInput(event.raw.target)
      ) {
        event.raw.preventDefault();
      }
      this._onContainerDragMove(ctx);
    });
    this._dispatcher.add('dragEnd', ctx => {
      const event = ctx.get('pointerState');
      if (
        !isInsidePageTitle(event.raw.target) &&
        !isDatabaseInput(event.raw.target)
      ) {
        event.raw.preventDefault();
      }
      isDragging = false;
      this._onContainerDragEnd(ctx);
    });
    this._add('click', ctx => {
      const event = ctx.get('pointerState');
      if (
        !isInsidePageTitle(event.raw.target) &&
        !isDatabaseInput(event.raw.target)
      ) {
        event.raw.preventDefault();
      }
      this._onContainerClick(ctx);
    });
    this._add('doubleClick', ctx => {
      const event = ctx.get('pointerState');
      if (shouldFilterMouseEvent(event.raw)) return;
      this._onContainerDblClick(ctx);
    });
    this._add('tripleClick', ctx => {
      const event = ctx.get('pointerState');
      if (shouldFilterMouseEvent(event.raw)) return;
      this._onContainerTripleClick(ctx);
    });
    this._add('pointerDown', this._onContainerPointerDown);
    this._add('pointerMove', ctx => {
      const event = ctx.get('pointerState');
      if (shouldFilterMouseEvent(event.raw)) return;
      if (
        !isInsidePageTitle(event.raw.target) &&
        !isDatabaseInput(event.raw.target)
      ) {
        event.raw.preventDefault();
      }
      if (this.page.hasFrameBlock()) {
        this._onContainerPointerMove(ctx);
      }
    });
    this._add('contextMenu', this._onContainerContextMenu);
    this._add('virgo-vrange-updated', () => {
      this._onSelectionChangeWithoutDebounce();
    });
    this._add(
      'virgo-vrange-updated',
      debounce((ctx: UIEventStateContext) => {
        const { event } = ctx.get('defaultState');

        if (shouldFilterMouseEvent(event)) return;
        if (isDragging) {
          return;
        }

        this._onSelectionChangeWithDebounce();
      }, 300)
    );
  }

  private _checkHasAnyFrameBlock() {
    if (!this.page.hasFrameBlock()) {
      const id = this.page.addBlock('affine:frame', {}, this.page.root);
      this.page.addBlock('affine:paragraph', {}, id);
      return true;
    }
    return false;
  }

  private _add = (name: EventName, fn: UIEventHandler) => {
    this._disposables.add(this._dispatcher.add(name, fn));
  };

  private _onContainerDragStart = (ctx: UIEventStateContext) => {
    const e = ctx.get('pointerState');
    const target = e.raw.target;
    if (isInsidePageTitle(target) || isDatabaseInput(target)) {
      this.state.type = 'none';
      return;
    }

    if (
      isElement(target) &&
      (isDragHandle(target as Element) || isSelectedBlocks(target as Element))
    ) {
      PreviewDragHandlers.onStart(this, e);
      return;
    }

    if (isEmbed(e)) {
      this.state.type = 'embed';
      this._embedResizeManager.onStart(e);
      return;
    }

    // disable dragHandle button
    this.container.components.dragHandle?.setPointerEvents('none');

    // clear selection first
    this.clear();

    if (isBlankArea(e)) {
      BlockDragHandlers.onStart(this, e);
    } else {
      NativeDragHandlers.onStart(this, e);
    }
  };

  private _onContainerDragMove = (ctx: UIEventStateContext) => {
    const e = ctx.get('pointerState');
    if (this.state.type === 'native') {
      NativeDragHandlers.onMove(this, e);
      return;
    }

    if (this.page.readonly) return;

    if (this.state.type === 'block:drag') {
      PreviewDragHandlers.onMove(this, e);
      return;
    }

    if (this.state.type === 'block') {
      BlockDragHandlers.onMove(this, e);
      return;
    }

    if (this.state.type === 'embed') {
      return this._embedResizeManager.onMove(e);
    }
  };

  private _onContainerDragEnd = (ctx: UIEventStateContext) => {
    const e = ctx.get('pointerState');
    this.container.components.dragHandle?.setPointerEvents('auto');

    if (this.state.type === 'block:drag') {
      PreviewDragHandlers.onEnd(this, e);
      return;
    }
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
        container: this.container,
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

      const direction = e.start.y < e.point.y ? 'center-bottom' : 'center-top';
      showFormatQuickBar({
        page: this.page,
        container: this.container,
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

  private _onContainerPointerDown = (ctx: UIEventStateContext) => {
    const e = ctx.get('pointerState');
    if (e.keys.shift) {
      // dont trigger native selection behavior
      e.raw.preventDefault();
    }
  };

  private _onContainerClick = (ctx: UIEventStateContext) => {
    const e = ctx.get('pointerState');
    const {
      point: { x, y },
      raw: { target, clientX, clientY, pageX },
      keys: { shift },
    } = e;

    if (
      this._checkHasAnyFrameBlock() &&
      target &&
      isInTitleBlock(target as Element)
    ) {
      requestAnimationFrame(() => {
        handleNativeRangeClick(this.page, e, this.container);
      });
    }

    const container = getEditorContainerByElement(this.container);
    activeEditorManager.setActive(container);

    const { state } = this;
    const { viewport } = state;
    let { type } = state;

    // do nothing when clicking on scrollbar
    if (pageX >= viewport.clientWidth + viewport.left) return;

    // do nothing when clicking on drag-handle
    if (isElement(target) && isDragHandle(target as Element)) {
      return;
    }

    // shift + click
    // * native: select texts
    // * block: select blocks
    if (shift) {
      if (type === 'none') {
        type = state.type = 'native';
      }
      if (type === 'native') {
        state.lastPoint = new Point(clientX, clientY);
        handleNativeRangeDragMove(state.startRange, e);
      } else if (type === 'block') {
        this.selectedBlocksWithShiftClick(x, y);
      }
      return;
    }

    // clear selection first
    this.clear();

    state.resetStartRange(e);

    // mouseRoot click will blur all captions
    const allCaptions = Array.from(
      document.querySelectorAll('.affine-embed-wrapper-caption')
    );
    allCaptions.forEach(el => {
      if (el !== target) {
        (el as HTMLInputElement).blur();
      }
    });

    let clickBlockInfo = null;

    const element = getClosestBlockElementByPoint(new Point(clientX, clientY), {
      rect: this.container.innerRect,
    });

    if (element) {
      clickBlockInfo = {
        model: getModelByBlockElement(element),
        rect: getSelectedStateRectByBlockElement(element),
        element: element as BlockComponentElement,
      };
    }

    if (clickBlockInfo && clickBlockInfo.model) {
      const { element } = clickBlockInfo;
      this.container.lastSelectionPosition = 'start';
      state.focusedBlock = element;
    }

    if (
      clickBlockInfo &&
      matchFlavours(clickBlockInfo.model, ['affine:embed', 'affine:divider'])
    ) {
      window.getSelection()?.removeAllRanges();

      state.activeComponent = clickBlockInfo.element;

      assertExists(this.state.activeComponent);
      if (clickBlockInfo.model.type === 'image') {
        state.type = 'embed';
        state.selectedEmbeds.push(state.activeComponent as EmbedBlockComponent);
        this.slots.embedRectsUpdated.emit([clickBlockInfo.rect]);
      } else {
        state.type = 'block';
        state.selectedBlocks.push(state.activeComponent);
        this.slots.selectedRectsUpdated.emit([clickBlockInfo.rect]);
      }
      return;
    }
    if (
      isInsidePageTitle(target) ||
      isDatabaseInput(target) ||
      // TODO It's a workaround, we need remove the ad-hoc code
      // Fix https://github.com/toeverything/blocksuite/issues/2459
      target instanceof HTMLInputElement
    )
      return;

    handleNativeRangeClick(this.page, e, this.container);
  };

  private _onContainerDblClick = (ctx: UIEventStateContext) => {
    const e = ctx.get('pointerState');
    // clear selection first
    this.clear();

    // switch native selection
    NativeDragHandlers.onStart(this, e);

    // The following code is for the fullscreen image modal
    // fixme:
    //  remove dispatch a custom event
    //  once we have a better way to handle this
    //  like plugin system.
    {
      const {
        raw: { clientX, clientY },
      } = e;

      const element = getClosestBlockElementByPoint(
        new Point(clientX, clientY),
        {
          rect: this.container.innerRect,
        }
      );

      if (element) {
        const targetModel = getModelByBlockElement(element) as EmbedBlockModel;
        if (targetModel.flavour === 'affine:embed') {
          window.dispatchEvent(
            new CustomEvent<EmbedBlockDoubleClickData>(
              'affine.embed-block-db-click',
              {
                detail: {
                  blockId: targetModel.id,
                },
              }
            )
          );
        }
      }
    }

    showFormatQuickBarByClicks(
      'double',
      e,
      this.page,
      this.container,
      this.state
    );
  };

  private _onContainerTripleClick = (ctx: UIEventStateContext) => {
    const e = ctx.get('pointerState');
    showFormatQuickBarByClicks(
      'triple',
      e,
      this.page,
      this.container,
      this.state
    );
  };

  private _onContainerContextMenu = (ctx: UIEventStateContext) => {
    const e = ctx.get('defaultState');
    repairContextMenuRange(e.event as MouseEvent);
  };

  private _onContainerPointerMove = (ctx: UIEventStateContext) => {
    const e = ctx.get('pointerState');
    const { dragging, raw } = e;

    // dont show option menu of image on block/native selection
    if (dragging || (raw.target as HTMLElement).closest('.embed-editing-state'))
      return;

    const point = new Point(raw.clientX, raw.clientY);
    let hoverEditingState = null;

    const { innerRect } = this.container;
    const element = getClosestBlockElementByPoint(point.clone(), {
      rect: innerRect,
    });

    if (element) {
      const { left, top, width, height } = getRectByBlockElement(element);
      hoverEditingState = {
        element: element as BlockComponentElement,
        model: getModelByBlockElement(element),
        rect: new DOMRect(
          Math.max(left, innerRect.left + PAGE_BLOCK_CHILD_PADDING),
          top,
          width,
          height
        ),
      };
    }

    this.container.components.dragHandle?.onContainerMouseMove(
      e,
      hoverEditingState
    );

    if (hoverEditingState) {
      const { model, element } = hoverEditingState;
      let shouldClear = true;

      if (model.type === 'image') {
        const {
          state: {
            viewport: { left, clientWidth },
          },
        } = this;
        const rect = getSelectedStateRectByBlockElement(element);
        const tempRect = Rect.fromDOMRect(rect);
        const isOutside = rect.right + 60 < left + clientWidth;
        tempRect.right += isOutside ? 60 : 0;

        if (tempRect.isPointIn(point)) {
          // when image size is too large, the option popup should show inside
          rect.x = rect.right + (isOutside ? 10 : -50);
          hoverEditingState.rect = rect;
          shouldClear = false;
        }
      }

      if (shouldClear) {
        hoverEditingState = null;
      }
    }

    this.slots.embedEditingStateUpdated.emit(hoverEditingState);
  };

  private _onSelectionChangeWithDebounce = () => {
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
    if (!selection.containsNode(this.container, true)) {
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
      container: this.container,
      direction,
      anchorEl: {
        getBoundingClientRect: () => {
          return calcCurrentSelectionPosition(direction, this.state);
        },
      },
    });
  };

  private _onSelectionChangeWithoutDebounce = () => {
    updateLocalSelectionRange(this.page);
  };

  get viewportElement() {
    return this.container.viewportElement;
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
    const { viewportElement } = this.container;
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

  refreshDraggingArea(viewportOffset: IPoint) {
    const { blockCache, draggingArea } = this.state;
    if (draggingArea) {
      this.selectBlocksByDraggingArea(
        blockCache,
        Rect.fromPoints(draggingArea.start, draggingArea.end).toDOMRect(),
        viewportOffset,
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
      .map(getBlockElementByModel)
      .filter((block): block is BlockComponentElement => block !== null);
    this.refreshSelectedBlocksRects();
  }

  refreshEmbedRects(hoverEditingState: EditingState | null = null) {
    const { activeComponent, selectedEmbeds, viewport } = this.state;
    if (activeComponent && selectedEmbeds.length) {
      const rect = getSelectedStateRectByBlockElement(activeComponent);
      const embedRects = [
        new DOMRect(rect.left, rect.top, rect.width, rect.height),
      ];

      // updates editing
      if (hoverEditingState && isImage(activeComponent)) {
        const isOutside =
          rect.right + 60 < viewport.left + viewport.clientWidth;

        // when image size is too large, the option popup should show inside
        rect.x = rect.right + (isOutside ? 10 : -50);
        hoverEditingState.rect = rect;
      }

      this.slots.embedRectsUpdated.emit(embedRects);
    }
  }

  refreshRemoteSelection() {
    const element = this.container.querySelector('remote-selection');
    if (element) {
      element.requestUpdate();
    }
  }

  selectOneBlock(element?: Element | null, rect?: DOMRect) {
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

    // find subtrees of focused block element
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

    const selectedBlocks = getBlockElementsByElement(this.container);

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
    viewportOffset: IPoint,
    isScrolling = false
  ) {
    if (isScrolling) {
      this.state.refreshBlockRectCache();
    }

    const blocks = filterBlocksExcludeSubtrees(
      blockCache,
      draggingArea,
      // subtracting the left/top of the container is required.
      viewportOffset
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

  selectedBlocksWithShiftClick(x: number, y: number) {
    const { state } = this;
    const {
      viewport: { scrollLeft, scrollTop },
      viewportOffset,
      selectedBlocks,
    } = state;
    const lastIndex = selectedBlocks.length - 1;

    if (lastIndex === -1) return;

    const hasOneBlock = lastIndex === 0;
    const first = selectedBlocks[0];
    const last = hasOneBlock ? first : selectedBlocks[lastIndex];
    const firstRect = getRectByBlockElement(first);
    const lastRect = hasOneBlock ? firstRect : getRectByBlockElement(last);
    const rect = Rect.fromPoints(
      new Point(
        firstRect.left + viewportOffset.x,
        firstRect.top + viewportOffset.y
      ),
      new Point(
        lastRect.right + viewportOffset.x,
        lastRect.bottom + viewportOffset.y
      )
    );
    const point = new Point(x + scrollLeft, y + scrollTop);

    let start;
    let end;
    let pos = true;

    if (hasOneBlock) {
      if (rect.isPointIn(point)) {
        return;
      }

      if (point.y < rect.top) {
        start = point;
        end = rect.max;
        pos = false;
      } else {
        start = rect.min;
        end = point;
      }
    } else {
      if (rect.isPointIn(point)) {
        if (point.y >= rect.top + rect.height / 2) {
          start = point;
          end = rect.max;
          pos = false;
        } else {
          start = rect.min;
          end = point;
        }
      } else if (point.y < rect.top) {
        start = point;
        end = rect.max;
        pos = false;
      } else {
        start = rect.min;
        end = point;
      }
    }

    if (start && end) {
      this.selectBlocksByDraggingArea(
        state.blockCache,
        Rect.fromPoints(start, end).toDOMRect(),
        viewportOffset,
        true
      );
    }

    const direction = pos ? 'center-bottom' : 'center-top';
    showFormatQuickBar({
      page: this.page,
      container: this.container,
      direction,
      anchorEl: {
        // After update block type, the block selection will be cleared and refreshed.
        // So we need to get the targe block's rect dynamic.
        getBoundingClientRect: () => {
          return calcCurrentSelectionPosition(direction, state);
        },
      },
    });
  }

  setSelectedBlocks(
    selectedBlocks: BlockComponentElement[],
    rects?: DOMRect[]
  ) {
    setSelectedBlocks(this.state, this.slots, selectedBlocks, rects);
  }

  setFocusedBlock(blockElement: Element) {
    this.state.focusedBlock = blockElement as BlockComponentElement;
  }

  // clear selection: `block`, `block:drag`, `embed`, `native`
  clear() {
    const { state, slots } = this;
    let { type } = state;

    if (type === 'block:drag') {
      // clear `drag preview`
      PreviewDragHandlers.clear(this);
      type = 'block';
    }

    if (type === 'block') {
      state.clearBlockSelection();
      slots.selectedRectsUpdated.emit([]);
      slots.draggingAreaUpdated.emit(null);

      // `ESC`
      // clear `format quick bar`
      this.container.querySelector('format-quick-bar')?.remove();
    } else if (type === 'embed') {
      state.clearEmbedSelection();
      slots.embedRectsUpdated.emit([]);
      slots.embedEditingStateUpdated.emit(null);
    } else if (type === 'native') {
      state.clearNativeSelection();
    }
  }

  dispose() {
    this.slots.selectedRectsUpdated.dispose();
    this.slots.draggingAreaUpdated.dispose();
    this.slots.embedEditingStateUpdated.dispose();
    this.slots.embedRectsUpdated.dispose();
    this._disposables.dispose();
  }
}

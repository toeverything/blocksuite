import '../../../components/drag-handle.js';

import type { UIEventDispatcher } from '@blocksuite/block-std';
import type { FocusContext } from '@blocksuite/lit';
import { type BaseBlockModel } from '@blocksuite/store';

import {
  AbstractSelectionManager,
  type BlockComponentElement,
  getBlockElementByModel,
  getBlockElementsByElement,
  getBlockElementsExcludeSubtrees,
  getBlockElementsIncludeSubtrees,
  getRectByBlockElement,
  type IPoint,
  Point,
  Rect,
} from '../../../__internal__/index.js';
import { showFormatQuickBar } from '../../../components/format-quick-bar/index.js';
import { calcCurrentSelectionPosition } from '../../utils/position.js';
import type {
  DefaultPageBlockComponent,
  DefaultSelectionSlots,
} from '../default-page-block.js';
import { PreviewDragHandlers } from './preview-drag-handlers.js';
import { PageSelectionState } from './selection-state.js';
import { filterBlocksExcludeSubtrees, setSelectedBlocks } from './utils.js';

/**
 * The selection manager used in default mode.
 */
export class DefaultSelectionManager extends AbstractSelectionManager<DefaultPageBlockComponent> {
  readonly state = new PageSelectionState('none');
  readonly slots: DefaultSelectionSlots;

  constructor({
    container,
    dispatcher,
    slots,
  }: {
    container: DefaultPageBlockComponent;
    dispatcher: UIEventDispatcher;
    slots: DefaultSelectionSlots;
  }) {
    super(container, dispatcher);

    this.slots = slots;
  }

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

  blurFocusedBlock(ctx: FocusContext, blockElement = this.state.focusedBlock) {
    if (!blockElement) return;
    const blurState = blockElement.blurBlock(ctx);
    if (blurState === false) return;
    this.state.activeComponent = null;
    this.state.focusedBlock = null;
  }

  setFocusedBlock(
    blockElement: BlockComponentElement,
    ctx: FocusContext,
    blurPrev = true
  ) {
    const focusedBlock = this.state.focusedBlock;
    if (blurPrev && focusedBlock && blockElement !== focusedBlock) {
      this.blurFocusedBlock(ctx, focusedBlock);
    }

    const focusState = blockElement.focusBlock(ctx);
    if (focusState === false) return;

    this.state.activeComponent = blockElement;
    this.state.focusedBlock = blockElement;
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

      // TODO XXX
      // `ESC`
      // clear `format quick bar`
      this.container.querySelector('format-quick-bar')?.remove();
    } else if (type === 'embed') {
      this.blurFocusedBlock({ type: 'UNKNOWN' });
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

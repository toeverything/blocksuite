import type { Page } from '@blocksuite/store';
import type { EmbedBlockComponent } from '../../embed-block/index.js';
import { showFormatQuickBar } from '../../components/format-quick-bar/index.js';
import '../../components/drag-handle.js';
import {
  caretRangeFromPoint,
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
  doesInSamePath,
  getCurrentRange,
  isPageTitleElement,
} from '../../__internal__/index.js';
import type { RichText } from '../../__internal__/rich-text/rich-text.js';
import {
  getNativeSelectionMouseDragInfo,
  repairContextMenuRange,
} from '../utils/cursor.js';
import type { DefaultPageSignals } from './default-page-block.js';
import {
  getBlockEditingStateByPosition,
  getBlockEditingStateByCursor,
} from './utils.js';
import type { BaseBlockModel } from '@blocksuite/store';
import type { DefaultPageBlockComponent } from './default-page-block.js';
import { EmbedResizeManager } from './embed-resize-manager.js';
import { DragHandle } from '../../components/drag-handle.js';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';

function intersects(rect: DOMRect, selectionRect: DOMRect, offset: IPoint) {
  return (
    rect.left <= selectionRect.right + offset.x &&
    rect.right >= selectionRect.left + offset.x &&
    rect.top <= selectionRect.bottom + offset.y &&
    rect.bottom >= selectionRect.top + offset.y
  );
}

function filterSelectedBlock(
  blockCache: Map<Element, DOMRect>,
  selectionRect: DOMRect,
  offset: IPoint
): Element[] {
  const blocks = Array.from(blockCache.keys());
  return blocks.filter(block => {
    const rect = block.getBoundingClientRect();
    return intersects(rect, selectionRect, offset);
  });
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

type PageSelectionType = 'native' | 'block' | 'none' | 'embed';

export class PageSelectionState {
  type: PageSelectionType;
  selectEmbeds: EmbedBlockComponent[] = [];
  selectedBlocks: Element[] = [];
  private _startRange: Range | null = null;
  private _startPoint: { x: number; y: number } | null = null;
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
    this._startRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
    this._startPoint = { x: e.x, y: e.y };
  }

  refreshRichTextBoundsCache(mouseRoot: HTMLElement) {
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
    this.selectedBlocks = [];
  }
}

export class DefaultSelectionManager {
  page: Page;
  state = new PageSelectionState('none');
  private _mouseRoot: HTMLElement;
  private _container: DefaultPageBlockComponent;
  private _disposeCallbacks: (() => void)[] = [];
  private _signals: DefaultPageSignals;
  private _embedResizeManager: EmbedResizeManager;
  private _dragHandleAbortController = new AbortController();

  private _dragHandle: DragHandle | null = null;

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
    const createHandle = () => {
      this._dragHandle = new DragHandle({
        setSelectedBlocks: this._setSelectedBlocks,
        onDropCallback: (e, start, end) => {
          const startModel = start.model;
          const rect = end.position;
          const nextModel = end.model;
          if (doesInSamePath(this.page, nextModel, startModel)) {
            return;
          }
          this.page.captureSync();
          const distanceToTop = Math.abs(rect.top - e.y);
          const distanceToBottom = Math.abs(rect.bottom - e.y);
          this.page.moveBlock(
            startModel,
            nextModel,
            distanceToTop < distanceToBottom
          );
          this.clearRects();
        },
        getBlockEditingStateByPosition: (pageX, pageY, skipX) => {
          return getBlockEditingStateByPosition(this._blocks, pageX, pageY, {
            skipX,
          });
        },
        getBlockEditingStateByCursor: (
          pageX,
          pageY,
          cursor,
          size,
          skipX,
          dragging
        ) => {
          return getBlockEditingStateByCursor(
            this._blocks,
            pageX,
            pageY,
            cursor,
            {
              size,
              skipX,
              dragging,
            }
          );
        },
      });
    };
    this._disposeCallbacks.push(
      this.page.awareness.signals.update.on(msg => {
        if (msg.id !== this.page.doc.clientID) {
          return;
        }
        if (msg.state?.flags.enable_drag_handle) {
          // todo: implement subscribe with selector
          if (!this._dragHandle) {
            createHandle();
          }
        } else {
          this._dragHandle?.remove();
          this._dragHandle = null;
        }
      }).dispose
    );
    if (this.page.awareness.getFlag('enable_drag_handle')) {
      createHandle();
    }
    this._embedResizeManager = new EmbedResizeManager(this.state, signals);
    this._disposeCallbacks.push(
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

  private get _blocks(): BaseBlockModel[] {
    const result: BaseBlockModel[] = [];
    const blocks = this.page.root?.children.slice();
    if (!blocks) {
      return [];
    }

    const dfs = (
      blocks: BaseBlockModel[],
      depth: number,
      parentIndex: number
    ) => {
      for (const block of blocks) {
        if (!matchFlavours(block, ['affine:frame'])) {
          result.push(block);
        }
        block.depth = depth;
        if (parentIndex !== -1) {
          block.parentIndex = parentIndex;
        }
        block.children.length &&
          dfs(block.children, depth + 1, result.length - 1);
      }
    };

    dfs(blocks, 0, -1);
    return result;
  }

  private get _containerOffset() {
    const containerRect = this._mouseRoot.getBoundingClientRect();
    const containerOffset = {
      x: containerRect.left,
      y: containerRect.top,
    };
    return containerOffset;
  }

  private _setSelectedBlocks = (selectedBlocks: Element[]) => {
    this.state.selectedBlocks = selectedBlocks;
    const { blockCache } = this.state;
    const selectedRects = selectedBlocks.map(block => {
      return blockCache.get(block) as DOMRect;
    });
    this._signals.updateSelectedRects.emit(selectedRects);
  };

  private _onBlockSelectionDragStart(e: SelectionEvent) {
    this.state.type = 'block';
    this.state.resetStartRange(e);
    this.state.refreshRichTextBoundsCache(this._mouseRoot);
    resetNativeSelection(null);
    // deactivate quill keyboard event handler
    (document.activeElement as HTMLDivElement).blur();
  }

  private _onBlockSelectionDragMove(e: SelectionEvent) {
    assertExists(this.state.startPoint);
    assertExists(this.state.startPoint);
    const current = { x: e.x, y: e.y };
    const { startPoint: start } = this.state;
    const selectionRect = createSelectionRect(current, start);
    const selectedBlocks = filterSelectedBlock(
      this.state.blockCache,
      selectionRect,
      e.containerOffset
    );

    this._setSelectedBlocks(selectedBlocks);
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
    this.state.resetStartRange(e);
    if (isPageTitleElement(e.raw.target)) return;
    if (isEmbed(e)) {
      this.state.type = 'embed';
      this._embedResizeManager.onStart(e);
      return;
    }
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
      this._blocks,
      e.raw.pageX,
      e.raw.pageY
    );

    if (clickBlockInfo && clickBlockInfo.model) {
      const { model } = clickBlockInfo;
      const page = getDefaultPageBlock(model);
      page.lastSelectionPosition = 'start';
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
    if (e.raw.target instanceof HTMLTextAreaElement) return;
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
    this.state.refreshRichTextBoundsCache(this._mouseRoot);
    const hoverEditingState = getBlockEditingStateByPosition(
      this._blocks,
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
      if (this._dragHandle) {
        const clickDragState = getBlockEditingStateByPosition(
          this._blocks,
          e.raw.pageX,
          e.raw.pageY,
          {
            skipX: true,
          }
        );
        if (clickDragState?.model) {
          this._dragHandle.show(clickDragState);
        }
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
    if (this._dragHandle) {
      this._dragHandle.remove();
    }
    this._dragHandleAbortController.abort();
    this._signals.updateSelectedRects.dispose();
    this._signals.updateFrameSelectionRect.dispose();
    this._signals.updateEmbedEditingState.dispose();
    this._signals.updateEmbedRects.dispose();
    this._disposeCallbacks.forEach(callback => callback());
  }

  resetSelectedBlockByRect(
    blockRect: DOMRect,
    pageSelectionType: PageSelectionType = 'block'
  ) {
    this.state.type = pageSelectionType;
    this.state.refreshRichTextBoundsCache(this._mouseRoot);
    const { blockCache } = this.state;
    const { _containerOffset } = this;
    const selectedBlocks = filterSelectedBlock(
      blockCache,
      blockRect,
      _containerOffset
    );
    this._setSelectedBlocks(selectedBlocks);
  }

  selectBlocksByRect(hitRect: DOMRect) {
    this.state.refreshRichTextBoundsCache(this._mouseRoot);

    const selectedBlocks = filterSelectedBlock(this.state.blockCache, hitRect, {
      x: 0,
      y: 0,
    });

    if (this.state.blockCache.size === this.state.selectedBlocks.length) {
      this._signals.updateSelectedRects.emit([]);
      this._signals.updateEmbedRects.emit([]);
      return;
    }
    this.state.clear();
    this.state.type = 'block';

    this._signals.updateEmbedRects.emit([]);
    this._setSelectedBlocks(selectedBlocks);
    return;
  }
}

import type { EmbedBlockComponent } from '@blocksuite/blocks';
import {
  type BlockComponentElement,
  getAllBlocks,
  Point,
  resetNativeSelection,
  type SelectionEvent,
} from '@blocksuite/blocks/std';
import { caretRangeFromPoint } from '@blocksuite/global/utils';

import type { RichText } from '../../../__internal__/rich-text/rich-text.js';

export type PageSelectionType =
  | 'native'
  | 'block'
  | 'none'
  | 'embed'
  | 'database';

export interface PageViewport {
  left: number;
  top: number;
  scrollLeft: number;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  clientWidth: number;
  // scrollWidth: number,
}

export class PageSelectionState {
  type: PageSelectionType;
  viewport: PageViewport = {
    left: 0,
    top: 0,
    scrollLeft: 0,
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
    clientWidth: 0,
  };

  draggingArea: { start: Point; end: Point } | null = null;
  selectedEmbeds: EmbedBlockComponent[] = [];
  selectedBlocks: BlockComponentElement[] = [];
  // null: SELECT_ALL
  focusedBlock: BlockComponentElement | null = null;
  rafID?: number;
  private _startRange: Range | null = null;
  private _rangePoint: Point | null = null;
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
    this._rangePoint = new Point(x, y);
  }

  resetDraggingArea(
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
    const end = new Point(x, y);
    this.draggingArea = {
      start: end.clone(),
      end,
    };
  }

  refreshBlockRectCache() {
    this._blockCache.clear();
    const allBlocks = getAllBlocks();
    for (const block of allBlocks) {
      const rect = block.getBoundingClientRect();
      this._blockCache.set(block, rect);
    }
  }

  blur() {
    resetNativeSelection(null);
    // deactivate keyboard event handler
    if (
      document.activeElement &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }
  }

  clearRaf() {
    if (this.rafID) {
      this.rafID = void cancelAnimationFrame(this.rafID);
    }
  }

  clearDraggingArea() {
    this.clearRaf();
    this.draggingArea = null;
  }

  clearNativeSelection() {
    this.type = 'none';
    this._richTextCache.clear();
    this._startRange = null;
    this._rangePoint = null;
    resetNativeSelection(null);
  }

  clearBlockSelection() {
    this.type = 'none';
    this._activeComponent = null;
    this.focusedBlock = null;
    this.selectedBlocks = [];
    this.clearDraggingArea();
  }

  clearEmbedSelection() {
    this.type = 'none';
    this.selectedEmbeds = [];
    this._activeComponent = null;
  }

  clearSelection() {
    this.clearBlockSelection();
    this.clearEmbedSelection();
    this.clearNativeSelection();
  }
}

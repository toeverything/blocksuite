import type { PointerEventState } from '@blocksuite/block-std';
import { caretRangeFromPoint } from '@blocksuite/global/utils';

import type {
  BlockComponentElement,
  IPoint,
} from '../../../__internal__/index.js';
import {
  getBlockElementsByElement,
  getRectByBlockElement,
  Point,
  resetNativeSelection,
} from '../../../__internal__/index.js';
import type { ImageBlockComponent } from '../../../image-block/index.js';

export type PageSelectionType =
  | 'native'
  | 'block'
  | 'block:drag'
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
  // TODO add readonly
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
  /**
   * @deprecated TODO merge to `selectedBlocks` or `_activeComponent`
   */
  get selectedEmbed() {
    if (this.type === 'embed') {
      return this._activeComponent as ImageBlockComponent;
    }
    return null;
  }

  selectedBlocks: BlockComponentElement[] = [];
  // null: SELECT_ALL
  focusedBlock: BlockComponentElement | null = null;
  rafID?: number;
  lastPoint: Point | null = null;
  private _startRange: Range | null = null;
  private _blockCache = new Map<BlockComponentElement, DOMRect>();
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

  get blockCache() {
    return this._blockCache;
  }

  get viewportOffset(): IPoint {
    const {
      viewport: { left, top, scrollLeft, scrollTop },
    } = this;
    return {
      x: scrollLeft - left,
      y: scrollTop - top,
    };
  }

  resetStartRange(e: PointerEventState) {
    const { clientX, clientY } = e.raw;
    this._startRange = caretRangeFromPoint(clientX, clientY);
    // Save the last coordinates so that we can send them when scrolling through the wheel
    this.lastPoint = new Point(clientX, clientY);
  }

  resetDraggingArea(
    e: PointerEventState,
    offset: { scrollLeft: number; scrollTop: number } = {
      scrollLeft: 0,
      scrollTop: 0,
    }
  ) {
    const { scrollLeft, scrollTop } = offset;
    let { x, y } = e.point;
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
    // find all blocks from the document
    const allBlocks = getBlockElementsByElement(
      document
    ) as BlockComponentElement[];
    for (const block of allBlocks) {
      this._blockCache.set(block, getRectByBlockElement(block));
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
    this.clearRaf();
    this.type = 'none';
    this._startRange = null;
    this.lastPoint = null;
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
    this._activeComponent = null;
  }

  clearSelection() {
    this.clearBlockSelection();
    this.clearEmbedSelection();
    this.clearNativeSelection();
  }
}

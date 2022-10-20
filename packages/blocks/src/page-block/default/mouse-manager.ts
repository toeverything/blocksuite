import { Store } from '@blocksuite/store';
import {
  getBlockElementByModel,
  initMouseEventHandlers,
  SelectionEvent,
  caretRangeFromPoint,
  focusRichTextByOffset,
  resetNativeSeletion,
  assertExists,
  noop,
} from '../../__internal__';
import { RichText } from '../../__internal__/rich-text/rich-text';
import type { DefaultPageBlockSignals } from './default-page-block';

function isBlankAreaBetweenBlocks(startContainer: Node) {
  if (!(startContainer instanceof HTMLElement)) return false;
  return startContainer.className.includes('affine-paragraph-block-container');
}

function isBlankAreaAfterLastBlock(startContainer: HTMLElement) {
  return startContainer.tagName === 'GROUP-BLOCK';
}

function isBlankAreaBeforeFirstBlock(startContainer: HTMLElement) {
  if (!(startContainer instanceof HTMLElement)) return false;
  return startContainer.className.includes('affine-group-block-container');
}

function isBlankArea(e: SelectionEvent) {
  const { cursor } = window.getComputedStyle(e.raw.target as Element);
  return cursor !== 'text';
}

function intersects(rect: DOMRect, selectionRect: DOMRect) {
  return (
    rect.left < selectionRect.right &&
    rect.right > selectionRect.left &&
    rect.top < selectionRect.bottom &&
    rect.bottom > selectionRect.top
  );
}

function filterSelectedRichText(
  richTextCache: Map<RichText, DOMRect>,
  selectionRect: DOMRect
): RichText[] {
  const richTexts = Array.from(richTextCache.keys());
  return richTexts.filter(richText => {
    const rect = richText.getBoundingClientRect();
    return intersects(rect, selectionRect);
  });
}

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

type PageSelectionType = 'native' | 'block' | 'none';

class PageSelection {
  type: PageSelectionType;
  selectedRichTexts: RichText[] = [];

  private _startRange: Range | null = null;
  private _startPoint: { x: number; y: number } | null = null;
  private _richTextCache = new Map<RichText, DOMRect>();

  constructor(type: PageSelectionType) {
    this.type = type;
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

  resetStartRange(e: SelectionEvent) {
    this._startRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
    this._startPoint = { x: e.raw.clientX, y: e.raw.clientY };
  }

  refreshRichTextBoundsCache(container: HTMLElement) {
    const richTexts = Array.from(container.querySelectorAll('rich-text'));
    richTexts.forEach(richText => {
      // const rect = (
      //   richText.closest(`[${BLOCK_ID_ATTR}]`) as HTMLElement
      // ).getBoundingClientRect();
      const rect = richText.getBoundingClientRect();
      this._richTextCache.set(richText, rect);
    });
  }

  clear() {
    this.type = 'none';
    this._richTextCache.clear();
    this._startRange = null;
    this._startPoint = null;
    this.selectedRichTexts = [];
  }
}

export class DefaultMouseManager {
  store: Store;
  selection = new PageSelection('none');
  private _container: HTMLElement;
  private _mouseDisposeCallback: () => void;
  private _signals: DefaultPageBlockSignals;

  constructor(
    store: Store,
    container: HTMLElement,
    signals: DefaultPageBlockSignals
  ) {
    this.store = store;
    this._signals = signals;
    this._container = container;
    this._mouseDisposeCallback = initMouseEventHandlers(
      this._container,
      this._onContainerDragStart,
      this._onContainerDragMove,
      this._onContainerDragEnd,
      this._onContainerClick,
      this._onContainerDblClick,
      this._onContainerMouseMove,
      this._onContainerMouseOut
    );
  }

  private _onBlockSelectionDragStart(e: SelectionEvent) {
    this.selection.type = 'block';
    this.selection.resetStartRange(e);
    this.selection.refreshRichTextBoundsCache(this._container);
    resetNativeSeletion(null);
  }

  private _onBlockSelectionDragMove(e: SelectionEvent) {
    assertExists(this.selection.startPoint);
    const current = { x: e.raw.clientX, y: e.raw.clientY };
    const { startPoint: start } = this.selection;

    const selectionRect = createSelectionRect(current, start);
    const { richTextCache } = this.selection;
    const selectedRichTexts = filterSelectedRichText(
      richTextCache,
      selectionRect
    );
    this.selection.selectedRichTexts = selectedRichTexts;

    const selectedBounds = selectedRichTexts.map(richText => {
      return richTextCache.get(richText) as DOMRect;
    });
    this._signals.updateSelectedRects.emit(selectedBounds);
    this._signals.updateSelectionRect.emit(selectionRect);
  }

  private _onBlockSelectionDragEnd(e: SelectionEvent) {
    this._signals.updateSelectionRect.emit(null);
    // do not clear selected rects here
  }

  private _onNativeSelectionDragStart(e: SelectionEvent) {
    this.selection.type = 'native';
  }

  private _onNativeSelectionDragMove(e: SelectionEvent) {
    assertExists(this.selection.startRange);
    const { startContainer, startOffset, endContainer, endOffset } =
      this.selection.startRange;
    const currentRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
    if (currentRange?.comparePoint(endContainer, endOffset) === 1) {
      currentRange?.setEnd(endContainer, endOffset);
    } else {
      currentRange?.setStart(startContainer, startOffset);
    }
    resetNativeSeletion(currentRange);
  }

  private _onNativeSelectionDragEnd(e: SelectionEvent) {
    noop();
  }

  private _onContainerDragStart = (e: SelectionEvent) => {
    this.selection.resetStartRange(e);

    if (isBlankArea(e)) {
      this._onBlockSelectionDragStart(e);
    } else {
      this._onNativeSelectionDragStart(e);
    }
  };

  private _onContainerDragMove = (e: SelectionEvent) => {
    if (this.selection.type === 'native') {
      this._onNativeSelectionDragMove(e);
    } else if (this.selection.type === 'block') {
      this._onBlockSelectionDragMove(e);
    }
  };

  private _onContainerDragEnd = (e: SelectionEvent) => {
    if (this.selection.type === 'native') {
      this._onNativeSelectionDragEnd(e);
    } else if (this.selection.type === 'block') {
      this._onBlockSelectionDragEnd(e);
    }
  };

  private _onContainerClick = (e: SelectionEvent) => {
    this.selection.clear();
    this._signals.updateSelectedRects.emit([]);

    if ((e.raw.target as HTMLElement).tagName === 'DEBUG-MENU') return;
    if (e.raw.target instanceof HTMLInputElement) return;
    // TODO handle shift + click
    if (e.keys.shift) return;

    const range = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
    const startContainer = range?.startContainer;

    // click on rich text
    if (startContainer instanceof Node) {
      resetNativeSeletion(range);
    }

    if (!(startContainer instanceof HTMLElement)) return;

    if (
      isBlankAreaBetweenBlocks(startContainer) ||
      isBlankAreaBeforeFirstBlock(startContainer)
    ) {
      focusRichTextByOffset(startContainer, e.raw.clientX);
    } else if (isBlankAreaAfterLastBlock(startContainer)) {
      const { root } = this.store;
      const lastChild = root?.lastChild();
      if (lastChild?.flavour === 'paragraph' || lastChild?.flavour === 'list') {
        const block = getBlockElementByModel(lastChild);
        focusRichTextByOffset(block, e.raw.clientX);
      }
    }
  };

  private _onContainerDblClick = (e: SelectionEvent) => {
    // console.log('dblclick', e);
  };

  private _onContainerMouseMove = (e: SelectionEvent) => {
    // console.log('mousemove', e);
  };

  private _onContainerMouseOut = (e: SelectionEvent) => {
    // console.log('mouseout', e);
  };

  dispose() {
    this._mouseDisposeCallback();
  }
}

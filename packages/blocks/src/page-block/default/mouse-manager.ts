import { Store } from '@blocksuite/store';
import {
  getBlockElementByModel,
  initMouseEventHandlers,
  SelectionEvent,
  caretRangeFromPoint,
  focusRichTextByOffset,
  resetSeletion,
  assertExists,
  noop,
} from '../../__internal__';

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
  return cursor === 'crosshair';
}

type PageSelectionType = 'native' | 'block' | 'none';

class PageSelection {
  type: PageSelectionType;
  private _startRange: Range | null = null;

  constructor(type: PageSelectionType) {
    this.type = type;
  }

  get startRange() {
    return this._startRange;
  }

  resetStartRange(e: SelectionEvent) {
    this._startRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
  }

  clear() {
    this._startRange = null;
  }
}

export class DefaultMouseManager {
  store: Store;
  private _container: HTMLElement;
  private _mouseDisposeCallback: () => void;
  private _selection = new PageSelection('none');

  constructor(store: Store, container: HTMLElement) {
    this.store = store;
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

  private _onBlockDragStart(e: SelectionEvent) {
    this._selection.type = 'block';
    this._selection.clear();
  }

  private _onBlockDragMove(e: SelectionEvent) {
    // TODO handle block drag move
  }

  private _onBlockDragEnd(e: SelectionEvent) {
    // TODO handle block drag end
  }

  private _onNativeDragStart(e: SelectionEvent) {
    this._selection.type = 'native';
  }

  private _onNativeDragMove(e: SelectionEvent) {
    assertExists(this._selection.startRange);
    const { startContainer, startOffset } = this._selection.startRange;
    const currentRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
    currentRange?.setStart(startContainer, startOffset);
    // currentRange?.setEnd(startContainer, startOffset);
    resetSeletion(currentRange);
  }

  private _onNativeDragEnd(e: SelectionEvent) {
    noop();
  }

  private _onContainerDragStart = (e: SelectionEvent) => {
    this._selection.resetStartRange(e);

    if (isBlankArea(e)) {
      this._onBlockDragStart(e);
    } else {
      this._onNativeDragStart(e);
    }
  };

  private _onContainerDragMove = (e: SelectionEvent) => {
    if (this._selection.type === 'native') {
      this._onNativeDragMove(e);
    } else if (this._selection.type === 'block') {
      this._onBlockDragMove(e);
    }
  };

  private _onContainerDragEnd = (e: SelectionEvent) => {
    if (this._selection.type === 'native') {
      this._onNativeDragEnd(e);
    } else if (this._selection.type === 'block') {
      this._onBlockDragEnd(e);
    }
    this._selection.type = 'none';
    this._selection.clear();
  };

  private _onContainerClick = (e: SelectionEvent) => {
    this._selection.type = 'none';

    if ((e.raw.target as HTMLElement).tagName === 'DEBUG-MENU') return;
    if (e.raw.target instanceof HTMLInputElement) return;
    // TODO handle shift + click
    if (e.keys.shift) return;

    const range = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
    const startContainer = range?.startContainer;

    // click on rich text
    if (startContainer instanceof Node) {
      resetSeletion(range);
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

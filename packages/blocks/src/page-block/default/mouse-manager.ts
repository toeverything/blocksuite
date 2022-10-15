import { Store } from '@blocksuite/store';
import { GroupBlockModel } from '../../group-block';
import {
  getBlockElementByModel,
  initMouseEventHandlers,
  SelectionEvent,
  caretRangeFromPoint,
  focusRichTextByOffset,
  resetSeletion,
} from '../../__internal__';

export class DefaultMouseManager {
  store: Store;
  private _container: HTMLElement;
  private _mouseDisposeCallback: () => void;

  private _startRange: Range | null = null;

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

  get blocks(): GroupBlockModel[] {
    return (this.store.root?.children as GroupBlockModel[]) ?? [];
  }

  private _onContainerDragStart = (e: SelectionEvent) => {
    this._startRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
  };

  private _onContainerDragMove = (e: SelectionEvent) => {
    if (!this._startRange) return;
    const { startContainer, startOffset } = this._startRange;
    const currentRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
    currentRange?.setStart(startContainer, startOffset);
    // currentRange?.setEnd(startContainer, startOffset);
    resetSeletion(currentRange);
  };

  private _onContainerDragEnd = (e: SelectionEvent) => {
    this._startRange = null;
  };

  private _onContainerClick = (e: SelectionEvent) => {
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

    // click on blank area between blocks
    if (startContainer.className.includes('affine-paragraph-block-container')) {
      focusRichTextByOffset(startContainer, e.raw.clientX);
    }
    // click on blank area after last block
    else if (startContainer.tagName === 'GROUP-BLOCK') {
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

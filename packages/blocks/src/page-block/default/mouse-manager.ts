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
    // console.log('drag start', e);
  };

  private _onContainerDragMove = (e: SelectionEvent) => {
    // console.log('drag move', e);
  };

  private _onContainerDragEnd = (e: SelectionEvent) => {
    // console.log('drag end', e);
  };

  private _onContainerClick = (e: SelectionEvent) => {
    if ((e.raw.target as HTMLElement).tagName === 'DEBUG-MENU') return;
    if (e.raw.target instanceof HTMLInputElement) return;

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

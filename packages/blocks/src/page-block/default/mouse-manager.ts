import { Store } from '@blocksuite/store';
import { GroupBlockModel } from '../../group-block';
import { initMouseEventHandlers, SelectionEvent } from '../../__internal__';

function caretRangeFromPoint(x: number, y: number) {
  return document.caretRangeFromPoint(x, y);
}

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

    const pointRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
    if (pointRange?.startContainer instanceof Node) {
      const selection = document.getSelection() as Selection;
      selection.removeAllRanges();
      selection.addRange(pointRange);
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

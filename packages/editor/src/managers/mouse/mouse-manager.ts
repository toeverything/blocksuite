import { Slot, flattenDisposable, IDisposable } from '@blocksuite/store';

export type MouseEventHandler = (e: MouseEvent) => void;

export class MouseManager {
  private _isMouseDown = false;
  private _eventBinder: HTMLElement['addEventListener'];
  private _disposables: IDisposable[] = [];
  private slots = {
    documentMouseUp: Slot.fromEvent(window, 'mouseup', { capture: true }),
    mouseDown: new Slot<MouseEvent>(),
    mouseUp: new Slot<MouseEvent>(),
    mouseMove: new Slot<MouseEvent>(),
  };

  constructor(eventBinder: HTMLElement['addEventListener']) {
    this._disposables = [
      {
        dispose: this.slots.documentMouseUp.dispose,
      },
    ];
    this._eventBinder = eventBinder;
    this._initEditorMouseEventHandler();
  }

  private _initEditorMouseEventHandler() {
    this._eventBinder('mousedown', e => {
      this._emitMouseDown(e);
    });
    this._eventBinder('mouseup', e => {
      this._emitMouseUp(e);
    });
    this._eventBinder('mousemove', e => {
      this._emitMouseMove(e);
    });
  }

  public onMouseDown(handler: MouseEventHandler) {
    const disposable = this.slots.mouseDown.on(handler);
    this._disposables.push(disposable);
    return disposable;
  }

  private _emitMouseDown(e: MouseEvent) {
    this.slots.mouseDown.emit(e);
  }

  public onMouseUp(handler: MouseEventHandler) {
    const disposable = this.slots.mouseUp.on(handler);
    this._disposables.push(disposable);
    return disposable;
  }

  private _emitMouseUp(e: MouseEvent) {
    this.slots.mouseUp.emit(e);
  }

  public onMouseMove(handler: MouseEventHandler) {
    const disposable = this.slots.mouseMove.on(handler);
    this._disposables.push(disposable);
    return disposable;
  }

  private _emitMouseMove(e: MouseEvent) {
    this.slots.mouseMove.emit(e);
  }

  get isMouseDown() {
    return this._isMouseDown;
  }

  public onDocumentMouseUpOnce(handler: (e: MouseEvent) => void) {
    this.slots.documentMouseUp.once(handler);
  }

  public dispose() {
    flattenDisposable(this._disposables);
    this._disposables = [
      {
        dispose: this.slots.documentMouseUp.dispose,
      },
    ];
  }
}

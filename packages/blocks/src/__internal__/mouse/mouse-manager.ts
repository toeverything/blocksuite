import { Slot, flattenDisposable, IDisposable } from '@blocksuite/store';

export type MouseEventHandler = (e: MouseEvent) => void;

export class MouseManager {
  private _isMouseDown = false;
  private _disposables: IDisposable[] = [];

  private _slots = {
    documentMouseUp: Slot.fromEvent(window, 'mouseup', { capture: true }),
    mouseDown: new Slot<MouseEvent>(),
    mouseUp: new Slot<MouseEvent>(),
    mouseMove: new Slot<MouseEvent>(),
  };
  private _target: HTMLElement;

  constructor(target: HTMLElement) {
    this._disposables = [
      {
        dispose: this._slots.documentMouseUp.dispose,
      },
    ];
    this._target = target;
    this._initMouseHandlers();
  }

  private _initMouseHandlers() {
    const { _target } = this;
    _target.addEventListener('mousedown', e => this._emitMouseDown(e));
    _target.addEventListener('mouseup', e => this._emitMouseUp(e));
    _target.addEventListener('mousemove', e => this._emitMouseMove(e));
  }

  public onMouseDown(handler: MouseEventHandler) {
    const disposable = this._slots.mouseDown.on(handler);
    this._disposables.push(disposable);
    return disposable;
  }

  private _emitMouseDown(e: MouseEvent) {
    this._slots.mouseDown.emit(e);
  }

  public onMouseUp(handler: MouseEventHandler) {
    const disposable = this._slots.mouseUp.on(handler);
    this._disposables.push(disposable);
    return disposable;
  }

  private _emitMouseUp(e: MouseEvent) {
    this._slots.mouseUp.emit(e);
  }

  public onMouseMove(handler: MouseEventHandler) {
    const disposable = this._slots.mouseMove.on(handler);
    this._disposables.push(disposable);
    return disposable;
  }

  private _emitMouseMove(e: MouseEvent) {
    this._slots.mouseMove.emit(e);
  }

  get isMouseDown() {
    return this._isMouseDown;
  }

  public onDocumentMouseUpOnce(handler: (e: MouseEvent) => void) {
    this._slots.documentMouseUp.once(handler);
  }

  public dispose() {
    flattenDisposable(this._disposables);
    this._disposables = [
      {
        dispose: this._slots.documentMouseUp.dispose,
      },
    ];
  }
}

import { Slot, flattenDisposable, IDisposable } from '@blocksuite/store';

export type MouseEventListener = (e: MouseEvent) => void;

export class DefaultMouseManager {
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
    this._initMouseListeners();
  }

  get isMouseDown() {
    return this._isMouseDown;
  }

  private _initMouseListeners() {
    const { _target } = this;
    _target.addEventListener('mousedown', e => this._slots.mouseDown.emit(e));
    _target.addEventListener('mouseup', e => this._slots.mouseUp.emit(e));
    _target.addEventListener('mousemove', e => this._slots.mouseMove.emit(e));
  }

  addMouseDownListener(listener: MouseEventListener) {
    const disposable = this._slots.mouseDown.on(listener);
    this._disposables.push(disposable);
    return disposable;
  }

  addMouseUpListener(listener: MouseEventListener) {
    const disposable = this._slots.mouseUp.on(listener);
    this._disposables.push(disposable);
    return disposable;
  }

  addMouseMoveListener(listener: MouseEventListener) {
    const disposable = this._slots.mouseMove.on(listener);
    this._disposables.push(disposable);
    return disposable;
  }

  addDocumentMouseUpOnceListener(listener: (e: MouseEvent) => void) {
    this._slots.documentMouseUp.once(listener);
  }

  dispose() {
    flattenDisposable(this._disposables);
    this._disposables = [
      {
        dispose: this._slots.documentMouseUp.dispose,
      },
    ];
  }
}

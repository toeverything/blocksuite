import { flattenDisposable, IDisposable } from '../../model/utils/disposable';
import { Slot } from '../../model/utils/slot';
import { MouseEventHandler } from './type';

export class Mouse {
  private is_mouse_down = false;
  private _eventBinder: HTMLElement['addEventListener'];
  private _disposables: IDisposable[] = [];
  private slots = {
    documentMouseUp: Slot.fromEvent(window, 'mouseup', { capture: true }),
    mousedown: new Slot<MouseEvent>(),
    mouseup: new Slot<MouseEvent>(),
    mousemove: new Slot<MouseEvent>(),
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

  public onmousedown(cb: MouseEventHandler) {
    const disposable = this.slots.mousedown.on(cb);
    this._disposables.push(disposable);
    return disposable;
  }

  private _emitMouseDown(e: MouseEvent) {
    this.slots.mousedown.emit(e);
  }

  public onmouseup(cb: MouseEventHandler) {
    const disposable = this.slots.mouseup.on(cb);
    this._disposables.push(disposable);
    return disposable;
  }

  private _emitMouseUp(e: MouseEvent) {
    this.slots.mouseup.emit(e);
  }

  public onmousemove(cb: MouseEventHandler) {
    const disposable = this.slots.mousemove.on(cb);
    this._disposables.push(disposable);
    return disposable;
  }

  private _emitMouseMove(e: MouseEvent) {
    this.slots.mousemove.emit(e);
  }

  get isMouseDown() {
    return this.is_mouse_down;
  }

  public onDocumentMouseUpOnce(cb: (e: MouseEvent) => void) {
    this.slots.documentMouseUp.once(cb);
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

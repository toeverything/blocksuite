type DisposeCallback = () => void;

export interface Disposable {
  dispose: DisposeCallback;
}

export interface DisposableManager extends Disposable {
  add(d: Disposable | DisposeCallback): void;
}

export class DisposableGroup implements DisposableManager {
  private _disposables: Disposable[] = [];

  private _disposed = false;

  get disposed() {
    return this._disposed;
  }

  /**
   * Add to group to be disposed with others.
   * This will be immediately disposed if this group has already been disposed.
   */
  add(d: Disposable | DisposeCallback) {
    if (typeof d === 'function') {
      if (this._disposed) d();
      else this._disposables.push({ dispose: d });
    } else {
      if (this._disposed) d.dispose();
      else this._disposables.push(d);
    }
  }

  addFromEvent<N extends keyof WindowEventMap>(
    element: Window,
    eventName: N,
    handler: (e: WindowEventMap[N]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addFromEvent<N extends keyof DocumentEventMap>(
    element: Document,
    eventName: N,
    handler: (e: DocumentEventMap[N]) => void,
    eventOptions?: boolean | AddEventListenerOptions
  ): void;
  addFromEvent<N extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    eventName: N,
    handler: (e: HTMLElementEventMap[N]) => void,
    eventOptions?: boolean | AddEventListenerOptions
  ): void;
  addFromEvent<N extends keyof VisualViewportEventMap>(
    element: VisualViewport,
    eventName: N,
    handler: (e: VisualViewportEventMap[N]) => void,
    eventOptions?: boolean | AddEventListenerOptions
  ): void;
  addFromEvent<N extends keyof VirtualKeyboardEventMap>(
    element: VirtualKeyboard,
    eventName: N,
    handler: (e: VirtualKeyboardEventMap[N]) => void,
    eventOptions?: boolean | AddEventListenerOptions
  ): void;

  addFromEvent(
    target: HTMLElement | Window | Document | VisualViewport | VirtualKeyboard,
    type: string,
    handler: (e: Event) => void,
    eventOptions?: boolean | AddEventListenerOptions
  ) {
    this.add({
      dispose: () => {
        target.removeEventListener(type, handler as () => void, eventOptions);
      },
    });
    target.addEventListener(type, handler as () => void, eventOptions);
  }

  dispose() {
    disposeAll(this._disposables);
    this._disposables = [];
    this._disposed = true;
  }
}

export function flattenDisposables(disposables: Disposable[]): Disposable {
  return {
    dispose: () => disposeAll(disposables),
  };
}

function disposeAll(disposables: Disposable[]) {
  for (const disposable of disposables) {
    try {
      disposable.dispose();
    } catch (err) {
      console.error(err);
    }
  }
}

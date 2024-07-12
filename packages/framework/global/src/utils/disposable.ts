type DisposeCallback = () => void;

export interface Disposable {
  dispose: DisposeCallback;
}

export class DisposableGroup implements Disposable {
  private _disposables: Disposable[] = [];

  private _disposed = false;

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
    options?: AddEventListenerOptions | boolean
  ): void;

  addFromEvent<N extends keyof DocumentEventMap>(
    element: Document,
    eventName: N,
    handler: (e: DocumentEventMap[N]) => void,
    eventOptions?: AddEventListenerOptions | boolean
  ): void;
  addFromEvent<N extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    eventName: N,
    handler: (e: HTMLElementEventMap[N]) => void,
    eventOptions?: AddEventListenerOptions | boolean
  ): void;
  addFromEvent(
    target: Document | HTMLElement | Window,
    type: string,
    handler: (e: Event) => void,
    eventOptions?: AddEventListenerOptions | boolean
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

  get disposed() {
    return this._disposed;
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

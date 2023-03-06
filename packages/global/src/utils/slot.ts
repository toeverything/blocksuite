import { Disposable, flattenDisposable } from './disposable.js';

// borrowed from blocky-editor
// https://github.com/vincentdchan/blocky-editor
export class Slot<T = void> implements Disposable {
  private _emitting = false;
  private _callbacks: ((v: T) => unknown)[] = [];
  private _disposables: Disposable[] = [];

  /**
   * Returns a disposable that will remove the listener
   */
  static fromEvent<N extends keyof WindowEventMap>(
    element: Window,
    eventName: N,
    handler: (e: WindowEventMap[N]) => void,
    options?: boolean | AddEventListenerOptions
  ): Disposable;
  static fromEvent<N extends keyof DocumentEventMap>(
    element: Document,
    eventName: N,
    handler: (e: DocumentEventMap[N]) => void,
    eventOptions?: boolean | AddEventListenerOptions
  ): Disposable;
  static fromEvent<N extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    eventName: N,
    handler: (e: HTMLElementEventMap[N]) => void,
    eventOptions?: boolean | AddEventListenerOptions
  ): Disposable;
  static fromEvent(
    element: HTMLElement | Window | Document,
    eventName: string,
    handler: (e: Event) => void,
    eventOptions?: boolean | AddEventListenerOptions
  ): Disposable {
    element.addEventListener(eventName, handler, eventOptions);
    return {
      dispose: () => {
        element.removeEventListener(eventName, handler, eventOptions);
      },
    };
  }

  filter(testFun: (v: T) => boolean): Slot<T> {
    const result = new Slot<T>();
    // if result is disposed, dispose this too
    result._disposables.push({ dispose: () => this.dispose() });

    this.on((v: T) => {
      if (testFun(v)) {
        result.emit(v);
      }
    });

    return result;
  }

  on(callback: (v: T) => unknown): Disposable {
    if (this._emitting) {
      const newCallback = [...this._callbacks, callback];
      this._callbacks = newCallback;
    } else {
      this._callbacks.push(callback);
    }
    return {
      dispose: () => {
        if (this._emitting) {
          this._callbacks = this._callbacks.filter(v => v !== callback);
        } else {
          const index = this._callbacks.indexOf(callback);
          if (index > -1) {
            this._callbacks.splice(index, 1); // remove one item only
          }
        }
      },
    };
  }

  subscribe = <U>(
    selector: (state: T) => U,
    callback: (value: U) => void,
    config?: {
      equalityFn?: (a: U, b: U) => boolean;
      filter?: (state: T) => boolean;
    }
  ) => {
    let prevState: U | undefined;
    const { filter, equalityFn = Object.is } = config ?? {};
    return this.on(state => {
      if (filter && !filter(state)) {
        return;
      }
      const nextState = selector(state);
      if (prevState === undefined || !equalityFn(prevState, nextState)) {
        callback(nextState);
        prevState = nextState;
      }
    });
  };

  once(callback: (v: T) => unknown): Disposable {
    let dispose: Disposable['dispose'] | undefined = undefined;
    const handler = (v: T) => {
      callback(v);
      if (dispose) {
        dispose();
      }
    };
    const disposable = this.on(handler);
    dispose = disposable.dispose;
    return disposable;
  }

  unshift(callback: (v: T) => unknown): Disposable {
    if (this._emitting) {
      const newCallback = [callback, ...this._callbacks];
      this._callbacks = newCallback;
    } else {
      this._callbacks.unshift(callback);
    }
    return {
      dispose: () => {
        if (this._emitting) {
          this._callbacks = this._callbacks.filter(v => v !== callback);
        } else {
          const index = this._callbacks.indexOf(callback);
          if (index > -1) {
            this._callbacks.splice(index, 1); // remove one item only
          }
        }
      },
    };
  }

  emit(v: T) {
    const prevEmitting = this._emitting;
    this._emitting = true;
    this._callbacks.forEach(f => {
      try {
        f(v);
      } catch (err) {
        console.error(err);
      }
    });
    this._emitting = prevEmitting;
  }

  pipe(that: Slot<T>): Slot<T> {
    this._callbacks.push(v => that.emit(v));
    return this;
  }

  dispose() {
    flattenDisposable(this._disposables).dispose();
    this._callbacks.length = 0;
  }

  toDispose(disposables: Disposable[]): Slot<T> {
    disposables.push(this);
    return this;
  }
}

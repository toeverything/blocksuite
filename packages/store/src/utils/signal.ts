import { IDisposable, flattenDisposable } from './disposable';

// borrowed from blocky-editor
// https://github.com/vincentdchan/blocky-editor
export class Signal<T = void> implements IDisposable {
  private emitting = false;
  private callbacks: ((v: T) => unknown)[] = [];
  private disposables: IDisposable[] = [];

  static fromEvent<N extends keyof HTMLElementEventMap>(
    element: HTMLElement | Window,
    eventName: N,
    eventOptions?: boolean | AddEventListenerOptions
  ): Signal<HTMLElementEventMap[N]> {
    const signal = new Signal<HTMLElementEventMap[N]>();
    const handler = (ev: HTMLElementEventMap[N]) => {
      signal.emit(ev);
    };
    (element as HTMLElement).addEventListener(eventName, handler, eventOptions);
    signal.disposables.push({
      dispose: () => {
        (element as HTMLElement).removeEventListener(eventName, handler);
      },
    });
    return signal;
  }

  filter(testFun: (v: T) => boolean): Signal<T> {
    const result = new Signal<T>();
    // if result is disposed, dispose this too
    result.disposables.push({ dispose: () => this.dispose() });

    this.on((v: T) => {
      if (testFun(v)) {
        result.emit(v);
      }
    });

    return result;
  }

  on(callback: (v: T) => unknown): IDisposable {
    if (this.emitting) {
      const newCallback = [...this.callbacks, callback];
      this.callbacks = newCallback;
    } else {
      this.callbacks.push(callback);
    }
    return {
      dispose: () => {
        if (this.emitting) {
          this.callbacks = this.callbacks.filter(v => v !== callback);
        } else {
          const index = this.callbacks.indexOf(callback);
          if (index > -1) {
            this.callbacks.splice(index, 1); // remove one item only
          }
        }
      },
    };
  }

  once(callback: (v: T) => unknown): void {
    let dispose: IDisposable['dispose'] | undefined = undefined;
    const handler = (v: T) => {
      callback(v);
      if (dispose) {
        dispose();
      }
    };
    dispose = this.on(handler).dispose;
  }

  unshift(callback: (v: T) => unknown): IDisposable {
    if (this.emitting) {
      const newCallback = [callback, ...this.callbacks];
      this.callbacks = newCallback;
    } else {
      this.callbacks.unshift(callback);
    }
    return {
      dispose: () => {
        if (this.emitting) {
          this.callbacks = this.callbacks.filter(v => v !== callback);
        } else {
          const index = this.callbacks.indexOf(callback);
          if (index > -1) {
            this.callbacks.splice(index, 1); // remove one item only
          }
        }
      },
    };
  }

  emit(v: T) {
    const prevEmitting = this.emitting;
    this.emitting = true;
    this.callbacks.forEach(f => {
      try {
        f(v);
      } catch (err) {
        console.error(err);
      }
    });
    this.emitting = prevEmitting;
  }

  pipe(that: Signal<T>): Signal<T> {
    this.callbacks.push(v => that.emit(v));
    return this;
  }

  dispose() {
    flattenDisposable(this.disposables).dispose();
    this.callbacks.length = 0;
  }

  toDispose(disposables: IDisposable[]): Signal<T> {
    disposables.push(this);
    return this;
  }
}

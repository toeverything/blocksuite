// type DisposeCallback = () => void;

export interface Disposable {
  dispose(): void;
}

export class DisposableGroup implements Disposable {
  private _disposed = false;
  private _disposables: Disposable[] = [];

  get disposed() {
    return this._disposed;
  }

  /**
   * Add to group to be disposed with others.
   * This will be immediately disposed if this group has already been disposed.
   */
  add(disposable: Disposable) {
    if (disposable) {
      if (this._disposed) disposable.dispose();
      else this._disposables.push(disposable);
    }
  }

  dispose() {
    disposeAll(this._disposables);
    this._disposables = [];
    this._disposed = true;
  }
}

export function flattenDisposable(disposables: Disposable[]): Disposable {
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

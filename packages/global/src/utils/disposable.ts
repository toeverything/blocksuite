export interface Disposable {
  dispose(): void;
}

type DisposeLogic = Disposable | (() => void);

export class DisposableGroup implements Disposable {
  private _disposed = false;
  get disposed() {
    return this._disposed;
  }
  constructor(private _disposables: DisposeLogic[] = []) {}
  /**
   * Add to group to be disposed with others.
   *
   * This will be immediately disposed if this group has already been disposed.
   */
  add(disposable: DisposeLogic | undefined | null | false): void {
    if (disposable) {
      if (this._disposed) execDisposeLogic(disposable);
      else this._disposables.push(disposable);
    }
  }
  dispose(): void {
    disposeAllAndClearArray(this._disposables);
    this._disposed = true;
  }
}

export function flattenDisposable(disposables: Disposable[]): Disposable {
  return {
    dispose: disposeAllAndClearArray.bind(null, disposables),
  };
}

/** @internal */
function disposeAllAndClearArray(disposables: DisposeLogic[]) {
  for (const disposable of disposables) {
    try {
      execDisposeLogic(disposable);
    } catch (err) {
      console.error(err);
    }
  }
  disposables.length = 0;
}

/** @internal */
function execDisposeLogic(disposable: DisposeLogic) {
  if (typeof disposable === 'function') disposable();
  else disposable.dispose();
}

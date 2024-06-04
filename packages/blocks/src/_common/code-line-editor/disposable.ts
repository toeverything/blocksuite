export interface Disposable {
  dispose(): void;
}

export class CompositeDisposable implements Disposable {
  private disposables: Disposable[] = [];

  add(disposable: Disposable | (() => void)): void {
    if (typeof disposable === 'function') {
      this.disposables.push({ dispose: disposable });
      return;
    }
    this.disposables.push(disposable);
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}

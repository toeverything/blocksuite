import type { CodeLine } from '../code-line.js';
import type { Disposable } from '../disposable.js';
import { CompositeDisposable } from '../disposable.js';

export class Widget implements Disposable {
  codeLine!: CodeLine;
  protected disposables = new CompositeDisposable();

  dispose(): void {
    this.disposables.dispose();
  }

  init(codeLine: CodeLine) {
    this.codeLine = codeLine;
  }
}

import type { Disposable } from './disposable.js';

export class Emitter<T> {
  private listeners = new Set<(data: T) => void>();

  on(listener: (data: T) => void): Disposable {
    this.listeners.add(listener);
    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  emit(data: T) {
    for (const listener of this.listeners) {
      listener(data);
    }
  }
}

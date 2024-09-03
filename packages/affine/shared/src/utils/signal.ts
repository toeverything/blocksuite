import { signal } from '@lit-labs/preact-signals';

interface Observable<T> {
  subscribe(observer: (value: T) => void): Unsubscribable;
}

interface Unsubscribable {
  unsubscribe(): void;
}

export function createSignalFromObservable<T>(
  observable$: Observable<T>,
  initValue: T
) {
  const newSignal = signal(initValue);
  const subscription = observable$.subscribe(value => {
    newSignal.value = value;
  });
  return {
    signal: newSignal,
    cleanup: () => subscription.unsubscribe(),
  };
}

export { type Signal } from '@lit-labs/preact-signals';

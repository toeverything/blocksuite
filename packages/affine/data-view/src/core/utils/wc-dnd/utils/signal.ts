import { computed, type ReadonlySignal } from '@preact/signals-core';

export const computedCache = <T>(
  cb: () => T
): ReadonlySignal<T> & {
  preValue: T;
} => {
  let value: T;
  const result = computed(() => {
    return (value = cb());
  });
  Object.defineProperty(result, 'preValue', {
    get(): T {
      return value;
    },
  });
  return result as never;
};

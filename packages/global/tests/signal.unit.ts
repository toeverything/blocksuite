import { Signal } from '@blocksuite/global/utils';
import { describe, expect, test, vi } from 'vitest';
describe('signal', () => {
  test('init', () => {
    const signal = new Signal();
    expect(signal).is.toBeDefined();
  });

  test('emit', () => {
    const signal = new Signal<void>();
    const callback = vi.fn();
    signal.on(callback);
    signal.emit();
    expect(callback).toBeCalled();
  });

  test('emit with value', () => {
    const signal = new Signal<number>();
    const callback = vi.fn(v => expect(v).toBe(5));
    signal.on(callback);
    signal.emit(5);
    expect(callback).toBeCalled();
  });

  test('listen once', () => {
    const signal = new Signal<number>();
    const callback = vi.fn(v => expect(v).toBe(5));
    signal.once(callback);
    signal.emit(5);
    signal.emit(6);
    expect(callback).toBeCalledTimes(1);
  });

  test('listen once with dispose', () => {
    const signal = new Signal<void>();
    const callback = vi.fn(() => {
      throw new Error('');
    });
    const disposable = signal.once(callback);
    disposable.dispose();
    signal.emit();
    expect(callback).toBeCalledTimes(0);
  });

  test('subscribe', () => {
    type Data = {
      name: string;
      age: number;
    };
    const signal = new Signal<Data>();
    const callback = vi.fn(v => expect(v).toBe('田所'));
    signal.subscribe(v => v.name, callback);
    signal.emit({ name: '田所', age: 24 });
    expect(callback).toBeCalledTimes(1);
  });
});

import { Signal } from '@blocksuite/store';

const defaultFlags = {
  enable_drag_handle: true,
};

export type Flags = typeof defaultFlags;

export function createFlagsContext() {
  const _flags = { ...defaultFlags };
  const signal = new Signal<keyof Flags>();
  const context = {
    flags: new Proxy(_flags, {
      get(target, p, receiver) {
        return Reflect.get(target, p, receiver);
      },
      set(target, p, newValue, receiver) {
        throw new Error('cannot modify flags directly');
      },
    }),
    switchSignal: signal,
    setFlags: (key: keyof Flags, value: boolean) => {
      _flags[key] = value;
      signal.emit(key);
    },
    dispose: () => {
      listener.dispose();
    },
  };

  const listener = Signal.fromEvent(window, 'affine.set-flags').on(
    ({ detail: { flag, value } }) => {
      context.setFlags(flag, value);
    }
  );

  return context;
}

export type FlagsContext = ReturnType<typeof createFlagsContext>;

const defaultFlags = {
  enable_drag_handle: true,
};

export type Flags = typeof defaultFlags;

export enum Preset {
  AbbeyWood = 0x1,
  Downhills = 0x2,
  LATEST = 0xffff,
}

export function createFlags() {
  const _flags = { ...defaultFlags };

  return {
    flags: new Proxy(_flags, {
      get(target, p, receiver) {
        return Reflect.get(target, p, receiver);
      },
      set(target, p, newValue, receiver) {
        throw new Error('cannot modify flags directly');
      },
    }),
    usePreset: (version: Preset) => {
      if (version <= Preset.AbbeyWood) {
        _flags.enable_drag_handle = false;
      }
    },
  };
}

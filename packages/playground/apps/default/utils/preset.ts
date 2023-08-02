import type { InitFn } from '../presets';

export async function loadPresets() {
  const presetMap = new Map<string, InitFn>();

  Object.values(
    (await import('../presets/index.js')) as Record<string, InitFn>
  ).forEach(fn => presetMap.set(fn.id, fn));

  return presetMap;
}

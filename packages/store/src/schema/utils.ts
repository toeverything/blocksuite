import { toBlockProps } from '../utils/utils.js';
import type { BlockProps, YBlock } from '../workspace/page.js';
import type { ProxyConfig } from '../yjs/config.js';
import type { ProxyManager } from '../yjs/index.js';
import { isPureObject, native2Y, NativeWrapper } from '../yjs/index.js';

export function toBlockMigrationData(
  yBlock: YBlock,
  proxy: ProxyManager
): Partial<BlockProps> {
  const config: ProxyConfig = { deep: true };

  const props = toBlockProps(yBlock, proxy);

  return new Proxy(props, {
    has: (target, p) => {
      return Reflect.has(target, p);
    },
    set: (target, p, value, receiver) => {
      if (typeof p !== 'string') {
        throw new Error('key cannot be a symbol');
      }

      if (value instanceof NativeWrapper) {
        yBlock.delete(`prop:${p}`);
        const _y = value.yMap;
        console.log(_y.toJSON());
        yBlock.set(`prop:${p}`, _y);
        return Reflect.set(target, p, value, receiver);
      }

      if (isPureObject(value) || Array.isArray(value)) {
        const _y = native2Y(value as Record<string, unknown> | unknown[], true);
        yBlock.set(`prop:${p}`, _y);
        const _value = proxy.createYProxy(_y, config);

        return Reflect.set(target, p, _value, receiver);
      }

      yBlock.set(`prop:${p}`, value);
      return Reflect.set(target, p, value, receiver);
    },
    get: (target, p, receiver) => {
      return Reflect.get(target, p, receiver);
    },
    deleteProperty: (target, p): boolean => {
      if (typeof p !== 'string') {
        throw new Error('key cannot be a symbol');
      }

      yBlock.delete(`prop:${p}`);
      return Reflect.deleteProperty(target, p);
    },
  });
}

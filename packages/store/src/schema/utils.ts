import * as Y from 'yjs';

import type {
  BlockProps,
  PrefixedBlockProps,
  YBlock,
} from '../workspace/page.js';
import type { ProxyConfig } from '../yjs/config.js';
import type { ProxyManager } from '../yjs/index.js';
import { isPureObject, native2Y } from '../yjs/index.js';

export function toBlockMigrationData(
  yBlock: YBlock,
  proxy: ProxyManager
): Partial<BlockProps> {
  const config: ProxyConfig = { deep: true };
  const prefixedProps = yBlock.toJSON() as PrefixedBlockProps;

  const props: Partial<BlockProps> = {};
  Object.keys(prefixedProps).forEach(prefixedKey => {
    if (prefixedProps[prefixedKey] && prefixedKey.startsWith('prop:')) {
      const realValue = yBlock.get(prefixedKey);
      const key = prefixedKey.replace('prop:', '');
      if (realValue instanceof Y.Map) {
        const value = proxy.createYProxy(realValue, config);
        props[key] = value;
      } else if (realValue instanceof Y.Array) {
        const value = proxy.createYProxy(realValue, config);
        props[key] = value;
      } else {
        props[key] = prefixedProps[prefixedKey];
      }
    }
  });

  return new Proxy(props, {
    has: (target, p) => {
      return Reflect.has(target, p);
    },
    set: (target, p, value, receiver) => {
      if (typeof p !== 'string') {
        throw new Error('key cannot be a symbol');
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

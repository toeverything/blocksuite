import { toBlockProps } from '../utils/utils.js';
import type { BlockProps, YBlock } from '../workspace/page.js';
import type { ProxyManager } from '../yjs/index.js';

export function toBlockMigrationData(
  yBlock: YBlock,
  proxy: ProxyManager
): Partial<BlockProps> {
  const props = toBlockProps(yBlock, proxy);
  props.id = yBlock.get('sys:id') as string;
  props.flavour = yBlock.get('sys:flavour') as string;

  return new Proxy(props, {
    has: (target, p) => {
      return Reflect.has(target, p);
    },
    set: (target, p, value, receiver) => {
      if (typeof p !== 'string') {
        throw new Error('key cannot be a symbol');
      }

      const data = proxy.transformData(value, x => yBlock.set(`prop:${p}`, x));
      return Reflect.set(target, p, data, receiver);
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

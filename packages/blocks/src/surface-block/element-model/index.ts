import { type Y } from '@blocksuite/store';

import type { SurfaceBlockModel } from '../surface-model.js';
import { ElementModel } from './base.js';

export function createElementModel(
  yMap: Y.Map<unknown>,
  model: SurfaceBlockModel,
  options: {
    onChange: (payload: { id: string; props: Record<string, unknown> }) => void;
  }
) {
  const stashed = new Map<string | symbol, unknown>();
  const elementModel = new ElementModel(yMap, model, stashed);
  const proxy = new Proxy(elementModel, {
    has(target, prop) {
      return Reflect.has(target, prop);
    },

    get(target, prop) {
      if (stashed.has(prop)) {
        return stashed.get(prop);
      }

      return Reflect.get(target, prop);
    },

    set(target, prop, value) {
      if (stashed.has(prop)) {
        stashed.set(prop, value);
        options.onChange({
          id: elementModel.id,
          props: {
            [prop]: value,
          },
        });

        return true;
      }

      return Reflect.set(target, prop, value);
    },

    getPrototypeOf() {
      return ElementModel.prototype;
    },
  });
  const dispose = onElementChange(yMap, keys => {
    options.onChange({
      id: elementModel.id,
      props: keys.reduce((acc, key) => {
        // @ts-ignore
        acc[key] = proxy[key];
        return acc;
      }, {}),
    });
  });

  return {
    model: proxy,
    dispose,
  };
}

function onElementChange(
  yMap: Y.Map<unknown>,
  callback: (keys: string[]) => void
) {
  const observer = (event: Y.YMapEvent<unknown>) => {
    const keys: string[] = [];

    event.keysChanged.forEach(key => {
      const type = event.changes.keys.get(key);

      if (!type) {
        return;
      }

      if (type.action === 'update' || type.action === 'add') {
        keys.push(key);
      }
    });

    callback(keys);
  };

  yMap.observe(observer);

  return () => {
    yMap.unobserve(observer);
  };
}

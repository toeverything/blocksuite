import { type Y } from '@blocksuite/store';

import type { SurfaceBlockModel } from '../surface-model.js';
import { ElementModel } from './base.js';
import { GroupElementModel } from './group.js';

const elementsCtorMap = {
  group: GroupElementModel,
};

export function createElementModel(
  yMap: Y.Map<unknown>,
  model: SurfaceBlockModel,
  options: {
    onChange: (payload: {
      id: string;
      props: Record<string, { oldValue: unknown }>;
    }) => void;
  }
): {
  model: ElementModel;
  dispose: () => void;
} {
  const stashed = new Map<string | symbol, unknown>();
  const Ctor =
    elementsCtorMap[yMap.get('type') as keyof typeof elementsCtorMap] ??
    ElementModel;
  const elementModel = new Ctor(yMap, model, stashed);
  const proxy = new Proxy(elementModel as ElementModel, {
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
  const dispose = onElementChange(yMap, props => {
    options.onChange({
      id: elementModel.id,
      props,
    });
  });

  return {
    model: proxy,
    dispose,
  };
}

function onElementChange(
  yMap: Y.Map<unknown>,
  callback: (props: Record<string, { oldValue: unknown }>) => void
) {
  const observer = (events: Y.YEvent<Y.Map<unknown>>[]) => {
    const props: Record<string, { oldValue: unknown }> = {};
    const event = events[0] as Y.YMapEvent<unknown>;

    event.keysChanged.forEach(key => {
      const type = event.changes.keys.get(key);
      const oldValue = event.changes.keys.get(key)?.oldValue;

      if (!type) {
        return;
      }

      if (type.action === 'update' || type.action === 'add') {
        props[key] = { oldValue };
      }
    });

    callback(props);
  };

  yMap.observeDeep(observer);

  return () => {
    yMap.observeDeep(observer);
  };
}

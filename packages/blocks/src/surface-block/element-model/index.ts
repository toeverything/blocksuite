import { Workspace, type Y } from '@blocksuite/store';

import type { SurfaceBlockModel } from '../surface-model.js';
import { ElementModel } from './base.js';
import { ConnectorElementModel } from './connector.js';
import { GroupElementModel } from './group.js';
import { ShapeElementModel } from './shape.js';

const elementsCtorMap = {
  group: GroupElementModel,
  connector: ConnectorElementModel,
  shape: ShapeElementModel,
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

  if (!Ctor) {
    throw new Error(`Invalid element type: ${yMap.get('type')}`);
  }

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

      target.yMap.set(prop as string, value);

      return true;
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

export function propsToYStruct(type: string, props: Record<string, unknown>) {
  const ctor = elementsCtorMap[type as keyof typeof elementsCtorMap];

  if (!ctor) {
    throw new Error(`Invalid element type: ${type}`);
  }

  return (ctor.propsToYStruct ?? ElementModel.propsToYStruct)(
    // @ts-ignore
    Object.assign(ctor.default(), props)
  );
}

export function createYMapFromProps(props: Record<string, unknown>) {
  const type = props.type as string;
  const ctor = elementsCtorMap[type as keyof typeof elementsCtorMap];

  if (!ctor) {
    throw new Error(`Invalid element type: ${type}`);
  }

  const yMap = new Workspace.Y.Map();

  props = propsToYStruct(type, Object.assign(ctor.default(), props));

  Object.keys(props).forEach(key => {
    yMap.set(key, props[key]);
  });

  return yMap;
}

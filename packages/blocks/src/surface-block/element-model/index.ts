import { Workspace, type Y } from '@blocksuite/store';

import type { SurfaceBlockModel } from '../surface-model.js';
import { ElementModel } from './base.js';
import { BrushElementModel } from './brush.js';
import { ConnectorElementModel } from './connector.js';
import { setCreateState } from './decorators.js';
import { GroupElementModel } from './group.js';
import { ShapeElementModel } from './shape.js';
import { TextElementModel } from './text.js';

const elementsCtorMap = {
  group: GroupElementModel,
  connector: ConnectorElementModel,
  shape: ShapeElementModel,
  brush: BrushElementModel,
  text: TextElementModel,
};

export function createElementModel(
  type: string,
  id: string,
  yMap: Y.Map<unknown>,
  model: SurfaceBlockModel,
  options: {
    onChange: (payload: {
      id: string;
      props: Record<string, { oldValue: unknown }>;
    }) => void;
    skipFieldInit?: boolean;
  }
): {
  model: ElementModel;
  dispose: () => void;
} {
  const stashed = new Map<string | symbol, unknown>();
  const Ctor = elementsCtorMap[type as keyof typeof elementsCtorMap];

  if (!Ctor) {
    throw new Error(`Invalid element type: ${yMap.get('type')}`);
  }

  setCreateState(true, options.skipFieldInit ?? false);

  const elementModel = new Ctor({
    yMap,
    model,
    stashedStore: stashed,
    onChange: props => options.onChange({ id, props }),
  }) as ElementModel;

  setCreateState(false, false);

  const dispose = onElementChange(yMap, props => {
    options.onChange({
      id,
      props,
    });
  });

  return {
    model: elementModel,
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

  // @ts-ignore
  return (ctor.propsToYStruct ?? ElementModel.propsToYStruct)(props);
}

export function createModelFromProps(
  props: Record<string, unknown>,
  model: SurfaceBlockModel,
  options: {
    onChange: (payload: {
      id: string;
      props: Record<string, { oldValue: unknown }>;
    }) => void;
  }
) {
  const { type, id, ...rest } = props;

  if (!id) {
    throw new Error('Cannot find id in props');
  }

  const yMap = new Workspace.Y.Map();
  const elementModel = createElementModel(
    type as string,
    id as string,
    yMap,
    model,
    options
  );

  props = propsToYStruct(type as string, props);

  yMap.set('type', type);
  yMap.set('id', id);

  Object.keys(rest).forEach(key => {
    // @ts-ignore
    elementModel.model[key] = props[key];
  });

  // @ts-ignore
  elementModel.model._preserved.clear();

  return elementModel;
}

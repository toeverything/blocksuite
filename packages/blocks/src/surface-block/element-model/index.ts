import { Workspace, type Y } from '@blocksuite/store';

import { values } from '../../_common/utils/iterable.js';
import type { SurfaceBlockModel } from '../surface-model.js';
import { ElementModel } from './base.js';
import { BrushElementModel } from './brush.js';
import { ConnectorElementModel } from './connector.js';
import { initFieldObservers, setCreateState } from './decorators.js';
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
      props: Record<string, unknown>;
      oldValues: Record<string, unknown>;
    }) => void;
    skipFieldInit?: boolean;
  }
): {
  model: ElementModel;
  unmount: () => void;
  mount: () => void;
} {
  const stashed = new Map<string | symbol, unknown>();
  const Ctor = elementsCtorMap[type as keyof typeof elementsCtorMap];

  if (!Ctor) {
    throw new Error(`Invalid element type: ${yMap.get('type')}`);
  }

  setCreateState(true, options.skipFieldInit ?? false);

  let mounted = false;
  const elementModel = new Ctor({
    yMap,
    model,
    stashedStore: stashed,
    onChange: props => mounted && options.onChange({ id, ...props }),
  }) as ElementModel;

  setCreateState(false, false);

  let disposable: () => void;

  const unmount = () => {
    mounted = false;
    values(elementModel['_observerDisposable'] ?? {}).forEach(dispose =>
      dispose()
    );
    disposable?.();
  };

  const mount = () => {
    initFieldObservers(Ctor.prototype, elementModel);
    disposable = onElementChange(yMap, payload => {
      mounted &&
        options.onChange({
          id,
          ...payload,
        });
    });
    mounted = true;
  };

  return {
    model: elementModel,
    mount,
    unmount,
  };
}

function onElementChange(
  yMap: Y.Map<unknown>,
  callback: (payload: {
    props: Record<string, unknown>;
    oldValues: Record<string, unknown>;
  }) => void
) {
  const observer = (event: Y.YMapEvent<unknown>) => {
    const props: Record<string, unknown> = {};
    const oldValues: Record<string, unknown> = {};

    event.keysChanged.forEach(key => {
      const type = event.changes.keys.get(key);
      const oldValue = event.changes.keys.get(key)?.oldValue;

      if (!type) {
        return;
      }

      if (type.action === 'update' || type.action === 'add') {
        props[key] = yMap.get(key);
        oldValues[key] = oldValue;
      }
    });

    callback({
      props,
      oldValues,
    });
  };

  yMap.observe(observer);

  return () => {
    yMap.observe(observer);
  };
}

export function propsToY(type: string, props: Record<string, unknown>) {
  const ctor = elementsCtorMap[type as keyof typeof elementsCtorMap];

  if (!ctor) {
    throw new Error(`Invalid element type: ${type}`);
  }

  // @ts-ignore
  return (ctor.propsToY ?? ElementModel.propsToY)(props);
}

export function createModelFromProps(
  props: Record<string, unknown>,
  model: SurfaceBlockModel,
  options: {
    onChange: (payload: {
      id: string;
      props: Record<string, unknown>;
      oldValues: Record<string, unknown>;
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

  props = propsToY(type as string, props);

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

export {
  BrushElementModel,
  ConnectorElementModel,
  ElementModel,
  GroupElementModel,
  ShapeElementModel,
  TextElementModel,
};

export type CanvasElement =
  | BrushElementModel
  | ConnectorElementModel
  | ShapeElementModel
  | TextElementModel
  | GroupElementModel;

export enum CanvasElementType {
  SHAPE = 'shape',
  BRUSH = 'brush',
  CONNECTOR = 'connector',
  TEXT = 'text',
  GROUP = 'group',
}
export function isCanvasElementType(type: string): type is CanvasElementType {
  return type.toLocaleUpperCase() in CanvasElementType;
}

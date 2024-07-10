import { DocCollection, type Y } from '@blocksuite/store';

import type { SurfaceBlockModel } from '../surface-model.js';
import { SurfaceElementModel } from './base.js';
import { BrushElementModel } from './brush.js';
import { ConnectorElementModel } from './connector.js';
import { initializedObservers, initializeWatchers } from './decorators.js';
import { getDecoratorState } from './decorators/common.js';
import { GroupElementModel } from './group.js';
import { MindmapElementModel } from './mindmap.js';
import { ShapeElementModel } from './shape.js';
import { TextElementModel } from './text.js';

const elementsCtorMap = {
  group: GroupElementModel,
  connector: ConnectorElementModel,
  shape: ShapeElementModel,
  brush: BrushElementModel,
  text: TextElementModel,
  mindmap: MindmapElementModel,
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
      local: boolean;
    }) => void;
    skipFieldInit?: boolean;
    newCreate?: boolean;
  }
): {
  model: SurfaceElementModel;
  unmount: () => void;
  mount: () => void;
} {
  const stashed = new Map<string | symbol, unknown>();
  const Ctor = elementsCtorMap[type as keyof typeof elementsCtorMap];

  if (!Ctor) {
    throw new Error(`Invalid element type: ${yMap.get('type')}`);
  }
  const state = getDecoratorState();

  state.creating = true;
  state.skipYfield = options.skipFieldInit ?? false;

  let mounted = false;
  const elementModel = new Ctor({
    id,
    yMap,
    model,
    stashedStore: stashed,
    onChange: payload => mounted && options.onChange({ id, ...payload }),
  }) as SurfaceElementModel;

  state.creating = false;
  state.skipYfield = false;

  const unmount = () => {
    mounted = false;
    elementModel['_disposable'].dispose();
  };

  const mount = () => {
    initializedObservers(Ctor.prototype, elementModel);
    initializeWatchers(Ctor.prototype, elementModel);
    elementModel['_disposable'].add(
      onElementChange(yMap, payload => {
        mounted &&
          options.onChange({
            id,
            ...payload,
          });
      })
    );
    elementModel['_preserved'].clear();
    mounted = true;
    elementModel.onCreated();
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
    local: boolean;
  }) => void
) {
  const observer = (
    event: Y.YMapEvent<unknown>,
    transaction: Y.Transaction
  ) => {
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
      local: transaction.local,
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
  return (ctor.propsToY ?? SurfaceElementModel.propsToY)(props);
}

export function createModelFromProps(
  props: Record<string, unknown>,
  model: SurfaceBlockModel,
  options: {
    onChange: (payload: {
      id: string;
      props: Record<string, unknown>;
      oldValues: Record<string, unknown>;
      local: boolean;
    }) => void;
  }
) {
  const { type, id, ...rest } = props;

  if (!id) {
    throw new Error('Cannot find id in props');
  }

  const yMap = new DocCollection.Y.Map();
  const elementModel = createElementModel(
    type as string,
    id as string,
    yMap,
    model,
    {
      ...options,
      newCreate: true,
    }
  );

  props = propsToY(type as string, props);

  yMap.set('type', type);
  yMap.set('id', id);

  Object.keys(rest).forEach(key => {
    if (props[key] !== undefined) {
      // @ts-ignore
      elementModel.model[key] = props[key];
    }
  });

  return elementModel;
}

export {
  BrushElementModel,
  ConnectorElementModel,
  GroupElementModel,
  MindmapElementModel,
  ShapeElementModel,
  SurfaceElementModel,
  TextElementModel,
};

export enum CanvasElementType {
  SHAPE = 'shape',
  BRUSH = 'brush',
  CONNECTOR = 'connector',
  TEXT = 'text',
  GROUP = 'group',
  MINDMAP = 'mindmap',
}

export type ElementModelMap = {
  ['shape']: ShapeElementModel;
  ['brush']: BrushElementModel;
  ['connector']: ConnectorElementModel;
  ['text']: TextElementModel;
  ['group']: GroupElementModel;
  ['mindmap']: MindmapElementModel;
};

export function isCanvasElementType(type: string): type is CanvasElementType {
  return type.toLocaleUpperCase() in CanvasElementType;
}

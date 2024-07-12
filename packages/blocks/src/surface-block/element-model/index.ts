import { DocCollection, type Y } from '@blocksuite/store';

import type { SurfaceBlockModel } from '../surface-model.js';

import { SurfaceElementModel } from './base.js';
import { BrushElementModel } from './brush.js';
import { ConnectorElementModel } from './connector.js';
import { initializeWatchers, initializedObservers } from './decorators.js';
import { getDecoratorState } from './decorators/common.js';
import { GroupElementModel } from './group.js';
import { MindmapElementModel } from './mindmap.js';
import { ShapeElementModel } from './shape.js';
import { TextElementModel } from './text.js';

const elementsCtorMap = {
  brush: BrushElementModel,
  connector: ConnectorElementModel,
  group: GroupElementModel,
  mindmap: MindmapElementModel,
  shape: ShapeElementModel,
  text: TextElementModel,
};

export function createElementModel(
  type: string,
  id: string,
  yMap: Y.Map<unknown>,
  model: SurfaceBlockModel,
  options: {
    newCreate?: boolean;
    onChange: (payload: {
      id: string;
      local: boolean;
      oldValues: Record<string, unknown>;
      props: Record<string, unknown>;
    }) => void;
    skipFieldInit?: boolean;
  }
): {
  model: SurfaceElementModel;
  mount: () => void;
  unmount: () => void;
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
    model,
    onChange: payload => mounted && options.onChange({ id, ...payload }),
    stashedStore: stashed,
    yMap,
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
    local: boolean;
    oldValues: Record<string, unknown>;
    props: Record<string, unknown>;
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
      local: transaction.local,
      oldValues,
      props,
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
      local: boolean;
      oldValues: Record<string, unknown>;
      props: Record<string, unknown>;
    }) => void;
  }
) {
  const { id, type, ...rest } = props;

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
  BRUSH = 'brush',
  CONNECTOR = 'connector',
  GROUP = 'group',
  MINDMAP = 'mindmap',
  SHAPE = 'shape',
  TEXT = 'text',
}

export type ElementModelMap = {
  ['brush']: BrushElementModel;
  ['connector']: ConnectorElementModel;
  ['group']: GroupElementModel;
  ['mindmap']: MindmapElementModel;
  ['shape']: ShapeElementModel;
  ['text']: TextElementModel;
};

export function isCanvasElementType(type: string): type is CanvasElementType {
  return type.toLocaleUpperCase() in CanvasElementType;
}

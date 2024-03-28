import { Slot } from '@blocksuite/global/utils';
import type { MigrationRunner, Y } from '@blocksuite/store';
import {
  BlockModel,
  Boxed,
  defineBlockSchema,
  DocCollection,
  Text,
} from '@blocksuite/store';

import {
  type BaseProps,
  type ElementModel,
  GroupLikeModel,
} from './element-model/base.js';
import type {
  Connection,
  ConnectorElementModel,
} from './element-model/connector.js';
import {
  createElementModel,
  createModelFromProps,
  type ElementModelMap,
  propsToY,
} from './element-model/index.js';
import { connectorMiddleware } from './middlewares/connector.js';
import {
  groupRelationMiddleware,
  groupSizeMiddleware,
} from './middlewares/group.js';
import { mindmapMiddleware } from './middlewares/mindmap.js';
import { SurfaceBlockTransformer } from './surface-transformer.js';
import { generateElementId } from './utils/index.js';

export type SurfaceBlockProps = {
  elements: Boxed<Y.Map<Y.Map<unknown>>>;
};

export interface ElementUpdatedData {
  id: string;
  props: Record<string, unknown>;
  oldValues: Record<string, unknown>;
  local: boolean;
}

const migration = {
  toV4: data => {
    const { elements } = data;
    if (elements instanceof Boxed) {
      const value = elements.getValue();
      if (!value) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const [key, element] of (value as Record<string, any>).entries()) {
        const type = element.get('type') as string;
        if (type === 'shape' || type === 'text') {
          const isBold = element.get('isBold');
          const isItalic = element.get('isItalic');
          element.delete('isBold');
          element.delete('isItalic');
          if (isBold) {
            element.set('bold', true);
          }
          if (isItalic) {
            element.set('italic', true);
          }
        }
        if (type === 'connector') {
          const source = element.get('source');
          const target = element.get('target');
          const sourceId = source['id'];
          const targetId = target['id'];
          if (!source['position'] && !sourceId) {
            value.delete(key);
            return;
          }
          if (!target['position'] && !targetId) {
            value.delete(key);
            return;
          }
        }
      }
    } else {
      for (const key of Object.keys(elements)) {
        const element = elements[key] as Record<string, unknown>;
        const type = element['type'] as string;
        if (type === 'shape' || type === 'text') {
          const isBold = element['isBold'];
          const isItalic = element['isItalic'];
          delete element['isBold'];
          delete element['isItalic'];
          if (isBold) {
            element['bold'] = true;
          }
          if (isItalic) {
            element['italic'] = true;
          }
        }
        if (type === 'connector') {
          const source = element['source'] as Record<string, unknown>;
          const target = element['target'] as Record<string, unknown>;
          const sourceId = source['id'];
          const targetId = target['id'];
          // @ts-expect-error
          if (!source['position'] && (!sourceId || !elements[sourceId])) {
            delete elements[key];
            return;
          }
          // @ts-expect-error
          if (!target['position'] && (!targetId || !elements[targetId])) {
            delete elements[key];
            return;
          }
        }
      }
    }
  },
  toV5: data => {
    const { elements } = data;
    if (!((elements as object | Boxed) instanceof Boxed)) {
      const yMap = new DocCollection.Y.Map() as Y.Map<Y.Map<unknown>>;

      Object.entries(elements).forEach(([key, value]) => {
        const map = new DocCollection.Y.Map();
        Object.entries(value).forEach(([_key, _value]) => {
          map.set(
            _key,
            _value instanceof DocCollection.Y.Text
              ? _value.clone()
              : _value instanceof Text
                ? _value.yText.clone()
                : _value
          );
        });
        yMap.set(key, map);
      });
      const wrapper = new Boxed(yMap);
      data.elements = wrapper;
    }
  },
} satisfies Record<string, MigrationRunner<typeof SurfaceBlockSchema>>;

export const SurfaceBlockSchema = defineBlockSchema({
  flavour: 'affine:surface',
  props: (internalPrimitives): SurfaceBlockProps => ({
    elements: internalPrimitives.Boxed(new DocCollection.Y.Map()),
  }),
  metadata: {
    version: 5,
    role: 'hub',
    parent: ['affine:page'],
    children: [
      'affine:frame',
      'affine:image',
      'affine:bookmark',
      'affine:attachment',
      'affine:embed-*',
    ],
  },
  onUpgrade: (data, previousVersion, version) => {
    if (previousVersion < 4 && version >= 4) {
      migration.toV4(data);
    }
    if (previousVersion < 5 && version >= 5) {
      migration.toV5(data);
    }
  },
  transformer: () => new SurfaceBlockTransformer(),
  toModel: () => new SurfaceBlockModel(),
});

export class SurfaceBlockModel extends BlockModel<SurfaceBlockProps> {
  private _elementModels: Map<
    string,
    { mount: () => void; unmount: () => void; model: ElementModel }
  > = new Map();
  private _disposables: Array<() => void> = [];
  private _groupToElements: Map<string, string[]> = new Map();
  private _elementToGroup: Map<string, string> = new Map();
  private _connectorToElements: Map<string, string[]> = new Map();
  private _elementToConnector: Map<string, string[]> = new Map();

  elementUpdated = new Slot<ElementUpdatedData>();
  elementAdded = new Slot<{ id: string; local: boolean }>();
  elementRemoved = new Slot<{
    id: string;
    type: string;
    model: ElementModel;
    local: boolean;
  }>();

  get elementModels() {
    const models: ElementModel[] = [];
    this._elementModels.forEach(model => models.push(model.model));
    return models;
  }

  constructor() {
    super();
    this.created.once(() => this._init());
  }

  private _init() {
    this._initElementModels();
    this._watchGroupRelationChange();
    this._watchConnectorRelationChange();
    this._applyMiddlewares();
  }

  private _applyMiddlewares() {
    this._disposables.push(
      connectorMiddleware(this),
      groupRelationMiddleware(this),
      groupSizeMiddleware(this),
      mindmapMiddleware(this)
    );
  }

  private _initElementModels() {
    const elementsYMap = this.elements.getValue()!;
    const onElementsMapChange = (
      event: Y.YMapEvent<Y.Map<unknown>>,
      transaction: Y.Transaction
    ) => {
      const { changes, keysChanged } = event;

      keysChanged.forEach(id => {
        const change = changes.keys.get(id);
        const element = this.elements.getValue()!.get(id);

        switch (change?.action) {
          case 'add':
            if (element) {
              if (!this._elementModels.has(id)) {
                const model = createElementModel(
                  element.get('type') as string,
                  element.get('id') as string,
                  element,
                  this,
                  {
                    onChange: payload => this.elementUpdated.emit(payload),
                    skipFieldInit: true,
                  }
                );

                this._elementModels.set(id, model);
              }
              const { mount } = this._elementModels.get(id)!;
              mount();
              this.elementAdded.emit({ id, local: transaction.local });
            }
            break;
          case 'delete':
            if (this._elementModels.has(id)) {
              const { model, unmount } = this._elementModels.get(id)!;
              unmount();
              this.elementRemoved.emit({
                id,
                type: model.type,
                model,
                local: transaction.local,
              });
              this._elementToGroup.delete(id);
              this._elementToConnector.delete(id);
              this._elementModels.delete(id);
            }
            break;
        }
      });
    };

    elementsYMap.forEach((val, key) => {
      const model = createElementModel(
        val.get('type') as string,
        val.get('id') as string,
        val,
        this,
        {
          onChange: payload => this.elementUpdated.emit(payload),
          skipFieldInit: true,
        }
      );

      this._elementModels.set(key, model);
      model.mount();
    });
    elementsYMap.observe(onElementsMapChange);

    this._disposables.push(() => {
      elementsYMap.unobserve(onElementsMapChange);
    });
  }

  private _watchGroupRelationChange() {
    const addToGroup = (elementId: string, groupId: string) => {
      this._elementToGroup.set(elementId, groupId);
      this._groupToElements.set(
        groupId,
        (this._groupToElements.get(groupId) || []).concat(elementId)
      );
    };
    const removeFromGroup = (elementId: string, groupId: string) => {
      if (this._elementToGroup.has(elementId)) {
        const group = this._elementToGroup.get(elementId)!;
        if (group === groupId) {
          this._elementToGroup.delete(elementId);
        }
      }

      if (this._groupToElements.has(groupId)) {
        const elements = this._groupToElements.get(groupId)!;
        const index = elements.indexOf(elementId);

        if (index !== -1) {
          elements.splice(index, 1);
          elements.length === 0 && this._groupToElements.delete(groupId);
        }
      }
    };
    const isGroup = (
      element: ElementModel
    ): element is GroupLikeModel<BaseProps> =>
      element instanceof GroupLikeModel;

    this.elementModels.forEach(model => {
      if (isGroup(model)) {
        model.childIds.forEach(childId => {
          addToGroup(childId, model.id);
        });
      }
    });

    this.elementUpdated.on(({ id, oldValues }) => {
      const element = this.getElementById(id)!;

      if (isGroup(element) && oldValues['childIds']) {
        (oldValues['childIds'] as string[]).forEach(childId => {
          removeFromGroup(childId, id);
        });

        element.childIds.forEach(childId => {
          addToGroup(childId, id);
        });

        if (element.childIds.length === 0) {
          this.removeElement(id);
        }
      }
    });

    this.elementAdded.on(({ id }) => {
      const element = this.getElementById(id)!;

      if (isGroup(element)) {
        element.childIds.forEach(childId => {
          addToGroup(childId, id);
        });
      }
    });

    this.elementRemoved.on(({ id, model }) => {
      if (isGroup(model)) {
        const children = [...(this._groupToElements.get(id) || [])];

        children.forEach(childId => removeFromGroup(childId, id));
      }
    });
  }

  private _watchConnectorRelationChange() {
    const addConnector = (targetId: string, connectorId: string) => {
      const connectors = this._elementToConnector.get(targetId);

      if (!connectors) {
        this._elementToConnector.set(targetId, [connectorId]);
      } else {
        connectors.push(connectorId);
      }

      this._connectorToElements.set(
        connectorId,
        (this._connectorToElements.get(connectorId) || []).concat(targetId)
      );
    };
    const removeConnector = (targetId: string, connectorId: string) => {
      if (this._elementToConnector.has(targetId)) {
        const connectors = this._elementToConnector.get(targetId)!;
        const index = connectors.indexOf(connectorId);

        if (index !== -1) {
          connectors.splice(index, 1);
          connectors.length === 0 && this._elementToConnector.delete(targetId);
        }
      }

      if (this._connectorToElements.has(connectorId)) {
        const elements = this._connectorToElements.get(connectorId)!;
        const index = elements.indexOf(targetId);

        if (index !== -1) {
          elements.splice(index, 1);
          elements.length === 0 &&
            this._connectorToElements.delete(connectorId);
        }
      }
    };

    const updateConnectorMap = (
      element: ElementModel,
      type: 'add' | 'remove'
    ) => {
      if (element.type !== 'connector') return;

      const connector = element as ConnectorElementModel;
      const connected = [connector.source.id, connector.target.id];
      const action = type === 'add' ? addConnector : removeConnector;

      connected.forEach(id => {
        id && action(id, connector.id);
      });
    };

    this.elementModels.forEach(model => updateConnectorMap(model, 'add'));

    this.elementUpdated.on(({ id, oldValues }) => {
      const element = this.getElementById(id)!;

      if (
        element.type !== 'connector' ||
        (!oldValues['source'] && !oldValues['target'])
      )
        return;

      const oldConnected = [
        (oldValues['source'] as Connection)?.id,
        (oldValues['target'] as Connection)?.id,
      ];

      oldConnected.forEach(id => {
        id && removeConnector(id, element.id);
      });

      updateConnectorMap(element, 'add');
    });

    this.elementAdded.on(id =>
      updateConnectorMap(this.getElementById(id.id)!, 'add')
    );

    this.elementRemoved.on(({ id, type }) => {
      if (type === 'connector') {
        const connected = [...(this._connectorToElements.get(id) || [])];

        connected.forEach(connectedId => removeConnector(connectedId, id));
      }
    });
  }

  override dispose(): void {
    super.dispose();

    this._disposables.forEach(dispose => dispose());

    this.elementAdded.dispose();
    this.elementRemoved.dispose();
    this.elementUpdated.dispose();

    this._elementModels.forEach(({ unmount }) => unmount());
    this._elementModels.clear();
  }

  isInMindmap(id: string) {
    const group = this.getGroup(id);

    return group?.type === 'mindmap';
  }

  getConnectors(id: string) {
    return (this._elementToConnector.get(id) || []).map(
      id => this.getElementById(id)!
    ) as ConnectorElementModel[];
  }

  getGroup<T extends GroupLikeModel<BaseProps> = GroupLikeModel<BaseProps>>(
    id: string
  ): T | null {
    return this._elementToGroup.has(id)
      ? (this.getElementById(this._elementToGroup.get(id)!) as T)
      : null;
  }

  getGroups(id: string): GroupLikeModel<BaseProps>[] {
    const groups: GroupLikeModel<BaseProps>[] = [];
    let group = this.getGroup(id);

    while (group) {
      groups.push(group);
      group = this.getGroup(group.id);
    }

    return groups;
  }

  getElementsByType<K extends keyof ElementModelMap>(
    type: K
  ): ElementModelMap[K][] {
    return this.elementModels.filter(
      model => model.type === type
    ) as ElementModelMap[K][];
  }

  getElementById(id: string): ElementModel | null {
    return this._elementModels.get(id)?.model ?? null;
  }

  addElement<T extends object = Record<string, unknown>>(
    props: Partial<T> & { type: string }
  ) {
    if (this.doc.readonly) {
      throw new Error('Cannot add element in readonly mode');
    }

    const id = generateElementId();

    // @ts-ignore
    props.id = id;

    const elementModel = createModelFromProps(props, this, {
      onChange: payload => this.elementUpdated.emit(payload),
    });

    this._elementModels.set(id, elementModel);

    this.doc.transact(() => {
      this.elements.getValue()!.set(id, elementModel.model.yMap);
    });

    return id;
  }

  removeElement(id: string) {
    if (this.doc.readonly) {
      throw new Error('Cannot remove element in readonly mode');
    }

    if (!this.getElementById(id)) {
      return;
    }

    this.doc.transact(() => {
      const element = this.getElementById(id)!;

      this.elements.getValue()!.delete(id);

      if (element instanceof GroupLikeModel) {
        element.childIds.forEach(childId => {
          this.removeElement(childId);
        });
      }
    });
  }

  updateElement<T extends object = Record<string, unknown>>(
    id: string,
    props: Partial<T>
  ) {
    if (this.doc.readonly) {
      throw new Error('Cannot update element in readonly mode');
    }

    const elementModel = this.getElementById(id);

    if (!elementModel) {
      throw new Error(`Element ${id} is not found`);
    }

    this.doc.transact(() => {
      props = propsToY(
        elementModel.type,
        props as Record<string, unknown>
      ) as T;
      Object.entries(props).forEach(([key, value]) => {
        // @ts-ignore
        elementModel[key] = value;
      });
    });
  }
}
